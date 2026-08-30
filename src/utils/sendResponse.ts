import { Response } from 'express';

export type TMeta = {
  page: number;
  limit: number;
  total: number;
  totalPage: number;
};

export type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: TMeta;
  data?: T;
  totalResults?: number;
};

const sendResponse = <T>(res: Response, responseData: TResponse<T>) => {
  return res.status(responseData.statusCode).json({
    success: responseData.success,
    message: responseData.message,
    meta: responseData.meta,
    data: responseData.data,
    totalResults: responseData.totalResults,
  });
};

export default sendResponse;
