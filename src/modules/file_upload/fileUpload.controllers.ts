import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/asyncCatch';
import sendResponse from '../../utils/sendResponse';
import FileUploadServices from './fileUpload.services';

const uploadFile = catchAsync(async (req: Request, res: Response) => {
  const result = await FileUploadServices.uploadFile(req.file);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'File uploaded successfully to private storage',
    data: result,
  });
});

const FileUploadControllers = {
  uploadFile,
};

export default FileUploadControllers;
