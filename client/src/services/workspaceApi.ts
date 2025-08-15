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
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workspaceData),
      });


      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Save workspace error:', response.status, errorData);
        throw new Error(`Workspace save error: ${response.status} - ${errorData.message}`);
      }

      const responseData = await response.json();
      return responseData;
    } catch (error) {
      console.error('❌ Workspace save error:', error);
      throw error;
    }
  },

  getWorkspace: async (roomId: string | undefined) => {
    try {
      console.log('🔍 DEBUG: BASE_URL:', BASE_URL);
      
      // Aggressive validation
      const validatedRoomId = validateRoomId(roomId);
      
      // Fix: Use absolute URL construction
      const url = buildApiUrl(`/api/workspace/${validatedRoomId}`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip, deflate, br'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null; // Return null for new workspaces
        }
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('❌ Fetch workspace error:', response.status, errorData);
        throw new Error(`Workspace fetch error: ${response.status} - ${errorData.message}`);
      }

      const responseData = await response.json();
      // Handle wrapped response from server
      const actualData = responseData.data || responseData;
      
      // Convert array back to Map before returning
      if (actualData && actualData.filesContent) {
        const filesContentMap = new Map(
          actualData.filesContent.map((item: FileContentItem) => [item.path, item.file])
        );
        return {
          ...actualData,
          filesContentMap 
        };
      }

      return actualData;
    } catch (error) {
      console.error('❌ Workspace fetch error:', error);
      throw error;
    }
  }
};
