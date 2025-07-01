import app from './app';
import config from './config';
import http from 'http'; // Import Node's built-in HTTP module
import { initializeSocketIO } from './services/socketService'; // Import our new service

const PORT = config.port;

// Create an HTTP server from our Express app
const httpServer = http.createServer(app);

// Initialize Socket.IO and attach it to the HTTP server
initializeSocketIO(httpServer);

// Start listening on the HTTP server, not the Express app
httpServer.listen(PORT, () => {
  console.log(`[server]: Server is running at http://localhost:${PORT}`);
});