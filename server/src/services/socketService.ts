import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import config from '../config';

// This map will help us track which user is connected to which socket
const userSocketMap = new Map<string, string>();

let io: Server;

export const initializeSocketIO = (httpServer: any) => {
  io = new Server(httpServer, {
    cors: {
      origin: "http://localhost:3000", // Allow connections from our React frontend
      methods: ["GET", "POST"]
    }
  });

  console.log('🔌 Socket.IO initialized');

  io.on('connection', (socket: Socket) => {
    console.log(`⚡ A user connected: ${socket.id}`);

    // Listen for an authentication event from the client
    socket.on('authenticate', (token: string) => {
      try {
        const decoded = jwt.verify(token, config.jwtSecret) as { id: string };
        if (decoded.id) {
          const userId = decoded.id;
          console.log(`✅ Authenticated user ${userId} for socket ${socket.id}`);
          // Join a "room" named after the user's ID. This allows us to
          // easily send a message to all of a user's connected devices.
          socket.join(userId);
          userSocketMap.set(socket.id, userId);
        }
      } catch (error) {
        console.log(`❌ Socket authentication failed for ${socket.id}`);
        socket.disconnect();
      }
    });

    socket.on('disconnect', () => {
      const userId = userSocketMap.get(socket.id);
      if (userId) {
        userSocketMap.delete(socket.id);
      }
      console.log(`🔥 A user disconnected: ${socket.id}`);
    });
  });
};

/**
 * Emits an event to a specific user's room.
 * @param userId The ID of the user to send the event to.
 * @param event The name of the event.
 * @param data The data to send.
 */
export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    console.log(`🚀 Emitting event "${event}" to user ${userId}`);
    io.to(userId).emit(event, data);
  }
};