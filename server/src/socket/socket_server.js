import http from "http";
import { Server } from "socket.io";
import { ACTIONS } from "../constants/actions.js";

const initSocketServer = (app) => {
  const server = http.createServer(app);
  const io = new Server(server);

  const userSocketMap = {};

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
      socket.join(roomId);
      const clients = getAllConnectedClients(roomId);
      clients.forEach(({ socketId }) => {
        io.to(socketId).emit(ACTIONS.JOINED, {
          clients,
          username,
          socketId: socket.id,
        });
      });
    });

    socket.on(ACTIONS.CODE_CHANGE, ({ roomId, payload }) => {
      socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { payload });
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
      socket.leave();
    });
  });

  const PORT = process.env.PORT || 8000;

  server.listen(PORT, () => {
    console.log(`[server] listening on port ${PORT}`);
  });
};

export { initSocketServer };
