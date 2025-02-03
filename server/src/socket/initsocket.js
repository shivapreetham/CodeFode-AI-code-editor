import { Server } from "socket.io";
import http from "http";
import { ACTIONS } from "../constants/actions.js";

import express from "express";

const app = express();

const server = http.createServer(app);
  const io = new Server(server);

  const userSocketMap = {};
  const userRoomMap = {}; // Maps socket ID to room ID
  const chatMessages = {}; // Maps room ID to chat messages

  const getAllConnectedClients = (roomId) => {
    return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
      (socketId) => {
        return {
          socketId,
          username: userSocketMap[socketId],
        };
      }
    );
  };

  io.on("connection", (socket) => {
    console.log("socket connected", socket.id);

    socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
      userSocketMap[socket.id] = username;
      userRoomMap[socket.id] = roomId;
      socket.join(roomId);
      // Initialize chat history for this room if not exists
      if (!chatMessages[roomId]) {
        chatMessages[roomId] = [];
      }

      // Send existing chat history to the user
      socket.emit(ACTIONS.LOAD_MESSAGES, chatMessages[roomId]);

      const clients = getAllConnectedClients(roomId);
      clients.forEach(({ socketId }) => {
        io.to(socketId).emit(ACTIONS.JOINED, {
          clients,
          username,
          socketId: socket.id,
        });
      });
    });

    socket.on(ACTIONS.CURSOR_CHANGE, (data) => {
      // Data should include: roomId, userId, position, and userna
      const { roomId, userId, position, username } = data;
      // Broadcast the cursor change to everyone in the room except the sender
      socket.to(roomId).emit(ACTIONS.CURSOR_CHANGE, { userId, position, username });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, payload }) => {
      socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { payload });
    });

    socket.on(ACTIONS.GET_MESSAGES, ({ roomId }) => {
      socket.emit(ACTIONS.LOAD_MESSAGES, chatMessages[roomId]);
    });

    socket.on(ACTIONS.SEND_MESSAGE, ({ roomId, message, toSocketId, username,timestamp }) => {
      // console.log("chatMessages[roomId]", chatMessages[roomId]);
      const sender = userSocketMap[socket.id];
      // console.log("roomId", roomId, "message", message, "toSocketId", toSocketId);

      const chatData = { sender: username, text:message, timestamp, private: false };
      
       // Store messages per room
       if (!chatMessages[roomId]) {
        chatMessages[roomId] = [];
      }
      chatMessages[roomId].push(chatData);

      // Broadcast message to all users in the room
      io.to(roomId).emit(ACTIONS.RECEIVE_MESSAGE, chatData);
      // if (toSocketId) {
      //   // Private chat: Send message to a specific user
      //   io.to(toSocketId).emit(ACTIONS.RECEIVE_MESSAGE, {
      //     sender,
      //     message,
      //     private: true,
      //   });
      // } else {
      //   // Group chat: Broadcast message to the entire room
      //   io.to(roomId).emit(ACTIONS.RECEIVE_MESSAGE, {
      //     sender,
      //     message,
      //     private: false,
      //   });
      // }
    });

    socket.on(ACTIONS.CURSOR_CHANGE, (data) => {
      console.log("Received data on backend:", data);
      // Now destructure:
      const { roomId, username, position, filePath } = data;
      console.log("room", roomId, "username", username, "position", position, "filePath", filePath);
      socket.broadcast.to(roomId).emit(ACTIONS.CURSOR_CHANGE, { username, position, filePath });
    });

    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms];
      rooms.forEach((roomId) => {
        socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
          socketId: socket.id,
          username: userSocketMap[socket.id],
        });
      });

      delete userSocketMap[socket.id];
      delete userRoomMap[socket.id];
      socket.leave();
    });
  });

export { app, io, server };