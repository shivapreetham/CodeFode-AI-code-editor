import { Workspace } from "../models/workspace.js";

export const createOrUpdateWorkspace = async (req, res) => {
  console.log('Received workspace update request');
  
  try {
    const { roomId, fileExplorerData, openFiles, activeFile, filesContent } = req.body;
    // console.log("Received data:", {
    //   roomId,
    //   fileExplorerDataSize: fileExplorerData ? Object.keys(fileExplorerData).length : 0,
    //   openFilesCount: openFiles?.length,
    //   activeFile: activeFile?.name,
    //   filesContentCount: filesContent?.length
    // });

    if (!roomId) {
      return res.status(400).json({ error: "Room ID is required" });
    }

    const processedFilesContent = filesContent.map(item => ({
      path: item.path,
      file: {
        name: item.file.name,
        content: item.file.content,
        language: item.file.language,
        path: item.file.path
      }
    }));

    const updateData = {
      fileExplorerData,
      openFiles: openFiles.map(file => ({
        name: file.name,
        content: file.content,
        language: file.language,
        path: file.path
      })),
      activeFile: activeFile ? {
        name: activeFile.name,
        content: activeFile.content,
        language: activeFile.language,
        path: activeFile.path
      } : null,
      filesContent: processedFilesContent,
      lastUpdated: new Date()
    };

    const workspace = await Workspace.findOneAndUpdate(
      { roomId },
      updateData,
      { 
        upsert: true, 
        new: true,
        runValidators: true 
      }
    );
    
    // console.log('Workspace updated successfully:', workspace._id);
    return res.status(200).json(workspace);
  } catch (error) {
    console.error("Workspace save error:", error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const getWorkspace = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    if (!roomId) {
      return res.status(400).json({ error: "Room ID required" });
    }

    const workspace = await Workspace.findOne({ roomId });
    
    if (!workspace) {
      return res.status(404).json({ error: "Workspace not found" });
    }
    const workspaceObj = workspace.toObject();
    const filesContent = Array.isArray(workspaceObj.filesContent) 
      ? workspaceObj.filesContent 
      : [];

    return res.status(200).json({
      ...workspaceObj,
      filesContent
    });
  } catch (error) {
    console.error("Workspace load error:", error);
    return res.status(500).json({ 
      error: error.message 
    });
  }
};