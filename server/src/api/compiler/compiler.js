import { exec } from "child_process";
import path from "path";
import fileUtils from "../../utils/file_utils.js";

const executeCode = async (filePath, language) => {
  await fileUtils.createDir("outputs");

  let executeCodeCommand = null;
  switch (language) {
    case "cpp":
      const filename = path.basename(filePath).split(".")[0];
      const outputFilePath = `outputs/${filename}.out`;
      executeCodeCommand = `g++ ${filePath} -o ${outputFilePath} && cd outputs && ./${filename}.out`;
      break;
    case "javascript":
      executeCodeCommand = `node ${filePath}`;
      break;
    case "python":
      executeCodeCommand = `python3 ${filePath}`;
      break;
    default:
      throw new Error("Unsupported / Not found code language: ", { language });
  }

  return new Promise((resolve, reject) => {
    exec(executeCodeCommand, (error, stdout, stderr) => {
      error && reject({ error, stderr });
      stderr && reject({ stderr });
      resolve(stdout);
    });
  });
};

const executeCompiler = async (filePath, language) => {
  const response = await executeCode(filePath, language)
  await fileUtils.removeFile(filePath)
  return response;
};

export { executeCompiler };
