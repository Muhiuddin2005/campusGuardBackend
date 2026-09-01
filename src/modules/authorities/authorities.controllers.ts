import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/asyncCatch';
import sendResponse from '../../utils/sendResponse';
import AuthoritiesServices from './authorities.services';

const login = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthoritiesServices.login(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Authority logged in successfully',
    data: result,
  });
});

const getMe = catchAsync(async (req: Request, res: Response) => {
  const authorityId = req.user?.id as string;
  const result = await AuthoritiesServices.getMe(authorityId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Authority profile retrieved successfully',
    data: result,
  });
});

const AuthoritiesControllers = {
  login,
  getMe,
};

export default AuthoritiesControllers;
