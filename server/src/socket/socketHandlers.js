import { z } from 'zod';
import { ACTIONS } from '../constants/actions.js';
import { logger, logSocketEvent } from '../middleware/logger.js';
import { chatMessageSchema, codeExecutionSchema } from '../middleware/validation.js';
import executeCode from '../controllers/runInContainer.js';

// Socket event validation schemas
const joinRoomSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required').max(100, 'Room ID too long'),
  username: z.string().min(1, 'Username is required').max(50, 'Username too long')
});

const cursorChangeSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  username: z.string().min(1, 'Username is required'),
  position: z.object({
    line: z.number().min(0),
    ch: z.number().min(0)
  }),
  filePath: z.string().optional()
});

const codeChangeSchema = z.object({
  roomId: z.string().min(1, 'Room ID is required'),
  payload: z.any()
});

// Rate limiting for socket events
class SocketRateLimiter {
  constructor() {
    this.limits = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Cleanup every minute
  }

  isAllowed(socketId, action, limit = 10, windowMs = 60000) {
    const key = `${socketId}:${action}`;
    const now = Date.now();
    
    if (!this.limits.has(key)) {
      this.limits.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    const limitData = this.limits.get(key);
    
    if (now > limitData.resetTime) {
      this.limits.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (limitData.count >= limit) {
      return false;
    }
    
    limitData.count++;
    return true;
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.limits.entries()) {
      if (now > data.resetTime) {
        this.limits.delete(key);
      }
    }
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.limits.clear();
  }
}

const rateLimiter = new SocketRateLimiter();

// Helper function to validate socket data
const validateSocketData = (schema, data, socketId, eventName) => {
  try {
    return schema.parse(data);
  } catch (error) {
    logger.error('Socket validation error', {
      socketId,
      eventName,
      error: error.message,
      data
    });
    throw new Error(`Invalid data for ${eventName}: ${error.message}`);
  }
};

// Helper function to emit error to socket
const emitError = (socket, message, eventName) => {
  socket.emit('error', {
    message,
    event: eventName,
    timestamp: new Date().toISOString()
  });
};

// Socket event handlers
export const handleJoinRoom = (socket, userSocketMap, userRoomMap, chatMessages, io) => {
  return (data) => {
    try {
      // Rate limiting
      if (!rateLimiter.isAllowed(socket.id, 'join', 5, 60000)) {
        emitError(socket, 'Too many join attempts. Please wait.', ACTIONS.JOIN);
        return;
      }

      const validatedData = validateSocketData(joinRoomSchema, data, socket.id, ACTIONS.JOIN);
      const { roomId, username } = validatedData;

      // Leave previous room if exists
      const previousRoom = userRoomMap[socket.id];
      if (previousRoom && previousRoom !== roomId) {
        socket.leave(previousRoom);
        socket.to(previousRoom).emit(ACTIONS.DISCONNECTED, {
          socketId: socket.id,
          username: userSocketMap[socket.id]
        });
      }

      // Join new room
      userSocketMap[socket.id] = username;
      userRoomMap[socket.id] = roomId;
      socket.join(roomId);

      // Initialize chat history for room
      if (!chatMessages[roomId]) {
        chatMessages[roomId] = [];
      }

      // Send existing chat history
      socket.emit(ACTIONS.LOAD_MESSAGES, chatMessages[roomId]);

      // Get all clients in room
      const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
        (socketId) => ({
          socketId,
          username: userSocketMap[socketId]
        })
      );

      // Notify all clients about new user
      clients.forEach(({ socketId }) => {
        io.to(socketId).emit(ACTIONS.JOINED, {
          clients,
          username,
          socketId: socket.id
        });
      });

      logSocketEvent(ACTIONS.JOIN, socket.id, { roomId, username, clientsCount: clients.length });

    } catch (error) {
      logger.error('Join room error', { socketId: socket.id, error: error.message });
      emitError(socket, error.message, ACTIONS.JOIN);
    }
  };
};

export const handleCursorChange = (socket, userRoomMap) => {
  return (data) => {
    try {
      // Rate limiting
      if (!rateLimiter.isAllowed(socket.id, 'cursor', 30, 10000)) {
        return; // Silently ignore for cursor events
      }

      const validatedData = validateSocketData(cursorChangeSchema, data, socket.id, ACTIONS.CURSOR_CHANGE);
      const { roomId, username, position, filePath } = validatedData;

      // Verify user is in the room
      if (userRoomMap[socket.id] !== roomId) {
        emitError(socket, 'Not authorized for this room', ACTIONS.CURSOR_CHANGE);
        return;
      }

      // Broadcast to other users in room
      socket.to(roomId).emit(ACTIONS.CURSOR_CHANGE, {
        userId: socket.id,
        username,
        position,
        filePath
      });

      // Don't log cursor changes (too frequent)
    } catch (error) {
      logger.error('Cursor change error', { socketId: socket.id, error: error.message });
    }
  };
};

