import { IncidentCategory, ReportStatus } from '@prisma/client';

export type TCreateReportPayload = {
  category: IncidentCategory;
  description: string;
  incidentLocation?: string;
  occurredAt?: string | Date;
  mediaKeys?: string[];
};

export type TCreateReportResponse = {
  passcode: string;
  reportId: string;
};

export type TTrackReportPayload = {
  passcode: string;
};

export type TUpdateReportStatusPayload = {
  status?: ReportStatus;
  authorityNote?: string;
};

export type TGetAllReportsQuery = {
  page?: string;
  limit?: string;
  currPage?: string;
  status?: ReportStatus;
  category?: IncidentCategory;
  searchTerm?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};
