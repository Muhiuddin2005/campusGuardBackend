import httpStatus from 'http-status';
import AppError from '../../errors/AppError';
import prisma from '../../libs/prisma';
import { hashPasscode, isValidPasscodeFormat } from '../reports/reports.helpers';
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
  const report = await prisma.reports.findUnique({
    where: { passcodeLookup },
    select: { id: true, status: true },
  });

  if (!report) {
    throw new AppError(httpStatus.NOT_FOUND, 'No report found for this passcode');
  }

  return report;
};

const getReporterThread = async (
  payload: TGetReporterThreadPayload
): Promise<TMessageResponse[]> => {
  const { passcode } = payload;
  const report = await resolveReportByPasscode(passcode);

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
};

const sendReporterMessage = async (
  payload: TSendReporterMessagePayload
): Promise<TMessageResponse> => {
  const { passcode, body } = payload;

  if (!body || !body.trim()) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Message text is required');
  }

  const report = await resolveReportByPasscode(passcode);

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
};

const getAuthorityThread = async (reportId: string): Promise<TMessageResponse[]> => {
  if (!reportId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Report ID is required');
  }

  const report = await prisma.reports.findUnique({
    where: { id: reportId },
    select: { id: true },
  });

  if (!report) {
    throw new AppError(httpStatus.NOT_FOUND, 'Report not found');
  }

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

  const report = await prisma.reports.findUnique({
    where: { id: reportId },
    select: { id: true },
  });

  if (!report) {
    throw new AppError(httpStatus.NOT_FOUND, 'Report not found');
  }

  // Sender is recorded only as role 'AUTHORITY' — no individual user ID is logged
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
};

const MessagesServices = {
  getReporterThread,
  sendReporterMessage,
  getAuthorityThread,
  sendAuthorityMessage,
};

export default MessagesServices;
