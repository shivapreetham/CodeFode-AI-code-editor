import { spawn } from "child_process";
import { writeFile, unlink, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import os from "os";
import { logger } from "../middleware/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set execution timeout (5 seconds)
const TIMEOUT = 5000;

// In-memory execution queue for Render free tier (no Redis)
class ExecutionQueue {
  constructor(concurrentLimit = 2) {
    this.queue = [];
    this.running = new Map();
    this.concurrentLimit = concurrentLimit;
    this.jobId = 0;
  }

  async add(jobData) {
    return new Promise((resolve, reject) => {
      const job = {
        id: ++this.jobId,
        data: jobData,
        resolve,
        reject,
        timestamp: Date.now()
      };

      this.queue.push(job);
      this.processNext();
    });
  }

  async processNext() {
    if (this.running.size >= this.concurrentLimit || this.queue.length === 0) {
      return;
    }

    const job = this.queue.shift();
    this.running.set(job.id, job);

    try {
      logger.info('Starting code execution job', { 
        jobId: job.id, 
        language: job.data.language,
        queueLength: this.queue.length,
        runningCount: this.running.size 
      });

      const result = await this.executeJobSafely(job.data);
      job.resolve(result);

      logger.info('Code execution job completed', { 
        jobId: job.id, 
        success: result.success 
      });

    } catch (error) {
      logger.error('Code execution job failed', { 
        jobId: job.id, 
        error: error.message 
      });
      job.reject(error);
    } finally {
      this.running.delete(job.id);
      // Process next job if queue has items
      setImmediate(() => this.processNext());
    }
  }

  async executeJobSafely(jobData) {
    const { language, code, executionId } = jobData;
    return await executeCodeDirect(language, code, executionId);
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      runningJobs: this.running.size,
      concurrentLimit: this.concurrentLimit
    };
  }
}

const executionQueue = new ExecutionQueue(2);

// Public API - queued execution
async function executeCode(language, code) {
  try {
    const executionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('Code execution requested', { 
      language, 
      executionId,
      codeLength: code.length,
      queueStats: executionQueue.getStats()
    });

    return await executionQueue.add({
      language,
      code,
      executionId
    });
  } catch (error) {
    logger.error('Code execution error', { error: error.message });
    return {
      success: false,
      output: error.message,
      metadata: {
        executionId: null,
        queuedAt: new Date().toISOString()
      }
    };
  }
}

