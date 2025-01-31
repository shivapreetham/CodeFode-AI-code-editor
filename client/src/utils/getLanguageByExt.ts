const extensionToLanguageMap: { [key: string]: string } = {
  js: "javascript",
  jsx: "javascript (react)",
  ts: "typescript",
  tsx: "typescript (react)",
  py: "python",
  rb: "ruby",
  java: "java",
  kt: "kotlin",
  cpp: "cpp",
  c: "c",
  cs: "c#",
  go: "go",
  php: "php",
  html: "html",
  css: "css",
  scss: "sass",
  md: "markdown",
  json: "json",
  xml: "xml",
  sql: "sql",
  sh: "shell script",
};

const getLanguageByFileExtension = (extension: string) => {
  return extensionToLanguageMap[extension];
};

export { getLanguageByFileExtension };
