const app = require('./app');

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`[FormGuard] Server running locally at http://localhost:${PORT}`);
  console.log(`[FormGuard] Network listener active on http://${HOST}:${PORT}`);
  console.log(`[FormGuard] Environment: ${process.env.NODE_ENV || 'development'}`);
});

process.on('SIGTERM', () => {
  console.log('[FormGuard] SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('[FormGuard] HTTP server closed');
  });
});
