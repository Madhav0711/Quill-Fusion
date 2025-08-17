// pages/api/socket/io.ts
import { NextApiResponseServerIo } from '@/lib/types';
import { Server as NetServer } from 'http';
import { Server as ServerIO } from 'socket.io';
import { NextApiRequest } from 'next';

export const config = {
  api: {
    bodyParser: false,
  },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIo) => {
  // Guard to only initialize once per server process
  if (!res.socket.server.io) {
    const httpServer: NetServer = res.socket.server as any;
    const io = new ServerIO(httpServer, {
      path: '/api/socket/io',
      addTrailingSlash: false,
      // allow same-origin connections
      cors: {
        origin: true,
        credentials: true,
      },
      // let client fallback to polling if websocket not available
      transports: ['polling', 'websocket'],
    });

    io.on('connection', (socket) => {
      console.log(`[SERVER] New connection: ${socket.id} (handshake:`, socket.handshake?.headers?.host, ')');

      // Debug: print every event received by the server for this socket
      socket.onAny((event, ...args) => {
        console.log(`[SERVER][ONANY] socket=${socket.id} event=${event} args=`, args);
      });

      socket.on('create-room', (roomId: string) => {
        socket.join(roomId);
        console.log(`[SERVER] socket ${socket.id} joined room ${roomId} - rooms:`, Array.from(socket.rooms));
      });

      socket.on('leave-room', (roomId: string) => {
        socket.leave(roomId);
        console.log(`[SERVER] socket ${socket.id} left room ${roomId}`);
      });

      socket.on('send-changes', (deltas: any, roomId: string) => {
        console.log(`[SERVER] Received send-changes from ${socket.id} for room ${roomId}. ops=${deltas?.ops?.length ?? 'unknown'}`);
        // broadcast to others in room (exclude sender)
        socket.to(roomId).emit('receive-changes', deltas, roomId);
      });

      socket.on('send-cursor-move', (range: any, roomId: string, cursorId: string) => {
        console.log(`[SERVER] cursor from ${socket.id} for room ${roomId} cursorId=${cursorId}`);
        socket.to(roomId).emit('receive-cursor-move', range, roomId, cursorId);
      });

      // Ping test: ack + broadcast pong to room
      socket.on('ping', (roomId: string, ack?: (res: any) => void) => {
        console.log(`[SERVER] Received PING from ${socket.id} for room ${roomId}. Broadcasting PONG...`);
        io.to(roomId).emit('pong', roomId);
        if (typeof ack === 'function') ack({ ok: true, serverSocketId: socket.id });
      });

      socket.on('disconnect', (reason) => {
        console.log(`[SERVER] disconnect ${socket.id}`, reason);
      });
    });

    res.socket.server.io = io;
    console.log('[SERVER] io initialized');
  } else {
    // helpful when HMR / hot reload hits this route multiple times
    // you should see this log on subsequent API invocations
    console.log('[SERVER] io already initialized');
  }
  res.end();
};

export default ioHandler;
