// import { useEffect, useState, useCallback } from "react";
// import { Socket } from "socket.io-client";
// import { useDebounceCallback } from "usehooks-ts";
// import { workspaceApi } from "@/services/workspaceApi";
// import { ACTIONS } from "@/app/helpers/Actions";
// import { IFile } from "@/interfaces/IFile";
// import { IFileExplorerNode } from "@/interfaces/IFileExplorerNode";
// import { IDataPayload } from "@/interfaces/IDataPayload";
// import toast from "react-hot-toast";

// interface UseWorkspaceProps {
//   roomId: string;
//   socket: Socket | null;
//   user: any;
// }

// const DEFAULT_FILE: IFile = {
//   name: "index.js",
//   language: "javascript",
//   content: "console.log('Happy Coding')",
//   path: "/root/index.js",
// };

// export const useWorkspace = ({ roomId, socket, user }: UseWorkspaceProps) => {
//   const [activeFile, setActiveFile] = useState<IFile>(DEFAULT_FILE);
//   const [files, setFiles] = useState<IFile[]>([DEFAULT_FILE]);
//   const [fileExplorerData, setFileExplorerData] = useState<IFileExplorerNode | null>(null);
//   const [codeOutput, setCodeOutput] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [filesContentMap] = useState(new Map<string, IFile>());

//   // Debounced save function
//   const debouncedSave = useDebounceCallback(
//     async (content: string, file: IFile) => {
//       try {
//         const updatedFile = { ...file, content };
//         filesContentMap.set(file.path, updatedFile);
        
//         const payload: IDataPayload = {
//           fileExplorerData: fileExplorerData!,
//           openFiles: files,
//           activeFile: updatedFile,
//         };

//         // Save to backend with session validation
//         await workspaceApi.saveWorkspace(roomId, payload, filesContentMap, {
//           userId: user.id,
//           email: user.email,
//         });

//         // Emit to other clients
//         socket?.emit(ACTIONS.CODE_CHANGE, {
//           roomId,
//           payload,
//           user: {
//             id: user.id,
//             name: user.name,
//             email: user.email,
//           },
//         });
//       } catch (error) {
//         console.error("Error saving workspace:", error);
//         toast.error("Failed to save workspace");
//       }
//     },
//     1500
//   );

//   // Load workspace on mount
//   useEffect(() => {
//     if (!roomId || !user) return;

//     const loadWorkspace = async () => {
//       try {
//         setLoading(true);
//         const workspace = await workspaceApi.getWorkspace(roomId, {
//           userId: user.id,
//           email: user.email,
//         });

//         if (workspace) {
//           setFileExplorerData(workspace.fileExplorerData);
//           setFiles(workspace.openFiles);
//           setActiveFile(workspace.activeFile);
          
//           filesContentMap.clear();
//           workspace.filesContentMap.forEach((file: IFile, path: string) => {
//             filesContentMap.set(path, file);
//           });
//         }
//       } catch (error) {
//         console.error("Error loading workspace:", error);
//         toast.error("Failed to load workspace");
//       } finally {
//         setLoading(false);
//       }
//     };

//     loadWorkspace();
//   }, [roomId, user]);

//   // Socket event listeners
//   useEffect(() => {
//     if (!socket) return;

//     socket.on(ACTIONS.CODE_CHANGE, ({ payload }: { payload: IDataPayload }) => {
//       if (payload.codeOutputData) {
//         setCodeOutput(payload.codeOutputData.output);
//         setLoading(["loading", "pending"].includes(payload.codeOutputData.status));
//       } else {
//         setFileExplorerData(payload.fileExplorerData);
//         setFiles(payload.openFiles);
//         filesContentMap.set(payload.activeFile.path, payload.activeFile);
//       }
//     });

//     socket.on(ACTIONS.CODE_RESULT, (result) => {
//       setLoading(false);
//       setCodeOutput(result.output);
//     });

//     return () => {
//       socket.off(ACTIONS.CODE_CHANGE);
//       socket.off(ACTIONS.CODE_RESULT);
//     };
//   }, [socket]);

//   const handleFileChange = useCallback((content: string) => {
//     debouncedSave(content, activeFile);
//   }, [debouncedSave, activeFile]);

//   const handleCloseFile = useCallback((file: IFile) => {
//     const updatedFiles = files.filter(f => f.path !== file.path);
//     const newActiveFile = updatedFiles.length > 0 ? updatedFiles[0] : DEFAULT_FILE;
    
//     setFiles(updatedFiles);
//     setActiveFile(newActiveFile);
//   }, [files]);

//   const handleRunCode = useCallback(async () => {
//     if (!socket || !user) return;

//     const fileContent = filesContentMap.get(activeFile.path)?.content;
//     const extension = activeFile.name.split(".")[1];

//     if (!["cpp", "py", "js"].includes(extension)) {
//       toast.error(`Unsupported language: ${activeFile.language}`);
//       return;
//     }

//     setLoading(true);
//     socket.emit(ACTIONS.EXECUTE_CODE, {
//       language: activeFile.language,
//       code: fileContent,
//       user: {
//         id: user.id,
//         name: user.name,
//         email: user.email,
//       },
//     });
//   }, [socket, activeFile, filesContentMap, user]);

//   const handleChangeActiveFile = useCallback((file: IFile) => {
//     setActiveFile(file);
//   }, []);

//   return {
//     activeFile,
//     files,
//     fileExplorerData,
//     codeOutput,
//     loading,
//     handleFileChange,
//     handleCloseFile,
//     handleRunCode,
//     handleChangeActiveFile,
//   };
// };