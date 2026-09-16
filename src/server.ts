import app from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';
import { seedInitialDatabaseData } from './config/seed';

const PORT = Number(process.env.PORT) || env.PORT || 5000;

const startServer = async () => {
  // Connect to database
  const connected = await connectDatabase();
  if (connected) {
    await seedInitialDatabaseData();
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Code DNA Backend running on port ${PORT} in ${env.NODE_ENV} mode`);
    console.log(`📡 Health endpoint: http://localhost:${PORT}/api/health`);
  });

  const handleShutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDatabase();
      console.log('HTTP server closed.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('Forceful shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer().catch((err) => {
  console.error('Fatal error starting server:', err);
  process.exit(1);
});