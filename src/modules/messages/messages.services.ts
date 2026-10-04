import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../libs/prisma';
import { hashPasscode, isValidPasscodeFormat } from '../reports/reports.helpers';
import {
  addLocalMessage,
  findLocalReportById,
  findLocalReportByPasscode,
  getLocalMessages,
} from '../reports/reports.localStore';
import {
  TGetReporterThreadPayload,
  TMessageResponse,
  TSendAuthorityMessagePayload,
  TSendReporterMessagePayload,
} from './messages.types';

const resolveReportByPasscode = async (passcode: string) => {
  if (!isValidPasscodeFormat(passcode)) {
    throw new AppError(httpStatus.NOT_FOUND, 'No report found for this passcode');
  }

  const passcodeLookup = hashPasscode(passcode);

  try {
    const report = await prisma.reports.findUnique({
      where: { passcodeLookup },
      select: { id: true, status: true },
    });
    if (report) {
      return report;
    }
  } catch (err: any) {
    console.warn('⚠️ [Messages] Prisma query failed, checking local store:', err?.message);
  }

  const localReport = findLocalReportByPasscode(passcodeLookup);
  if (localReport) {
    return { id: localReport.id, status: localReport.status };
  }

  throw new AppError(httpStatus.NOT_FOUND, 'No report found for this passcode');
};

const getReporterThread = async (
  payload: TGetReporterThreadPayload
): Promise<TMessageResponse[]> => {
  const { passcode } = payload;
  const report = await resolveReportByPasscode(passcode);

  try {
    const messages = await prisma.messages.findMany({
      where: { reportId: report.id },
      select: {
        id: true,
        sender: true,
        body: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return messages;
  } catch (err: any) {
    console.warn('⚠️ [Messages] Prisma query failed, fetching local thread:', err?.message);
  }

  const localMsgs = getLocalMessages(report.id);
  return localMsgs.map((m) => ({
    id: m.id,
    sender: m.sender,
    body: m.body,
    createdAt: m.createdAt,
  }));
};

const sendReporterMessage = async (
  payload: TSendReporterMessagePayload
): Promise<TMessageResponse> => {
  const { passcode, body } = payload;

  if (!body || !body.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Message text is required');
  }

  const report = await resolveReportByPasscode(passcode);

  try {
    const message = await prisma.messages.create({
      data: {
        reportId: report.id,
        sender: 'REPORTER',
        body: body.trim(),
      },
      select: {
        id: true,
        sender: true,
        body: true,
        createdAt: true,
      },
    });
    return message;
  } catch (err: any) {
    console.warn('⚠️ [Messages] Prisma create failed, saving to local store:', err?.message);
  }

  const localMsg = addLocalMessage(report.id, 'REPORTER', body.trim());
  if (!localMsg) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to save message');
  }

  return {
    id: localMsg.id,
    sender: localMsg.sender,
    body: localMsg.body,
    createdAt: localMsg.createdAt,
  };
};

const getAuthorityThread = async (reportId: string): Promise<TMessageResponse[]> => {
  if (!reportId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Report ID is required');
  }

  try {
    const report = await prisma.reports.findUnique({
      where: { id: reportId },
      select: { id: true },
    });

    if (report) {
      const messages = await prisma.messages.findMany({
        where: { reportId },
        select: {
          id: true,
          sender: true,
          body: true,
          createdAt: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });
      return messages;
    }
  } catch (err: any) {
    console.warn('⚠️ [Messages] Prisma query failed, checking local store:', err?.message);
  }

  const localReport = findLocalReportById(reportId);
  if (!localReport) {
    throw new AppError(httpStatus.NOT_FOUND, 'Report not found');
  }

  const localMsgs = getLocalMessages(reportId);
  return localMsgs.map((m) => ({
    id: m.id,
    sender: m.sender,
    body: m.body,
    createdAt: m.createdAt,
  }));
};

const sendAuthorityMessage = async (
  reportId: string,
  payload: TSendAuthorityMessagePayload
): Promise<TMessageResponse> => {
  const { body } = payload;

  if (!reportId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Report ID is required');
  }

  if (!body || !body.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Message text is required');
  }

  try {
    const report = await prisma.reports.findUnique({
      where: { id: reportId },
      select: { id: true },
    });

    if (report) {
      const message = await prisma.messages.create({
        data: {
          reportId,
          sender: 'AUTHORITY',
          body: body.trim(),
        },
        select: {
          id: true,
          sender: true,
          body: true,
          createdAt: true,
        },
      });
      return message;
    }
  } catch (err: any) {
    console.warn('⚠️ [Messages] Prisma create failed, saving to local store:', err?.message);
  }

  const localReport = findLocalReportById(reportId);
  if (!localReport) {
    throw new AppError(httpStatus.NOT_FOUND, 'Report not found');
  }

  const localMsg = addLocalMessage(reportId, 'AUTHORITY', body.trim());
  if (!localMsg) {
    throw new AppError(httpStatus.INTERNAL_SERVER_ERROR, 'Failed to save message');
  }

  return {
    id: localMsg.id,
    sender: localMsg.sender,
    body: localMsg.body,
    createdAt: localMsg.createdAt,
  };
};

const MessagesServices = {
  getReporterThread,
  sendReporterMessage,
  getAuthorityThread,
  sendAuthorityMessage,
};

export default MessagesServices;
