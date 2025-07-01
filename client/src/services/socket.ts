import { io, Socket } from 'socket.io-client';

const URL = 'http://localhost:5001'; // The URL of our backend server
let socket: Socket;

export const connectSocket = (token: string): void => {
  // Only connect if not already connected
  if (socket?.connected) {
    return;
  }

  // We set autoConnect to false so we can manually connect after login
  socket = io(URL, {
    autoConnect: false,
  });

  // Manually connect
  socket.connect();

  // Send the JWT for authentication once connected
  socket.on('connect', () => {
    console.log('[socket]: Connected to server with ID:', socket.id);
    socket.emit('authenticate', token);
  });

  socket.on('disconnect', () => {
    console.log('[socket]: Disconnected from server.');
  });
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
  }
};

// This function will be used by our components to listen to events
export const listenForEvent = (event: string, handler: (data: any) => void) => {
  if (socket) {
    socket.on(event, handler);
  }
};

// This function will be used to stop listening to events to prevent memory leaks
export const stopListeningForEvent = (event: string) => {
  if (socket) {
    socket.off(event);
  }
}