import { ErrorRequestHandler } from 'express';
import httpStatus from 'http-status';
import configs from '../configs/configs';
import AppError from '../errors/AppError';
import { TErrorSources } from '../interfaces/error';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const globalErrorHandler: ErrorRequestHandler = (err, req, res, next) => {
  let statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong';
  let errorSources: TErrorSources = [
    {
      path: '',
      message: 'Something went wrong',
    },
  ];

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    errorSources = [
      {
        path: '',
        message: err.message,
      },
    ];
  } else if (err?.name === 'PrismaClientKnownRequestError') {
    statusCode = httpStatus.BAD_REQUEST;
    if (err.code === 'P2002') {
      message = 'A duplicate entry was found for a unique field.';
    } else if (err.code === 'P2025') {
      statusCode = httpStatus.NOT_FOUND;
      message = 'Requested record was not found.';
    } else {
      message = `Database query error (${err.code})`;
    }
    errorSources = [
      {
        path: '',
        message,
      },
    ];
  } else if (err?.name === 'PrismaClientValidationError') {
    statusCode = httpStatus.BAD_REQUEST;
    message = 'Invalid database field validation format.';
    errorSources = [
      {
        path: '',
        message,
      },
    ];
  } else if (err?.name === 'JsonWebTokenError' || err?.name === 'TokenExpiredError') {
    statusCode = httpStatus.UNAUTHORIZED;
    message = 'Invalid or expired authorization token';
    errorSources = [
      {
        path: '',
        message,
      },
    ];
  } else if (err instanceof Error) {
    message = err.message || 'Something went wrong';
    errorSources = [
      {
        path: '',
        message: err.message,
      },
    ];
  }

  // Anonymity improvement: Never leak internal raw err object to clients
  return res.status(statusCode).json({
    success: false,
    message,
    errorSources,
    stack: configs.nodeEnv === 'development' ? err?.stack : null,
  });
};

export default globalErrorHandler;
