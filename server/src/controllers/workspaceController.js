import { Workspace } from "../models/workspace.js";
import { asyncHandler, NotFoundError, ValidationError } from "../middleware/errorHandler.js";
import { successResponse, notFoundResponse } from "../utils/response.js";
import { logger, logDatabaseOperation } from "../middleware/logger.js";

export const createOrUpdateWorkspace = asyncHandler(async (req, res) => {
  const { roomId, fileExplorerData, openFiles, activeFile, filesContent } = req.body;
  
  logger.info('Workspace update request', { roomId, openFilesCount: openFiles?.length });
  
  // Process and sanitize files content
  const processedFilesContent = (filesContent || []).map(item => ({
    path: item.path,
    file: {
      name: item.file.name,
      content: item.file.content,
      language: item.file.language,
      path: item.file.path
    }
  }));

  // Process open files
  const processedOpenFiles = (openFiles || []).map(file => ({
    name: file.name,
    content: file.content,
    language: file.language,
    path: file.path
  }));

  // Process active file
  const processedActiveFile = activeFile ? {
    name: activeFile.name,
    content: activeFile.content,
    language: activeFile.language,
    path: activeFile.path
  } : null;

  const updateData = {
    fileExplorerData: fileExplorerData || {},
    openFiles: processedOpenFiles,
    activeFile: processedActiveFile,
    filesContent: processedFilesContent,
    lastUpdated: new Date()
  };

  logDatabaseOperation('findOneAndUpdate', 'workspaces', { roomId });
  
  const workspace = await Workspace.findOneAndUpdate(
    { roomId },
    updateData,
    { 
      upsert: true, 
      new: true,
      runValidators: true 
    }
  );
  
  logger.info('Workspace updated successfully', { 
    roomId, 
    workspaceId: workspace._id,
    filesCount: processedFilesContent.length 
  });
  
  return successResponse(res, workspace, 'Workspace updated successfully');
});

export const getWorkspace = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  
  logger.info('Workspace retrieval request', { roomId });
  
  logDatabaseOperation('findOne', 'workspaces', { roomId });
  
  const workspace = await Workspace.findOne({ roomId });
  
  if (!workspace) {
    logger.warn('Workspace not found', { roomId });
    throw new NotFoundError('Workspace not found');
  }
  
  // Ensure filesContent is always an array
  const workspaceObj = workspace.toObject();
  const filesContent = Array.isArray(workspaceObj.filesContent) 
    ? workspaceObj.filesContent 
    : [];

  const responseData = {
    ...workspaceObj,
    filesContent
  };
  
  logger.info('Workspace retrieved successfully', { 
    roomId, 
    workspaceId: workspace._id,
    filesCount: filesContent.length 
  });
  
  return successResponse(res, responseData, 'Workspace retrieved successfully');
});

export const deleteWorkspace = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  
  logger.info('Workspace deletion request', { roomId });
  
  logDatabaseOperation('findOneAndDelete', 'workspaces', { roomId });
  
  const workspace = await Workspace.findOneAndDelete({ roomId });
  
  if (!workspace) {
    logger.warn('Workspace not found for deletion', { roomId });
    throw new NotFoundError('Workspace not found');
  }
  
  logger.info('Workspace deleted successfully', { 
    roomId, 
    workspaceId: workspace._id 
  });
  
  return successResponse(res, null, 'Workspace deleted successfully');
});

export const listWorkspaces = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search } = req.query;
  const skip = (page - 1) * limit;
  
  let query = {};
  if (search) {
    query.roomId = { $regex: search, $options: 'i' };
  }
  
  logger.info('Workspaces list request', { page, limit, search });
  
  logDatabaseOperation('find', 'workspaces', { query, skip, limit });
  
  const [workspaces, total] = await Promise.all([
    Workspace.find(query)
      .select('roomId lastUpdated')
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(parseInt(limit)),
    Workspace.countDocuments(query)
  ]);
  
  logger.info('Workspaces listed successfully', { 
    count: workspaces.length,
    total,
    page,
    limit 
  });
  
  return successResponse(res, workspaces, 'Workspaces retrieved successfully');
});

// Notes endpoints
export const saveNotes = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  const { filePath, content, username } = req.body;
  
  logger.info('Notes save request', { roomId, filePath, username });
  
  if (!filePath || !username) {
    throw new ValidationError('filePath and username are required');
  }
  
  const workspace = await Workspace.findOne({ roomId });
  
  if (!workspace) {
    throw new NotFoundError('Workspace not found');
  }
  
  // Find existing note or create new one
  const existingNoteIndex = workspace.notes.findIndex(note => note.filePath === filePath);
  
  if (existingNoteIndex >= 0) {
    workspace.notes[existingNoteIndex].content = content;
    workspace.notes[existingNoteIndex].lastModified = new Date();
    workspace.notes[existingNoteIndex].modifiedBy = username;
  } else {
    workspace.notes.push({
      filePath,
      content,
      lastModified: new Date(),
      modifiedBy: username
    });
  }
  
  workspace.lastUpdated = new Date();
  await workspace.save();
  
  logger.info('Notes saved successfully', { roomId, filePath, username });
  
  return successResponse(res, workspace.notes.find(note => note.filePath === filePath), 'Notes saved successfully');
});

export const getNotes = asyncHandler(async (req, res) => {
  const { roomId, filePath } = req.params;
  
  logger.info('Notes retrieval request', { roomId, filePath });
  
  const workspace = await Workspace.findOne({ roomId });
  
  if (!workspace) {
    throw new NotFoundError('Workspace not found');
  }
  
  const note = workspace.notes.find(note => note.filePath === filePath);
  
  if (!note) {
    return successResponse(res, { filePath, content: '', lastModified: null, modifiedBy: null }, 'No notes found for this file');
  }
  
  logger.info('Notes retrieved successfully', { roomId, filePath });
  
  return successResponse(res, note, 'Notes retrieved successfully');
});

export const getAllNotes = asyncHandler(async (req, res) => {
  const { roomId } = req.params;
  
  logger.info('All notes retrieval request', { roomId });
  
  const workspace = await Workspace.findOne({ roomId });
  
  if (!workspace) {
    throw new NotFoundError('Workspace not found');
  }
  
  logger.info('All notes retrieved successfully', { roomId, notesCount: workspace.notes.length });
  
  return successResponse(res, workspace.notes, 'All notes retrieved successfully');
});

export const deleteNotes = asyncHandler(async (req, res) => {
  const { roomId, filePath } = req.params;
  const { username } = req.body;
  
  logger.info('Notes deletion request', { roomId, filePath, username });
  
  const workspace = await Workspace.findOne({ roomId });
  
  if (!workspace) {
    throw new NotFoundError('Workspace not found');
  }
  
  workspace.notes = workspace.notes.filter(note => note.filePath !== filePath);
  workspace.lastUpdated = new Date();
  await workspace.save();
  
  logger.info('Notes deleted successfully', { roomId, filePath, username });
  
  return successResponse(res, null, 'Notes deleted successfully');
});