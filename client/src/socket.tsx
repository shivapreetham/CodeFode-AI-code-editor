import { io, Socket } from "socket.io-client";

export const initSocket = (): Socket => {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';
  console.log("Attempting to connect to backend:", backendUrl);

  const options = {
    'force new connection': true,
    reconnectionAttempt: 5,
    reconnectionDelay: 1000,
    timeout: 15000,
    transports: ["websocket", "polling"],
  };

  try {
    const socket = io(backendUrl, options);

    socket.on("connect", () => {
      console.log("Socket connected successfully with ID:", socket.id);
    });

    socket.on("connect_error", (error) => {
      console.error("Socket connection error:", error.message);
    });

    return socket;
  } catch (error) {
    console.error("Failed to create socket instance:", error);
    throw error;
  }
};