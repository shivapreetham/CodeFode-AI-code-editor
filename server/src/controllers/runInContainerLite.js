import { spawn } from "child_process";
import { writeFile, unlink, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import os from "os";
import { logger } from "../middleware/logger.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Reduced timeout for free tier
const TIMEOUT = 3000;

// Lighter execution queue for free tier
class LiteExecutionQueue {
  constructor(concurrentLimit = 1) { // Reduced from 2
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
      const result = await this.executeJobSafely(job.data);
      job.resolve(result);
    } catch (error) {
      logger.error('Lite execution job failed', { 
        jobId: job.id, 
        error: error.message 
      });
      job.reject(error);
    } finally {
      this.running.delete(job.id);
      setImmediate(() => this.processNext());
    }
  }

  async executeJobSafely(jobData) {
    const { language, code, executionId } = jobData;
    return await executeCodeDirectLite(language, code, executionId);
  }

  getStats() {
    return {
      queueLength: this.queue.length,
      runningJobs: this.running.size,
      concurrentLimit: this.concurrentLimit
    };
  }
}

const executionQueue = new LiteExecutionQueue(1);

// Lite version - supports JavaScript, Python, C++, and Java (if available)
async function executeCodeDirectLite(language, code, executionId) {
  try {
    const startTime = Date.now();
    let result;

    switch (language) {
      case "python": {
        // Check if Python is available
        if (!await isPythonAvailable()) {
          return {
            success: false,
            output: `🐍 Python not available on this server.\n\n✅ Available languages: JavaScript${await isCppAvailable() ? ', C++' : ''}${await isJavaAvailable() ? ', Java' : ''}\n\n💡 Python installation may have failed during deployment.`,
            metadata: {
              executionId,
              language,
              error: true,
              tier: 'free',
              reason: 'python_not_installed',
              timestamp: new Date().toISOString()
            }
          };
        }

        const process = spawn("python3", ["-c", code]);
        result = await handleProcess(process, "python3", executionId);
        break;
      }

      case "javascript": {
        const process = spawn("node", ["-e", code]);
        result = await handleProcess(process, "node", executionId);
        break;
      }

      case "cpp": {
        // Check if C++ compiler is available
        if (!await isCppAvailable()) {
          return {
            success: false,
            output: `🔧 C++ compiler (g++) not available on this server.\n\n✅ Available languages: JavaScript, Python${await isJavaAvailable() ? ', Java' : ''}\n\n💡 C++ installation may have failed during deployment.`,
            metadata: {
              executionId,
              language,
              error: true,
              tier: 'free',
              reason: 'cpp_not_installed',
              timestamp: new Date().toISOString()
            }
          };
        }

        const filename = `temp_${executionId}`;
        const tmpDir = os.tmpdir();
        const filepath = path.join(tmpDir, filename);

        try {
          await writeFile(`${filepath}.cpp`, code);
        } catch (writeError) {
          return {
            success: false,
            output: `📁 Failed to create temporary file: ${writeError.message}`,
            metadata: {
              executionId,
              language,
              error: true,
              reason: 'file_write_error',
              timestamp: new Date().toISOString()
            }
          };
        }

        // Compile with basic options for free tier
        const compileProcess = spawn("g++", [
          `${filepath}.cpp`,
          "-o",
          filepath,
          "-std=c++14" // Use C++14 for compatibility
        ]);
        const compileResult = await handleProcess(compileProcess, "g++", executionId);

        if (!compileResult.success) {
          await cleanupLite(filepath, executionId, "cpp");
          // Enhance compilation error message
          return {
            ...compileResult,
            output: `❌ C++ Compilation Error:\n\n${compileResult.output}\n\n💡 Common issues:\n• Missing semicolons\n• Undeclared variables\n• Header file problems\n• Syntax errors`
          };
        }

        // Run
        const runProcess = spawn(filepath);
        result = await handleProcess(runProcess, "cpp-exec", executionId);

        await cleanupLite(filepath, executionId, "cpp");
        break;
      }

      case "java": {
        // Check if Java is available first
        const javaAvailable = await isJavaAvailable();
        if (!javaAvailable) {
          return {
            success: false,
            output: `☕ Java not available on this server.\n\n✅ Available languages: JavaScript, Python, C++\n\n💡 Java installation may have failed during deployment or this server doesn't support it.`,
            metadata: {
              executionId,
              language,
              error: true,
              tier: 'free',
              reason: 'java_not_installed',
              timestamp: new Date().toISOString()
            }
          };
        }

        const className = extractJavaClassName(code) || "Main";
        const filename = `${className}_${executionId}`;
        const tmpDir = os.tmpdir();
        const filepath = path.join(tmpDir, filename);

        try {
          await writeFile(`${filepath}.java`, code);
        } catch (writeError) {
          return {
            success: false,
            output: `📁 Failed to create temporary file: ${writeError.message}`,
            metadata: {
              executionId,
              language,
              error: true,
              reason: 'file_write_error',
              timestamp: new Date().toISOString()
            }
          };
        }

        // Compile
        const compileProcess = spawn("javac", [`${filepath}.java`]);
        const compileResult = await handleProcess(compileProcess, "javac", executionId);

        if (!compileResult.success) {
          await cleanupLite(filepath, executionId, "java");
          // Enhance Java compilation error message
          return {
            ...compileResult,
            output: `❌ Java Compilation Error:\n\n${compileResult.output}\n\n💡 Common issues:\n• Class name must match filename\n• Missing main method\n• Syntax errors\n• Import statement problems\n• Missing semicolons or braces`
          };
        }

        // Run
        const runProcess = spawn("java", ["-cp", tmpDir, `${className}_${executionId}`]);
        result = await handleProcess(runProcess, "java-exec", executionId);

        await cleanupLite(filepath, executionId, "java");
        break;
      }

      default:
        const javaStatus = await isJavaAvailable();
        const availableLanguages = ['JavaScript', 'Python', 'C++'];
        if (javaStatus) {
          availableLanguages.push('Java');
        }
        
        return {
          success: false,
          output: `❌ Language "${language}" is not supported.\n\n✅ Supported languages on this server:\n${availableLanguages.map(lang => `• ${lang}`).join('\n')}\n\n💡 Make sure your file has the correct extension:\n• .js for JavaScript\n• .py for Python\n• .cpp for C++\n• .java for Java`,
          metadata: {
            executionId,
            language,
            error: true,
            tier: 'free',
            reason: 'unsupported_language',
            supportedLanguages: availableLanguages,
            timestamp: new Date().toISOString()
          }
        };
    }

    const executionTime = Date.now() - startTime;
    return {
      ...result,
      metadata: {
        executionId,
        language,
        executionTime,
        tier: 'free',
        timestamp: new Date().toISOString()
      }
    };

  } catch (error) {
    logger.error('Lite code execution error', { 
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
        tier: 'free',
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
      logger.warn('Process execution timed out (free tier)', { executionId, command });
      resolve({
        success: false,
        output: `⏱️ Execution timed out after ${TIMEOUT/1000} seconds (free tier limit)`,
      });
    }, TIMEOUT);

    process.on("error", (err) => {
      clearTimeout(timeoutId);
      logger.error('Process spawn error (free tier)', { executionId, command, error: err.message });
      
      if (err.code === 'ENOENT') {
        if (command === 'python3') {
          try {
            const fallbackProcess = spawn("python", ["-c", process.spawnargs[1]]);
            return resolve(handleProcess(fallbackProcess, "python", executionId));
          } catch (fallbackErr) {
            return resolve({
              success: false,
              output: "❌ Python not available on this free tier server"
            });
          }
        } else {
          return resolve({
            success: false,
            output: `❌ ${command || 'Command'} not available on free tier`
          });
        }
      } else {
        return resolve({
          success: false,
          output: `❌ Error: ${err.message}`
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
        resolve({
          success,
          output: error || output,
          exitCode: code
        });
      }
    });
  });
}

// Public API for lite execution
async function executeCodeLite(language, code) {
  try {
    const executionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    logger.info('Lite code execution requested', { 
      language, 
      executionId,
      codeLength: code.length
    });

    return await executionQueue.add({
      language,
      code,
      executionId
    });
  } catch (error) {
    logger.error('Lite code execution error', { error: error.message });
    return {
      success: false,
      output: error.message,
      metadata: {
        executionId: null,
        tier: 'free',
        queuedAt: new Date().toISOString()
      }
    };
  }
}

// Helper functions for lite execution
async function fileExists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function cleanupLite(filepath, executionId, type) {
  try {
    let filesToClean = [];
    
    if (type === "cpp") {
      filesToClean = [`${filepath}.cpp`, filepath];
    } else if (type === "java") {
      filesToClean = [`${filepath}.java`, `${filepath}.class`];
    }
    
    for (const file of filesToClean) {
      if (await fileExists(file)) {
        await unlink(file);
        logger.debug('Cleaned up lite temporary file', { executionId, file, type });
      }
    }
  } catch (e) {
    logger.error("Lite cleanup error", { executionId, filepath, type, error: e.message });
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

async function isJavaAvailable() {
  try {
    const javaCheck = spawn("java", ["-version"]);
    const result = await new Promise((resolve) => {
      javaCheck.on("error", () => resolve(false));
      javaCheck.on("close", (code) => resolve(code === 0));
    });
    return result;
  } catch {
    return false;
  }
}

async function isCppAvailable() {
  try {
    const cppCheck = spawn("g++", ["--version"]);
    const result = await new Promise((resolve) => {
      cppCheck.on("error", () => resolve(false));
      cppCheck.on("close", (code) => resolve(code === 0));
    });
    return result;
  } catch {
    return false;
  }
}

async function isPythonAvailable() {
  try {
    const pythonCheck = spawn("python3", ["--version"]);
    const result = await new Promise((resolve) => {
      pythonCheck.on("error", () => resolve(false));
      pythonCheck.on("close", (code) => resolve(code === 0));
    });
    return result;
  } catch {
    return false;
  }
}

export default executeCodeLite;
export const getExecutionStatsLite = () => executionQueue.getStats();