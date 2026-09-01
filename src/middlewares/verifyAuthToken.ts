import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import configs from '../configs/configs';
import AppError from '../errors/AppError';
import { TJWTPayload } from '../types';

export const verifyAuthorityToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized: Access token is missing or malformed'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, configs.jwtSecret) as TJWTPayload;
    req.user = decoded;
    return next();
  } catch (error) {
    return next(new AppError(httpStatus.UNAUTHORIZED, 'Unauthorized: Invalid or expired access token'));
  }
};

export const verifyAdminToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await verifyAuthorityToken(req, res, (err) => {
    if (err) return next(err);

    if (req.user?.role !== 'ADMIN') {
      return next(new AppError(httpStatus.FORBIDDEN, 'Forbidden: Admin access required'));
    }

    return next();
  });
};