// Direct execution (used by queue processor)
async function executeCodeDirect(language, code, executionId) {
  try {
    const startTime = Date.now();
    let result;

    switch (language) {
      case "python": {
        // Try python3 first, then python as fallback
        const process = spawn("python3", ["-c", code]);
        result = await handleProcess(process, "python3", executionId);
        break;
      }

      case "javascript": {
        const process = spawn("node", ["-e", code]);
        result = await handleProcess(process, null, executionId);
        break;
      }

      case "cpp": {
        const filename = `temp_${executionId}`;
        const tmpDir = os.tmpdir();
        const filepath = path.join(tmpDir, filename);

        await writeFile(`${filepath}.cpp`, code);

        // Compile with better C++ standard support
        const compileProcess = spawn("g++", [
          `${filepath}.cpp`,
          "-o",
          filepath,
          "-std=c++14", // Use C++14 for better compatibility with GCC 6.3.0
          "-Wall",      // Enable warnings
        ]);
        const compileResult = await handleProcess(compileProcess, null, executionId);

        if (!compileResult.success) {
          await cleanup(filepath, executionId);
          return compileResult;
        }

        // Run
        const runProcess = spawn(filepath);
        result = await handleProcess(runProcess, null, executionId);

        await cleanup(filepath, executionId);
        break;
      }


      case "java": {
        const className = extractJavaClassName(code) || "Main";
        const filename = `${className}_${executionId}`;
        const tmpDir = os.tmpdir();
        const filepath = path.join(tmpDir, filename);

        await writeFile(`${filepath}.java`, code);

        // Compile
        const compileProcess = spawn("javac", [`${filepath}.java`]);
        const compileResult = await handleProcess(compileProcess, "javac", executionId);

        if (!compileResult.success) {
          await cleanupJava(filepath, executionId);
          return compileResult;
        }

        // Run (using the class name, not the file path)
        const runProcess = spawn("java", ["-cp", tmpDir, `${className}_${executionId}`]);
        result = await handleProcess(runProcess, "java", executionId);

        await cleanupJava(filepath, executionId);
        break;
      }

      default:
        throw new Error(`Unsupported language: ${language}`);
    }

    // Add execution metadata
    const executionTime = Date.now() - startTime;
    return {
      ...result,
      metadata: {
        executionId,
        language,
        executionTime,
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    logger.error('Direct code execution error', { 
      executionId, 
      language, 
      error: error.message 
    });
    
    return {
      success: false,
      output: error.message,
      metadata: {
        executionId,
        language,
        error: true,
        timestamp: new Date().toISOString()
      }
    };
  }
}

function handleProcess(process, command = null, executionId = null) {
  return new Promise((resolve) => {
    let output = "";
    let error = "";
    let killed = false;

    const timeoutId = setTimeout(() => {
      process.kill();
      killed = true;
      logger.warn('Process execution timed out', { executionId, command });
      resolve({
        success: false,
        output: `Execution timed out after ${TIMEOUT/1000} seconds`,
      });
    }, TIMEOUT);

    // Handle spawn errors (like ENOENT)
    process.on("error", (err) => {
      clearTimeout(timeoutId);
      logger.error('Process spawn error', { executionId, command, error: err.message });
      
      if (err.code === 'ENOENT') {
        if (command === 'python3') {
          // Try fallback to 'python'
          try {
            const fallbackProcess = spawn("python", ["-c", process.spawnargs[1]]);
            return resolve(handleProcess(fallbackProcess, "python", executionId));
          } catch (fallbackErr) {
            return resolve({
              success: false,
              output: "Python is not installed or not found in PATH. Please install Python 3 to run Python code."
            });
          }
        } else {
          return resolve({
            success: false,
            output: `${command || 'Command'} not found. Please make sure it's installed and available in PATH.`
          });
        }
      } else {
        return resolve({
          success: false,
          output: `Error executing command: ${err.message}`
        });
      }
    });

    process.stdout.on("data", (data) => {
      output += data.toString();
    });

    process.stderr.on("data", (data) => {
      error += data.toString();
    });

    process.on("close", (code) => {
      clearTimeout(timeoutId);
      if (!killed) {
        const success = code === 0;
        logger.debug('Process execution completed', { 
          executionId, 
          command, 
          exitCode: code, 
          success,
          outputLength: (error || output).length
        });
        
        resolve({
          success,
          output: error || output,
          exitCode: code
        });
      }
    });
  });
}

async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function cleanup(filepath, executionId) {
  try {
    const filesToClean = [`${filepath}.cpp`, filepath];
    
    for (const file of filesToClean) {
      if (await fileExists(file)) {
        await unlink(file);
        logger.debug('Cleaned up temporary file', { executionId, file });
      }
    }
  } catch (e) {
    logger.error("Cleanup error", { executionId, filepath, error: e.message });
  }
}

async function cleanupJava(filepath, executionId) {
  try {
    const filesToClean = [`${filepath}.java`, `${filepath}.class`];
    
    for (const file of filesToClean) {
      if (await fileExists(file)) {
        await unlink(file);
        logger.debug('Cleaned up Java temporary file', { executionId, file });
      }
    }
  } catch (e) {
    logger.error("Java cleanup error", { executionId, filepath, error: e.message });
  }
}

function extractJavaClassName(code) {
  // Extract class name from Java code
  const classMatch = code.match(/public\s+class\s+(\w+)/);
  if (classMatch) {
    return classMatch[1];
  }
  
  // Fallback: look for any class declaration
  const anyClassMatch = code.match(/class\s+(\w+)/);
  if (anyClassMatch) {
    return anyClassMatch[1];
  }
  
  return "Main"; // Default class name
}

// Export queue stats for monitoring
export const getExecutionStats = () => {
  return executionQueue.getStats();
};

// Graceful shutdown
export const shutdownExecutionQueue = () => {
  logger.info('Shutting down execution queue', executionQueue.getStats());
};

export default executeCode;
