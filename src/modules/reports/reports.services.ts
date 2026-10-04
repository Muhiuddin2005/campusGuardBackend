import { IncidentCategory, Prisma, ReportStatus } from '@prisma/client';
import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import { TPaginationOptions } from '../../helpers/usePaginate';
import prisma from '../../libs/prisma';
import { createSignedUrl } from '../file_upload/storageClient';
import { generatePasscode, hashPasscode, isValidPasscodeFormat } from './reports.helpers';
import {
  findLocalReportById,
  findLocalReportByPasscode,
  getAllLocalReports,
  saveLocalReport,
  updateLocalReportStatus as updateLocalStatus,
} from './reports.localStore';
import {
  TCreateReportPayload,
  TCreateReportResponse,
  TGetAllReportsQuery,
  TTrackReportPayload,
  TUpdateReportStatusPayload,
} from './reports.types';

const VALID_CATEGORIES: IncidentCategory[] = [
  'RAGGING',
  'HARASSMENT',
  'STALKING',
  'THREATS',
  'CYBERBULLYING',
  'OTHER',
];

const VALID_STATUSES: ReportStatus[] = [
  'SUBMITTED',
  'UNDER_REVIEW',
  'ACTION_TAKEN',
  'RESOLVED',
  'DISMISSED',
];

