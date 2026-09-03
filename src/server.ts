import { Server } from 'http';
import app from './app';
import configs from './configs/configs';
import prisma from './libs/prisma';

let server: Server;

const getDatabaseName = (databaseUrl: string) => {
  try {
    const parsedUrl = new URL(databaseUrl);
    return parsedUrl.pathname.replace(/^\/+/, '') || 'postgres';
  } catch {
    return 'postgres';
  }
};

async function connectWithRetry(maxRetries = 3, baseDelayMs = 2000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await prisma.$connect();
      const dbName = getDatabaseName(configs.dbUri);
      console.log(`☁️  [Database] Connected successfully to database: ${dbName}`);
      return;
    } catch (error) {
      console.warn(
        `⚠️ [Database] Connection attempt ${attempt}/${maxRetries} failed:`,
        error instanceof Error ? error.message : error
      );
      if (attempt === maxRetries) {
        console.warn('⚠️ [Database] Proceeding without database connection. Connect a valid Postgres instance via DATABASE_URL in .env');
        return;
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      console.log(`Retrying database connection in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

async function startServer() {
  try {
    await connectWithRetry();

    server = app.listen(Number(configs.port), '0.0.0.0', () => {
      console.log(`🚚 [Server] CampusGuard API running on port ${configs.port} (0.0.0.0)`);
      console.log(`🔒 [Security] Passcode pepper & HMAC verification active`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('Unhandled Rejection:', error);
  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(async () => {
      await prisma.$disconnect();
      console.log('Server process terminated.');
    });
  }
});

startServer();
