// e.g. src/lib/providers/socket-provider.tsx (or wherever you create socket)
'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io as ClientIO, Socket } from 'socket.io-client';

type SocketContextType = {
  socket: Socket | null;
  isConnected: boolean;
};

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Connect to same origin. Passing undefined makes socket.io-client use window.location origin.
    const s = ClientIO(undefined as any, {
      path: '/api/socket/io',
      transports: ['polling', 'websocket'],
      autoConnect: true,
      // optional: increase ping timeout in dev
      pingInterval: 20000,
      pingTimeout: 5000,
    });

    s.on('connect', () => {
      console.log('[CLIENT] socket connected', s.id);
      setIsConnected(true);
    });

    s.on('connect_error', (err) => {
      console.error('[CLIENT] connect_error', err);
    });

    s.on('disconnect', (reason) => {
      console.log('[CLIENT] disconnected', reason);
      setIsConnected(false);
    });

    // debug: list all incoming events to this client
    s.onAny((event, ...args) => {
      console.log(`[CLIENT][ONANY] socket=${s.id} event=${event}`, args);
    });

    setSocket(s);

    return () => {
      s.removeAllListeners();
      s.disconnect();
    };
  }, []);

  return <SocketContext.Provider value={{ socket, isConnected }}>{children}</SocketContext.Provider>;
};
