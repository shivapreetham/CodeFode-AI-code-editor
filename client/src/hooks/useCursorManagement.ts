import { useRef, useCallback } from 'react';
import { ACTIONS } from '@/app/helpers/Actions';

interface UseCursorManagementProps {
  socketRef: any;
  roomId: string;
  username: string | null;
  activeFile: any;
}

export const useCursorManagement = ({
  socketRef,
  roomId,
  username,
  activeFile
}: UseCursorManagementProps) => {
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const remoteCursorDecorations = useRef<{ [key: string]: string[] }>({});

  const updateRemoteCursor = useCallback((
    remoteUserId: string,
    position: any,
    remoteUsername: string
  ) => {
    if (!editorRef.current || !monacoRef.current) return;
    
    console.log("Updating remote cursor for:", remoteUserId, "at", position);

    const newDecorations = [
      {
        range: new monacoRef.current.Range(
          position.lineNumber,
          position.column,
          position.lineNumber,
          position.column
        ),
        options: {
          className: "remote-cursor",
          beforeContentClassName: "remote-cursor-label",
          hoverMessage: { value: `👤 ${remoteUsername}` },
        },
      },
    ];

    const oldDecorations = remoteCursorDecorations.current[remoteUserId] || [];
    const newDecoIds = editorRef.current.deltaDecorations(
      oldDecorations,
      newDecorations
    );

    remoteCursorDecorations.current[remoteUserId] = newDecoIds;
  }, []);

  const handleEditorDidMount = useCallback((editor: any, monaco: any) => {
    console.log("Monaco Editor mounted");
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Listen for local cursor position changes and emit the event
    editor.onDidChangeCursorPosition((e: any) => {
      const currentFilePath = activeFile?.path;
      
      if (!currentFilePath || !username) {
        return;
      }

      const payload = {
        roomId,
        username,
        position: {
          line: e.position.lineNumber,
          ch: e.position.column
        },
        filePath: currentFilePath,
      };
      
      socketRef?.current?.emit(ACTIONS.CURSOR_CHANGE, payload);
    });
  }, [activeFile, username, roomId, socketRef]);

  const handleCursorChange = useCallback((data: any) => {
    if (data.username === username) return;
    updateRemoteCursor(data.username, data.position, data.username);
  }, [username, updateRemoteCursor]);

  return {
    editorRef,
    monacoRef,
    handleEditorDidMount,
    handleCursorChange,
  };
}; 