const createReport = async (payload: TCreateReportPayload): Promise<TCreateReportResponse> => {
  const { category, description, incidentLocation, occurredAt, mediaKeys } = payload;

  if (!category || !VALID_CATEGORIES.includes(category)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Valid category is required (${VALID_CATEGORIES.join(', ')})`
    );
  }

  if (!description || typeof description !== 'string') {
    throw new AppError(httpStatus.BAD_REQUEST, 'Incident description is required');
  }

  const cleanDescription = description.trim();
  if (cleanDescription.length < 20) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Please describe the incident in more detail (minimum 20 characters required)'
    );
  }

  const passcode = generatePasscode();
  const passcodeLookup = hashPasscode(passcode);

  const normalizedMediaKeys: string[] = Array.isArray(mediaKeys)
    ? mediaKeys
    : typeof mediaKeys === 'string' && mediaKeys
      ? [mediaKeys]
      : [];

  let reportId: string;

  try {
    const report = await prisma.reports.create({
      data: {
        passcodeLookup,
        category,
        description: cleanDescription,
        incidentLocation: incidentLocation?.trim() || null,
        occurredAt: occurredAt ? new Date(occurredAt) : null,
        media: normalizedMediaKeys.length > 0
          ? {
              create: normalizedMediaKeys.map((key) => ({
                storageKey: key,
              })),
            }
          : undefined,
      },
      include: {
        media: true,
      },
    });
    reportId = report.id;
  } catch (dbError: any) {
    console.warn(
      `⚠️ [Database] PostgreSQL unavailable (${dbError?.message || dbError}). Storing report in resilient local store.`
    );
    const local = await saveLocalReport({
      passcodeLookup,
      category,
      description: cleanDescription,
      incidentLocation: incidentLocation?.trim() || null,
      occurredAt: occurredAt ? new Date(occurredAt) : null,
      mediaKeys: normalizedMediaKeys,
    });
    reportId = local.id;
  }

  // The passcode is returned ONCE right here. It is never stored in plaintext anywhere.
  return {
    passcode,
    reportId,
  };
};

const trackReport = async (payload: TTrackReportPayload) => {
  const { passcode } = payload;

  if (!isValidPasscodeFormat(passcode)) {
    // Return identical not found error to prevent timing/format enumeration
    throw new AppError(httpStatus.NOT_FOUND, 'No report found for this passcode');
  }

  const passcodeLookup = hashPasscode(passcode);

  let report: any = null;

  try {
    report = await prisma.reports.findUnique({
      where: { passcodeLookup },
      select: {
        id: true,
        category: true,
        description: true,
        incidentLocation: true,
        occurredAt: true,
        status: true,
        authorityNote: true,
        createdAt: true,
        updatedAt: true,
        media: {
          select: {
            id: true,
            storageKey: true,
            fileType: true,
            fileSize: true,
            createdAt: true,
          },
        },
      },
    });
  } catch (err: any) {
    console.warn('⚠️ [Database] Prisma query failed, checking local store:', err?.message);
  }

  if (!report) {
    const local = findLocalReportByPasscode(passcodeLookup);
    if (local) {
      report = {
        id: local.id,
        category: local.category,
        description: local.description,
        incidentLocation: local.incidentLocation,
        occurredAt: local.occurredAt,
        status: local.status,
        authorityNote: local.authorityNote,
        createdAt: local.createdAt,
        updatedAt: local.updatedAt,
        media: local.media,
      };
    }
  }

  if (!report) {
    throw new AppError(httpStatus.NOT_FOUND, 'No report found for this passcode');
  }

  // Attach signed URLs for media
  const mediaWithSignedUrls = await Promise.all(
    (report.media || []).map(async (item: any) => ({
      ...item,
      url: await createSignedUrl(item.storageKey),
    }))
  );

  return {
    ...report,
    media: mediaWithSignedUrls,
  };
};

const getAllReports = async (
  query: TGetAllReportsQuery,
  pagination: TPaginationOptions
) => {
  const { status, category, searchTerm } = query;
  const { page, limit, skip, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;

  try {
    const andConditions: Prisma.reportsWhereInput[] = [];

    if (status && VALID_STATUSES.includes(status)) {
      andConditions.push({ status });
    }

    if (category && VALID_CATEGORIES.includes(category)) {
      andConditions.push({ category });
    }

    if (searchTerm && searchTerm.trim()) {
      const search = searchTerm.trim();
      andConditions.push({
        OR: [
          { description: { contains: search, mode: 'insensitive' } },
          { incidentLocation: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    const whereClause: Prisma.reportsWhereInput =
      andConditions.length > 0 ? { AND: andConditions } : {};

    const [reportsList, total] = await Promise.all([
      prisma.reports.findMany({
        where: whereClause,
        select: {
          id: true,
          category: true,
          description: true,
          incidentLocation: true,
          occurredAt: true,
          status: true,
          authorityNote: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              media: true,
              messages: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip,
        take: limit,
      }),
      prisma.reports.count({ where: whereClause }),
    ]);

    const totalPage = Math.ceil(total / limit) || 1;

    return {
      data: reportsList,
      meta: {
        page,
        limit,
        total,
        totalPage,
      },
    };
  } catch (err: any) {
    console.warn('⚠️ [Database] Falling back to local reports list:', err?.message);
    return getAllLocalReports(query, pagination);
  }
};

const getReportById = async (id: string) => {
  if (!id) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Report ID is required');
  }

  let report: any = null;

  try {
    report = await prisma.reports.findUnique({
      where: { id },
      include: {
        media: true,
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  } catch (err: any) {
    console.warn('⚠️ [Database] Prisma query failed, checking local store:', err?.message);
  }

  if (!report) {
    const local = findLocalReportById(id);
    if (local) {
      report = {
        ...local,
      };
    }
  }

  if (!report) {
    throw new AppError(httpStatus.NOT_FOUND, 'Report not found');
  }

  const mediaWithSignedUrls = await Promise.all(
    (report.media || []).map(async (m: any) => ({
      ...m,
      url: await createSignedUrl(m.storageKey),
    }))
  );

  return {
    ...report,
    media: mediaWithSignedUrls,
  };
};

const updateReportStatus = async (
  id: string,
  payload: TUpdateReportStatusPayload
) => {
  if (!id) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Report ID is required');
  }

  const { status, authorityNote } = payload;

  if (status && !VALID_STATUSES.includes(status)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `Valid status is required (${VALID_STATUSES.join(', ')})`
    );
  }

  try {
    const existing = await prisma.reports.findUnique({ where: { id } });
    if (existing) {
      const updatedReport = await prisma.reports.update({
        where: { id },
        data: {
          status: status || undefined,
          authorityNote: authorityNote !== undefined ? authorityNote : undefined,
        },
      });
      return updatedReport;
    }
  } catch (err: any) {
    console.warn('⚠️ [Database] Prisma update failed, updating local store:', err?.message);
  }

  const localUpdated = updateLocalStatus(id, payload);
  if (!localUpdated) {
    throw new AppError(httpStatus.NOT_FOUND, 'Report not found');
  }

  return localUpdated;
};

const ReportsServices = {
  createReport,
  trackReport,
  getAllReports,
  getReportById,
  updateReportStatus,
};

export default ReportsServices;
