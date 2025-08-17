import { Server } from "socket.io";
import http from "http";
import express from "express";
import { ACTIONS } from "../constants/actions.js";
import { logger, logSocketEvent } from "../middleware/logger.js";
import config from "../config/environment.js";
import {
  handleJoinRoom,
  handleCursorChange,
  handleCodeChange,
  handleSendMessage,
  handleExecuteCode,
  handleGetMessages,
  handleDisconnection,
  handleFileOpened,
  handleFileEditStart,
  handleFileEditEnd,
  handleMousePointerMove,
  handleWhiteboardDraw,
  handleWhiteboardClear,
  handleWhiteboardLoad,
  cleanupSocketHandlers
} from "./socketHandlers.js";

const app = express();
const server = http.createServer(app);

// Socket.IO configuration with security and performance settings
const io = new Server(server, {
  cors: {
    origin: config.security.allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true
  },
  pingTimeout: config.socket.pingTimeout,
  pingInterval: config.socket.pingInterval,
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: true
});

// Connection state
const userSocketMap = {};
const userRoomMap = {};
const chatMessages = {};

// Connection tracking
let activeConnections = 0;

// Helper functions
const getAllConnectedClients = (roomId) => {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId]
    })
  );
};

const getRoomStats = () => {
  const rooms = io.sockets.adapter.rooms;
  const roomStats = {};
  
  for (const [roomId, sockets] of rooms) {
    if (!roomId.startsWith('room:')) continue;
    roomStats[roomId] = {
      clientCount: sockets.size,
      clients: Array.from(sockets).map(socketId => ({
        socketId,
        username: userSocketMap[socketId]
      }))
    };
  }
  
  return roomStats;
};

// Socket.IO connection handling
io.on("connection", (socket) => {
  activeConnections++;
  
  logger.info('Socket connection established', {
    socketId: socket.id,
    ip: socket.handshake.address,
    userAgent: socket.handshake.headers['user-agent'],
    activeConnections
  });

  // Set up event handlers with proper error handling
  socket.on(ACTIONS.JOIN, handleJoinRoom(socket, userSocketMap, userRoomMap, chatMessages, io));
  
  socket.on(ACTIONS.CURSOR_CHANGE, handleCursorChange(socket, userRoomMap));
  
  socket.on(ACTIONS.CODE_CHANGE, handleCodeChange(socket, userRoomMap));
  
  socket.on(ACTIONS.SEND_MESSAGE, handleSendMessage(socket, userSocketMap, userRoomMap, chatMessages, io));
  
  socket.on(ACTIONS.EXECUTE_CODE, handleExecuteCode(socket, userRoomMap));
  
  socket.on(ACTIONS.GET_MESSAGES, handleGetMessages(socket, chatMessages));
  
  // File tracking events
  socket.on(ACTIONS.FILE_OPENED, handleFileOpened(socket, userRoomMap, io));
  
  socket.on(ACTIONS.FILE_EDIT_START, handleFileEditStart(socket, userRoomMap, io));
  
  socket.on(ACTIONS.FILE_EDIT_END, handleFileEditEnd(socket, userRoomMap, io));
  
  // Mouse pointer tracking
  socket.on(ACTIONS.MOUSE_POINTER_MOVE, handleMousePointerMove(socket, userRoomMap));
  
  // Whiteboard events
  socket.on(ACTIONS.WHITEBOARD_DRAW, handleWhiteboardDraw(socket, userRoomMap, io));
  
  socket.on(ACTIONS.WHITEBOARD_CLEAR, handleWhiteboardClear(socket, userRoomMap, io));
  
  socket.on(ACTIONS.WHITEBOARD_LOAD, handleWhiteboardLoad(socket, userRoomMap));
  
  // Handle disconnection
  socket.on("disconnecting", () => {
    activeConnections--;
    handleDisconnection(socket, userSocketMap, userRoomMap, io)();
  });
  
  // Handle connection errors
  socket.on('error', (error) => {
    logger.error('Socket error', {
      socketId: socket.id,
      error: error.message,
      stack: error.stack
    });
  });
  
  // Send connection acknowledgment
  socket.emit('connected', {
    socketId: socket.id,
    timestamp: new Date().toISOString(),
    serverInfo: {
      version: '1.0.0',
      features: ['chat', 'collaboration', 'code-execution']
    }
  });
});

// Global error handling for Socket.IO
io.engine.on('connection_error', (err) => {
  logger.error('Socket.IO connection error', {
    code: err.code,
    message: err.message,
    context: err.context
  });
});

// Periodic stats logging
setInterval(() => {
  if (activeConnections > 0) {
    logger.info('Socket.IO stats', {
      activeConnections,
      totalRooms: io.sockets.adapter.rooms.size,
      roomStats: getRoomStats()
    });
  }
}, 300000); // Every 5 minutes

// Graceful shutdown handling
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down Socket.IO server gracefully');
  
  // Close all socket connections
  io.close(() => {
    logger.info('Socket.IO server closed');
    cleanupSocketHandlers();
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down Socket.IO server gracefully');
  
  io.close(() => {
    logger.info('Socket.IO server closed');
    cleanupSocketHandlers();
    process.exit(0);
  });
});

export { app, io, server, getAllConnectedClients };