import rateLimit from 'express-rate-limit';
import httpStatus from 'http-status';
import configs from '../configs/configs';

const isDev = configs.nodeEnv === 'development';

const createLimiterResponse = (message: string) => ({
  success: false,
  message,
  errorSources: [
    {
      path: '',
      message,
    },
  ],
});

// Stricter limiter for report creation: 10 reports per 15 minutes per IP (500 in dev)
export const createReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 10,
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  message: createLimiterResponse('Too many reports submitted from this network. Please wait a few minutes.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Passcode lookup / chat rate limiter: 30 requests per 15 minutes per IP to mitigate brute-force (1000 in dev)
export const passcodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 30,
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  message: createLimiterResponse('Too many attempts. Please try again after 15 minutes.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth login rate limiter: 10 attempts per 15 minutes per IP (500 in dev)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 10,
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  message: createLimiterResponse('Too many login attempts. Please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter: 20 uploads per 15 minutes per IP (500 in dev)
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 500 : 20,
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  message: createLimiterResponse('Too many upload requests. Please wait before uploading more files.'),
  standardHeaders: true,
  legacyHeaders: false,
});
