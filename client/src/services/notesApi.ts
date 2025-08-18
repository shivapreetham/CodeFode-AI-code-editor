import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

export const notesApi = {
  async saveNotes(roomId: string, filePath: string, content: string, username: string) {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/workspace/${roomId}/notes`,
        {
          filePath,
          content,
          username
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to save notes:', error);
      throw error;
    }
  },

  async getNotes(roomId: string, filePath: string) {
    try {
      const encodedPath = encodeURIComponent(filePath);
      const response = await axios.get(
        `${API_BASE_URL}/api/workspace/${roomId}/notes/${encodedPath}`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get notes:', error);
      throw error;
    }
  },

  async getAllNotes(roomId: string) {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/workspace/${roomId}/notes`
      );
      return response.data;
    } catch (error) {
      console.error('Failed to get all notes:', error);
      throw error;
    }
  },

  async deleteNotes(roomId: string, filePath: string, username: string) {
    try {
      const encodedPath = encodeURIComponent(filePath);
      const response = await axios.delete(
        `${API_BASE_URL}/api/workspace/${roomId}/notes/${encodedPath}`,
        {
          data: { username }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to delete notes:', error);
      throw error;
    }
  }
};