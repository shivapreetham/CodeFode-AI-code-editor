import { IDataPayload } from '@/interfaces/IDataPayload';
import { IFile } from '@/interfaces/IFile';

// Fix: Ensure BASE_URL is always a valid string, fallback to empty for relative paths
const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL?.replace(/\/$/, '') || '';

interface FileContentItem {
  path: string;
  file: IFile;
}

interface WorkspacePayload {
  roomId: string;
  fileExplorerData: IDataPayload['fileExplorerData'];
  openFiles: IFile[];
  activeFile: IFile;
  filesContent: FileContentItem[]; 
}

// Validation helper
const validateRoomId = (roomId: string | undefined): string => {
  if (!roomId || roomId === 'undefined' || roomId.trim() === '') {
    throw new Error(`Invalid roomId: ${roomId}. RoomId must be a valid non-empty string.`);
  }
  return roomId.trim();
};

// Helper to build absolute URLs
const buildApiUrl = (endpoint: string): string => {
  if (BASE_URL) {
    return `${BASE_URL}${endpoint}`;
  }
  // Fallback to absolute path - leading slash forces absolute URL
  return endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
};

export const workspaceApi = {
  saveWorkspace: async (roomId: string | undefined, payload: IDataPayload, filesContentMap: Map<string, IFile>) => {
    try {
      console.log('🔍 DEBUG: saveWorkspace called with roomId:', roomId);
      console.log('🔍 DEBUG: BASE_URL:', BASE_URL);
      
      // Aggressive validation
      const validatedRoomId = validateRoomId(roomId);
      
      // Convert Map to array of FileContentItem
      const filesContent = Array.from(filesContentMap.entries()).map(([path, file]) => ({
        path,
        file
      }));

      const workspaceData: WorkspacePayload = {
        roomId: validatedRoomId,
        fileExplorerData: payload.fileExplorerData,
        openFiles: payload.openFiles,
        activeFile: payload.activeFile,
        filesContent
      };

      // Fix: Use absolute URL construction
      const url = buildApiUrl('/api/workspace');
      console.log('🚀 Sending workspace save request to:', url);
      console.log('📦 Payload size:', JSON.stringify(workspaceData).length, 'bytes');
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workspaceData),
      });

      console.log('📡 Save response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Save workspace error:', response.status, errorData);
        throw new Error(`Workspace save error: ${response.status} - ${errorData.message}`);
      }

      const responseData = await response.json();
      console.log('✅ Workspace save successful');
      return responseData;
    } catch (error) {
      console.error('❌ Workspace save error:', error);
      throw error;
    }
  },

  getWorkspace: async (roomId: string | undefined) => {
    try {
      console.log('🔍 DEBUG: getWorkspace called with roomId:', roomId);
      console.log('🔍 DEBUG: BASE_URL:', BASE_URL);
      
      // Aggressive validation
      const validatedRoomId = validateRoomId(roomId);
      
      // Fix: Use absolute URL construction
      const url = buildApiUrl(`/api/workspace/${validatedRoomId}`);
      console.log('🚀 Fetching workspace from:', url);
      
      const response = await fetch(url);
      console.log('📡 Fetch response status:', response.status);

      if (!response.ok) {
        if (response.status === 404) {
          console.log('📝 No existing workspace found, will create new one');
          return null; // Return null for new workspaces
        }
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Fetch workspace error:', response.status, errorData);
        throw new Error(`Workspace fetch error: ${response.status} - ${errorData.message}`);
      }

      const responseData = await response.json();
      console.log('✅ Workspace fetch successful');
      console.log('📦 Received data keys:', Object.keys(responseData));

      // Convert array back to Map before returning
      if (responseData && responseData.filesContent) {
        const filesContentMap = new Map(
          responseData.filesContent.map((item: FileContentItem) => [item.path, item.file])
        );
        return {
          ...responseData,
          filesContentMap 
        };
      }

      return responseData;
    } catch (error) {
      console.error('❌ Workspace fetch error:', error);
      throw error;
    }
  }
};
