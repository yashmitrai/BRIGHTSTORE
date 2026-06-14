import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';

const SOCKET_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : 'http://localhost:5001';

let socketInstance: Socket | null = null;

export const useSocket = (onEventMap?: { [event: string]: (data: any) => void }) => {
  const { user } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  
  // Keep latest handlers in a ref
  const handlersRef = useRef(onEventMap);
  handlersRef.current = onEventMap;

  useEffect(() => {
    const token = localStorage.getItem('brightstore_token');
    if (!token || !user) {
      if (socketInstance) {
        socketInstance.disconnect();
        socketInstance = null;
      }
      return;
    }

    if (!socketInstance) {
      socketInstance = io(SOCKET_URL, {
        auth: { token },
        transports: ['websocket'],
      });
      
      socketInstance.on('connect', () => {
        console.log('Socket connected successfully');
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });
    }

    socketRef.current = socketInstance;

    // Register handlers using stable event keys
    const activeEvents = onEventMap ? Object.keys(onEventMap) : [];
    
    activeEvents.forEach((event) => {
      socketInstance?.on(event, (data) => {
        if (handlersRef.current && handlersRef.current[event]) {
          handlersRef.current[event](data);
        }
      });
    });

    return () => {
      // Clean up event listeners on unmount
      if (socketInstance) {
        activeEvents.forEach((event) => {
          socketInstance?.off(event);
        });
      }
    };
  }, [user]); // Runs only when user auth state changes

  return socketRef.current;
};
