import httpStatus from 'http-status';
import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import AppError from '../../errors/AppError';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/jpg',
];

const storage = multer.memoryStorage();

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    callback(null, true);
  } else {
    callback(
      new AppError(
        httpStatus.BAD_REQUEST,
        'Invalid file type. Only image files (JPEG, PNG, WebP, HEIC) are accepted.'
      )
    );
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 Megabytes limit
  },
  fileFilter,
});
