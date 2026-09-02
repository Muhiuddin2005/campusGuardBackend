import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/asyncCatch';
import sendResponse from '../../utils/sendResponse';
import MessagesServices from './messages.services';

const getReporterThread = catchAsync(async (req: Request, res: Response) => {
  const result = await MessagesServices.getReporterThread(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Reporter conversation thread retrieved successfully',
    data: result,
  });
});

const sendReporterMessage = catchAsync(async (req: Request, res: Response) => {
  const result = await MessagesServices.sendReporterMessage(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Message sent successfully',
    data: result,
  });
});

const getAuthorityThread = catchAsync(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const result = await MessagesServices.getAuthorityThread(reportId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Authority conversation thread retrieved successfully',
    data: result,
  });
});

const sendAuthorityMessage = catchAsync(async (req: Request, res: Response) => {
  const { reportId } = req.params;
  const result = await MessagesServices.sendAuthorityMessage(reportId, req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Authority reply sent successfully',
    data: result,
  });
});

const MessagesControllers = {
  getReporterThread,
  sendReporterMessage,
  getAuthorityThread,
  sendAuthorityMessage,
};

export default MessagesControllers;
