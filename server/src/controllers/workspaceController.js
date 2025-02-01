import { Workspace } from "../models/workspace.js";

export const createOrUpdateWorkspace = async (req, res) => {
  console.log('Received workspace update request');
  
  try {
    const { roomId, fileExplorerData, openFiles, activeFile, filesContentMap } = req.body;
    
    const processedFilesContentMap = filesContentMap instanceof Map ? 
      Object.fromEntries(filesContentMap) : 
      filesContentMap;

    const workspace = await Workspace.findOneAndUpdate(
      { roomId },
      {
        fileExplorerData,
        openFiles,
        activeFile,
        filesContentMap: processedFilesContentMap,
        lastUpdated: new Date()
      },
      { upsert: true, new: true }
    );
    
    console.log('Workspace updated successfully:', workspace._id);
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

    return res.status(200).json(workspace);
  } catch (error) {
    console.error("Workspace load error:", error);
    return res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};