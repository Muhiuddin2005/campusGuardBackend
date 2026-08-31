import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { uploadFileToStorage } from './storageClient';
import { TFileUploadResponse } from './fileUpload.types';

const uploadFile = async (
  file?: Express.Multer.File
): Promise<TFileUploadResponse> => {
  if (!file) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Please attach an image file');
  }

  const storageKey = await uploadFileToStorage(
    file.buffer,
    file.mimetype,
    file.originalname || 'evidence.jpg'
  );

  return { storageKey };
};

const FileUploadServices = {
  uploadFile,
};

export default FileUploadServices;
