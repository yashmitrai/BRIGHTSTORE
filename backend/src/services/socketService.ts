import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

let io: Server;

interface DecodedToken {
  id: string;
  role: string;
}

export const initializeSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Authentication Middleware
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Authentication error: Token missing'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as DecodedToken;
      socket.data = { userId: decoded.id, role: decoded.role };
      next();
    } catch (err) {
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const { userId, role } = socket.data;

    // Join user-specific room
    socket.join(`user:${userId}`);

    // Join role-specific room if retailer
    if (role === 'retailer') {
      socket.join('retailers');
    }

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

// Helper to emit events to a user
export const emitToUser = (userId: string, event: string, data: any) => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
  }
};

// Helper to emit events to all retailers
export const emitToRetailers = (event: string, data: any) => {
  if (io) {
    io.to('retailers').emit(event, data);
  }
};
