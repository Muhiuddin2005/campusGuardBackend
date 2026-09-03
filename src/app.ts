import cors from 'cors';
import express, { Application, Request, Response } from 'express';
import helmet from 'helmet';
import configs from './configs/configs';
import globalErrorHandler from './middlewares/globalErrorHandler';
import notFound from './middlewares/notFound';
import requestLogger from './middlewares/requestLogger';
import router from './routes';

const app: Application = express();

// Security headers
app.use(helmet());

// Anonymized request logger
app.use(requestLogger);

// CORS configuration (Permits mobile app no-origin requests & localhost dev)
app.use(
  cors({
    origin: (origin, callback) => {
      // Mobile native app sends no Origin header; permit all no-origin or local requests
      if (
        !origin ||
        configs.nodeEnv === 'development' ||
        origin.startsWith('http://localhost') ||
        origin.startsWith('http://192.168.') ||
        origin.startsWith('http://10.')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: `CampusGuard API Server running on port ${configs.port} (${configs.nodeEnv})`,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Mount API v1 routes
app.use('/api/v1', router);

// Error handlers
app.use(globalErrorHandler);
app.use(notFound);

export default app;
