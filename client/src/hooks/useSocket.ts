import { useEffect, useRef, useState } from "react";
import { Socket } from "socket.io-client";
import { initSocket } from "@/socket";
import { ACTIONS } from "@/app/helpers/Actions";
import toast from "react-hot-toast";

interface UseSocketProps {
  roomId: string;
  user: any;
  enabled: boolean;
}

export const useSocket = ({ roomId, user, enabled }: UseSocketProps) => {
  const [clients, setClients] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!enabled || !user) return;

    const connectSocket = async () => {
      try {
        socketRef.current = await initSocket();
        
        socketRef.current.on("connect", () => {
          setIsConnected(true);
        });

        socketRef.current.on("disconnect", () => {
          setIsConnected(false);
        });

        // Join room with session-based user data
        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username: user.name,
          email: user.email,
          userId: user.id,
        });

        socketRef.current.on(ACTIONS.JOINED, ({ clients, username }) => {
          if (username !== user.name) {
            toast.success(`${username} joined the room.`);
          }
          setClients(clients);
        });

        socketRef.current.on(ACTIONS.DISCONNECTED, ({ username, socketId }) => {
          toast.success(`${username} left the room.`);
          setClients((prev: any) => 
            prev.filter((client: any) => client.socketId !== socketId)
          );
        });

      } catch (error) {
        console.error("Socket connection error:", error);
        toast.error("Failed to connect to room");
      }
    };

    connectSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [enabled, user, roomId]);

  return {
    socket: socketRef.current,
    clients,
    isConnected,
  };
};