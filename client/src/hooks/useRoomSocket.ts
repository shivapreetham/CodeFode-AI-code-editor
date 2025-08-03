import { useEffect, useRef } from 'react';
import { initSocket } from '@/socket';
import { ACTIONS } from '@/app/helpers/Actions';
import toast from 'react-hot-toast';

interface UseRoomSocketProps {
  roomId: string;
  username: string;
  onClientsUpdate: (clients: any[] | ((prev: any[]) => any[])) => void;
  onCodeChange: (payload: any) => void;
  onNotificationAdded: (notification: any) => void;
  onCursorChange: (data: any) => void;
  onCodeResult: (result: any) => void;
  onLoadMessages: (messages: any[]) => void;
}

export const useRoomSocket = ({
  roomId,
  username,
  onClientsUpdate,
  onCodeChange,
  onNotificationAdded,
  onCursorChange,
  onCodeResult,
  onLoadMessages
}: UseRoomSocketProps) => {
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        socketRef.current = await initSocket();

        socketRef.current.on("connect_error", (err: any) => {
          console.log("Socket error: ", err);
          toast.error("Failed to connect to server");
        });

        socketRef.current.on("connect_failed", (err: any) => {
          console.log("Socket error: ", err);
          toast.error("Connection failed");
        });

        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username,
        });

        socketRef.current.on(ACTIONS.JOINED, ({ clients, username: joinedUsername }: any) => {
          if (joinedUsername !== username) {
            toast.success(`${joinedUsername} joined the room.`);
          }
          onClientsUpdate(clients);
        });

        socketRef.current.on(ACTIONS.LOAD_MESSAGES, (chatHistory: any[]) => {
          onLoadMessages(chatHistory);
        });

        socketRef.current.on(
          ACTIONS.DISCONNECTED,
          ({ username: leftUsername, socketId }: any) => {
            toast.success(`${leftUsername} left the room.`);
            onClientsUpdate((prev: any[]) => 
              prev.filter((client: any) => client.socketId !== socketId)
            );
          }
        );

        socketRef.current.on(ACTIONS.NOTIFICATION_ADDED, ({ notification }: any) => {
          onNotificationAdded(notification);
        });

        socketRef.current.on(
          ACTIONS.CURSOR_CHANGE,
          (data: any) => {
            if (data.username === username) return;
            onCursorChange(data);
          }
        );

        socketRef.current.on(
          ACTIONS.CODE_CHANGE,
          ({ payload }: any) => {
            onCodeChange(payload);
          }
        );
        
        socketRef.current.on(ACTIONS.CODE_RESULT, (result: any) => {
          onCodeResult(result);
        });
      } catch (error) {
        console.error("Socket initialization error:", error);
        toast.error("Failed to initialize connection");
      }
    };

    if (username) {
      init();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off(ACTIONS.CODE_CHANGE);
        socketRef.current.off(ACTIONS.NOTIFICATION_ADDED);
        socketRef.current.off(ACTIONS.CURSOR_CHANGE);
        socketRef.current.off(ACTIONS.CODE_RESULT);
        socketRef.current.off(ACTIONS.LOAD_MESSAGES);
        socketRef.current.disconnect();
      }
    };
  }, [roomId, username, onClientsUpdate, onCodeChange, onNotificationAdded, onCursorChange, onCodeResult, onLoadMessages]);

  return socketRef;
}; 