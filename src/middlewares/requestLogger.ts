import { NextFunction, Request, Response } from 'express';

const getDayKey = () => new Date().toISOString().slice(0, 10);
let dayKey = getDayKey();
let dailyCount = 0;

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  const today = getDayKey();
  if (today !== dayKey) {
    dayKey = today;
    dailyCount = 0;
  }
  dailyCount++;

  res.on('finish', () => {
    const duration = Date.now() - start;

    const color =
      res.statusCode >= 500
        ? '\x1b[31m'
        : res.statusCode >= 400
          ? '\x1b[33m'
          : '\x1b[32m';
    const reset = '\x1b[0m';
    const cyan = '\x1b[36m';

    // Deliberately omit IP and headers to strictly preserve reporter anonymity
    const logMessage = `[${cyan}#${dailyCount}${reset}][${color}${res.statusCode}${reset}][${req.method}] - ${req.originalUrl} (${duration}ms)`;
    console.log(logMessage);
  });

  next();
};

export default requestLogger;
