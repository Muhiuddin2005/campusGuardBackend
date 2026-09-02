import { Request, Response } from 'express';
import httpStatus from 'http-status';
import { usePaginate } from '../../helpers/usePaginate';
import catchAsync from '../../utils/asyncCatch';
import sendResponse from '../../utils/sendResponse';
import ReportsServices from './reports.services';

const createReport = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportsServices.createReport(req.body);

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Report submitted successfully. Please save your 16-character passcode securely.',
    data: result,
  });
});

const trackReport = catchAsync(async (req: Request, res: Response) => {
  const result = await ReportsServices.trackReport(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Report tracking details retrieved successfully',
    data: result,
  });
});

const getAllReports = catchAsync(async (req: Request, res: Response) => {
  const pagination = usePaginate(req);
  const result = await ReportsServices.getAllReports(req.query, pagination);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Authority report queue retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

const getReportById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReportsServices.getReportById(id);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Report details retrieved successfully',
    data: result,
  });
});

const updateReportStatus = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ReportsServices.updateReportStatus(id, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Report status updated successfully',
    data: result,
  });
});

const ReportsControllers = {
  createReport,
  trackReport,
  getAllReports,
  getReportById,
  updateReportStatus,
};

export default ReportsControllers;
