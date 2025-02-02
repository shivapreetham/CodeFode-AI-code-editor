import { IDataPayload } from '@/interfaces/IDataPayload';
import { IFile } from '@/interfaces/IFile';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

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

export const workspaceApi = {
  saveWorkspace: async (roomId: string, payload: IDataPayload, filesContentMap: Map<string, IFile>) => {
    try {
      // console.log('Preparing workspace save request:', { roomId, payload });

      // Convert Map to array of FileContentItem
      const filesContent = Array.from(filesContentMap.entries()).map(([path, file]) => ({
        path,
        file
      }));

      const workspaceData: WorkspacePayload = {
        roomId,
        fileExplorerData: payload.fileExplorerData,
        openFiles: payload.openFiles,
        activeFile: payload.activeFile,
        filesContent // Using the array instead of Map
      };

      // console.log('Sending workspace save request:', workspaceData);
      // console.log(`${BASE_URL}/api/workspace`)
      const response = await fetch(`${BASE_URL}/api/workspace`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workspaceData),
      });

      // console.log('Workspace save response:', response);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Workspace save error: ${response.status} - ${errorData.message}`);
      }

      const responseData = await response.json();
      // console.log('Workspace save response:', responseData);
      return responseData;
    } catch (error) {
      console.error('Unexpected error:', error);
      throw error;
    }
  },

  getWorkspace: async (roomId: string) => {
    try {
      // console.log('Fetching workspace:', roomId);
      const response = await fetch(`${BASE_URL}/api/workspace/${roomId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Workspace fetch error: ${response.status} - ${errorData.message}`);
      }

      const responseData = await response.json();
      // console.log('Workspace fetch response:', responseData);

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
      console.error('Unexpected error:', error);
      throw error;
    }
  }
};