export const handleCodeChange = (socket, userRoomMap) => {
  return (data) => {
    try {
      // Rate limiting
      if (!rateLimiter.isAllowed(socket.id, 'code', 50, 10000)) {
        emitError(socket, 'Too many code changes. Please slow down.', ACTIONS.CODE_CHANGE);
        return;
      }

      const validatedData = validateSocketData(codeChangeSchema, data, socket.id, ACTIONS.CODE_CHANGE);
      const { roomId, payload } = validatedData;

      // Verify user is in the room
      if (userRoomMap[socket.id] !== roomId) {
        emitError(socket, 'Not authorized for this room', ACTIONS.CODE_CHANGE);
        return;
      }

      // Broadcast to other users in room
      socket.to(roomId).emit(ACTIONS.CODE_CHANGE, { payload });

      logSocketEvent(ACTIONS.CODE_CHANGE, socket.id, { roomId });

    } catch (error) {
      logger.error('Code change error', { socketId: socket.id, error: error.message });
      emitError(socket, error.message, ACTIONS.CODE_CHANGE);
    }
  };
};

export const handleSendMessage = (socket, userSocketMap, userRoomMap, chatMessages, io) => {
  return (data) => {
    try {
      // Rate limiting
      if (!rateLimiter.isAllowed(socket.id, 'message', 20, 60000)) {
        emitError(socket, 'Too many messages. Please slow down.', ACTIONS.SEND_MESSAGE);
        return;
      }

      const validatedData = validateSocketData(chatMessageSchema, data, socket.id, ACTIONS.SEND_MESSAGE);
      const { roomId, message, username, timestamp, toSocketId } = validatedData;

      // Verify user is in the room
      if (userRoomMap[socket.id] !== roomId) {
        emitError(socket, 'Not authorized for this room', ACTIONS.SEND_MESSAGE);
        return;
      }

      const chatData = {
        sender: username,
        text: message,
        timestamp,
        private: !!toSocketId,
        socketId: socket.id
      };

      // Store message in room history (only public messages)
      if (!toSocketId) {
        if (!chatMessages[roomId]) {
          chatMessages[roomId] = [];
        }
        chatMessages[roomId].push(chatData);
        
        // Keep only last 100 messages per room
        if (chatMessages[roomId].length > 100) {
          chatMessages[roomId] = chatMessages[roomId].slice(-100);
        }
      }

      // Send message
      if (toSocketId) {
        // Private message
        io.to(toSocketId).emit(ACTIONS.RECEIVE_MESSAGE, chatData);
        socket.emit(ACTIONS.RECEIVE_MESSAGE, chatData); // Echo back to sender
      } else {
        // Public message to room
        io.to(roomId).emit(ACTIONS.RECEIVE_MESSAGE, chatData);
      }

      logSocketEvent(ACTIONS.SEND_MESSAGE, socket.id, {
        roomId,
        private: !!toSocketId,
        messageLength: message.length
      });

    } catch (error) {
      logger.error('Send message error', { socketId: socket.id, error: error.message });
      emitError(socket, error.message, ACTIONS.SEND_MESSAGE);
    }
  };
};

export const handleExecuteCode = (socket, userRoomMap) => {
  return async (data) => {
    try {
      // Rate limiting
      if (!rateLimiter.isAllowed(socket.id, 'execute', 5, 60000)) {
        socket.emit(ACTIONS.CODE_RESULT, {
          success: false,
          output: 'Rate limit exceeded. Please wait before executing more code.',
          timestamp: new Date().toISOString()
        });
        return;
      }

      const validatedData = validateSocketData(codeExecutionSchema, data, socket.id, ACTIONS.EXECUTE_CODE);
      const { language, code } = validatedData;

      logSocketEvent(ACTIONS.EXECUTE_CODE, socket.id, {
        language,
        codeLength: code.length
      });

      // Execute code
      const result = await executeCode(language, code);

      // Add metadata to result
      const enhancedResult = {
        ...result,
        metadata: {
          language,
          executedAt: new Date().toISOString(),
          codeLength: code.length
        }
      };

      socket.emit(ACTIONS.CODE_RESULT, enhancedResult);

      logger.info('Code execution completed', {
        socketId: socket.id,
        language,
        success: result.success
      });

    } catch (error) {
      logger.error('Code execution error', { socketId: socket.id, error: error.message });
      
      socket.emit(ACTIONS.CODE_RESULT, {
        success: false,
        output: error.message || 'Failed to execute code',
        timestamp: new Date().toISOString()
      });
    }
  };
};

export const handleGetMessages = (socket, chatMessages) => {
  return (data) => {
    try {
      const { roomId } = data;
      
      if (!roomId) {
        emitError(socket, 'Room ID is required', ACTIONS.GET_MESSAGES);
        return;
      }

      const messages = chatMessages[roomId] || [];
      socket.emit(ACTIONS.LOAD_MESSAGES, messages);

      logSocketEvent(ACTIONS.GET_MESSAGES, socket.id, {
        roomId,
        messageCount: messages.length
      });

    } catch (error) {
      logger.error('Get messages error', { socketId: socket.id, error: error.message });
      emitError(socket, error.message, ACTIONS.GET_MESSAGES);
    }
  };
};

export const handleDisconnection = (socket, userSocketMap, userRoomMap, io) => {
  return () => {
    try {
      const username = userSocketMap[socket.id];
      const roomId = userRoomMap[socket.id];

      if (roomId) {
        // Notify other users in the room
        socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
          socketId: socket.id,
          username
        });
      }

      // Cleanup
      delete userSocketMap[socket.id];
      delete userRoomMap[socket.id];

      logSocketEvent('disconnect', socket.id, { username, roomId });

    } catch (error) {
      logger.error('Disconnection handling error', { socketId: socket.id, error: error.message });
    }
  };
};

// Cleanup function for rate limiter
export const cleanupSocketHandlers = () => {
  rateLimiter.destroy();
};