// import { spawn } from "child_process";
// import { writeFile, unlink } from "fs/promises";
// import path from "path";
// import { fileURLToPath } from "url";
// import { dirname } from "path";

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = dirname(__filename);

// // Set execution timeout (5 seconds)
// const TIMEOUT = 5000;

// async function executeCode(language, code) {
//   try {
//     switch (language) {
//       case "python": {
//         const process = spawn("python3", ["-c", code]);
//         return handleProcess(process);
//       }

//       case "javascript": {
//         const process = spawn("node", ["-e", code]);
//         return handleProcess(process);
//       }

//       case "cpp": {
//         const filename = `temp_${Date.now()}`;
//         const filepath = path.join("/tmp", filename);
//         // console.log(filepath);

//         await writeFile(`${filepath}.cpp`, code);

//         // First compile
//         const compileProcess = spawn("g++", [
//           `${filepath}.cpp`,
//           "-o",
//           filepath,
//         ]);
//         const compileResult = await handleProcess(compileProcess);

//         if (!compileResult.success) {
//           // Cleanup and return compilation error
//           await cleanup(filepath);
//           return compileResult;
//         }

//         // Then run
//         const runProcess = spawn(filepath);
//         const result = await handleProcess(runProcess);

//         // Cleanup
//         await cleanup(filepath);
//         return result;
//       }

//       default:
//         throw new Error("Unsupported language");
//     }
//   } catch (error) {
//     return {
//       success: false,
//       output: error.message,
//     };
//   }
// }

// function handleProcess(process) {
//   return new Promise((resolve) => {
//     let output = "";
//     let error = "";
//     let killed = false;

//     // Set timeout
//     const timeoutId = setTimeout(() => {
//       process.kill();
//       killed = true;
//       resolve({
//         success: false,
//         output: "Execution timed out",
//       });
//     }, TIMEOUT);

//     process.stdout.on("data", (data) => {
//       output += data.toString();
//     });

//     process.stderr.on("data", (data) => {
//       error += data.toString();
//     });

//     process.on("close", (code) => {
//       clearTimeout(timeoutId);
//       if (!killed) {
//         resolve({
//           success: code === 0,
//           output: error || output,
//         });
//       }
//     });
//   });
// }

// async function cleanup(filepath) {
//   try {
//     await unlink(`${filepath}.cpp`);
//     await unlink(filepath);
//   } catch (e) {
//     console.error("Cleanup error:", e);
//   }
// }

// export default executeCode;

import { spawn } from "child_process";
import { writeFile, unlink, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import os from "os";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set execution timeout (5 seconds)
const TIMEOUT = 5000;

async function executeCode(language, code) {
  try {
    switch (language) {
      case "python": {
        // Try python3 first, then python as fallback
        const process = spawn("python3", ["-c", code]);
        return handleProcess(process, "python3");
      }

      case "javascript": {
        const process = spawn("node", ["-e", code]);
        return handleProcess(process);
      }

      case "cpp": {
        const filename = `temp_${Date.now()}`;
        const tmpDir = os.tmpdir(); // ✅ cross-platform temp dir
        const filepath = path.join(tmpDir, filename);

        await writeFile(`${filepath}.cpp`, code);

        // Compile
        const compileProcess = spawn("g++", [
          `${filepath}.cpp`,
          "-o",
          filepath,
        ]);
        const compileResult = await handleProcess(compileProcess);

        if (!compileResult.success) {
          await cleanup(filepath);
          return compileResult;
        }

        // Run
        const runProcess = spawn(filepath);
        const result = await handleProcess(runProcess);

        await cleanup(filepath);
        return result;
      }

      default:
        throw new Error("Unsupported language");
    }
  } catch (error) {
    return {
      success: false,
      output: error.message,
    };
  }
}

function handleProcess(process, command = null) {
  return new Promise((resolve) => {
    let output = "";
    let error = "";
    let killed = false;

    const timeoutId = setTimeout(() => {
      process.kill();
      killed = true;
      resolve({
        success: false,
        output: "Execution timed out",
      });
    }, TIMEOUT);

    // Handle spawn errors (like ENOENT)
    process.on("error", (err) => {
      clearTimeout(timeoutId);
      if (err.code === 'ENOENT') {
        if (command === 'python3') {
          // Try fallback to 'python'
          try {
            const fallbackProcess = spawn("python", ["-c", process.spawnargs[1]]);
            return resolve(handleProcess(fallbackProcess, "python"));
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
        resolve({
          success: code === 0,
          output: error || output,
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

async function cleanup(filepath) {
  try {
    if (await fileExists(`${filepath}.cpp`)) {
      await unlink(`${filepath}.cpp`);
    }
    if (await fileExists(filepath)) {
      await unlink(filepath);
    }
  } catch (e) {
    console.error("Cleanup error:", e);
  }
}

export default executeCode;
