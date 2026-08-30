import rateLimit from 'express-rate-limit';
import httpStatus from 'http-status';

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

// Stricter limiter for report creation: 10 reports per 15 minutes per IP
export const createReportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  message: createLimiterResponse('Too many reports submitted from this network. Please wait a few minutes.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Passcode lookup / chat rate limiter: 30 requests per 15 minutes per IP to mitigate brute-force
export const passcodeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  message: createLimiterResponse('Too many attempts. Please try again after 15 minutes.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth login rate limiter: 10 attempts per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  message: createLimiterResponse('Too many login attempts. Please try again later.'),
  standardHeaders: true,
  legacyHeaders: false,
});

// File upload rate limiter: 20 uploads per 15 minutes per IP
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  statusCode: httpStatus.TOO_MANY_REQUESTS,
  message: createLimiterResponse('Too many upload requests. Please wait before uploading more files.'),
  standardHeaders: true,
  legacyHeaders: false,
});
