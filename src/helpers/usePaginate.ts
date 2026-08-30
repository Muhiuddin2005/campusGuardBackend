import { Request } from 'express';

export type TPaginationOptions = {
  page: number;
  limit: number;
  skip: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export const usePaginate = (req: Request): TPaginationOptions => {
  const page = Math.max(1, parseInt((req.query.page || req.query.currPage) as string, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit as string, 10) || 10));
  const skip = (page - 1) * limit;

  const sortBy = (req.query.sortBy as string) || 'createdAt';
  const sortOrder = ((req.query.sortOrder as string)?.toLowerCase() === 'asc' ? 'asc' : 'desc') as 'asc' | 'desc';

  return { page, limit, skip, sortBy, sortOrder };
};
