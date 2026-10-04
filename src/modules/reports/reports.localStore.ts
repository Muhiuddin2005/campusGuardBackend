import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { IncidentCategory, MessageSender, ReportStatus } from '@prisma/client';
import { TPaginationOptions } from '../../helpers/usePaginate';
import { TGetAllReportsQuery, TUpdateReportStatusPayload } from './reports.types';

export type TLocalMedia = {
  id: string;
  storageKey: string;
  fileType: string;
  fileSize: number;
  createdAt: Date;
};

export type TLocalMessage = {
  id: string;
  reportId: string;
  sender: MessageSender;
  body: string;
  createdAt: Date;
};

export type TLocalReport = {
  id: string;
  passcodeLookup: string;
  category: IncidentCategory;
  description: string;
  incidentLocation: string | null;
  occurredAt: Date | null;
  status: ReportStatus;
  authorityNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  media: TLocalMedia[];
  messages: TLocalMessage[];
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'localReports.json');

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const loadReports = (): TLocalReport[] => {
  try {
    ensureDataDir();
    if (!fs.existsSync(DATA_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed.map((r: any) => ({
      ...r,
      occurredAt: r.occurredAt ? new Date(r.occurredAt) : null,
      createdAt: new Date(r.createdAt),
      updatedAt: new Date(r.updatedAt),
      media: (r.media || []).map((m: any) => ({
        ...m,
        createdAt: new Date(m.createdAt),
      })),
      messages: (r.messages || []).map((msg: any) => ({
        ...msg,
        createdAt: new Date(msg.createdAt),
      })),
    }));
  } catch (err) {
    console.warn('⚠️ [LocalStore] Failed to read localReports.json, starting empty:', err);
    return [];
  }
};

const saveReports = (reports: TLocalReport[]) => {
  try {
    ensureDataDir();
    fs.writeFileSync(DATA_FILE, JSON.stringify(reports, null, 2), 'utf-8');
  } catch (err) {
    console.error('❌ [LocalStore] Failed to save localReports.json:', err);
  }
};

// In-memory cache synced with disk
let cachedReports: TLocalReport[] = loadReports();

export const saveLocalReport = async (data: {
  passcodeLookup: string;
  category: IncidentCategory;
  description: string;
  incidentLocation: string | null;
  occurredAt: Date | null;
  mediaKeys: string[];
}): Promise<TLocalReport> => {
  const rawKeys = data.mediaKeys;
  const normalizedKeys: string[] = Array.isArray(rawKeys)
    ? rawKeys
    : typeof rawKeys === 'string' && rawKeys
      ? [rawKeys]
      : [];

  const newReport: TLocalReport = {
    id: crypto.randomUUID(),
    passcodeLookup: data.passcodeLookup,
    category: data.category,
    description: data.description,
    incidentLocation: data.incidentLocation,
    occurredAt: data.occurredAt,
    status: 'SUBMITTED',
    authorityNote: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    media: normalizedKeys.map((key) => ({
      id: crypto.randomUUID(),
      storageKey: key,
      fileType: 'image/jpeg',
      fileSize: 1024,
      createdAt: new Date(),
    })),
    messages: [],
  };

  cachedReports.unshift(newReport);
  saveReports(cachedReports);
  return newReport;
};

export const findLocalReportByPasscode = (passcodeLookup: string): TLocalReport | null => {
  return cachedReports.find((r) => r.passcodeLookup === passcodeLookup) || null;
};

export const findLocalReportById = (id: string): TLocalReport | null => {
  return cachedReports.find((r) => r.id === id) || null;
};

export const getAllLocalReports = (
  query: TGetAllReportsQuery,
  pagination: TPaginationOptions
) => {
  const { page, limit, skip, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
  const { status, category, searchTerm } = query;

  let filtered = [...cachedReports];

  if (status) {
    filtered = filtered.filter((r) => r.status === status);
  }
  if (category) {
    filtered = filtered.filter((r) => r.category === category);
  }
  if (searchTerm && searchTerm.trim()) {
    const s = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.description.toLowerCase().includes(s) ||
        (r.incidentLocation && r.incidentLocation.toLowerCase().includes(s))
    );
  }

  filtered.sort((a: any, b: any) => {
    const valA = new Date(a[sortBy] || a.createdAt).getTime();
    const valB = new Date(b[sortBy] || b.createdAt).getTime();
    return sortOrder === 'desc' ? valB - valA : valA - valB;
  });

  const total = filtered.length;
  const paged = filtered.slice(skip, skip + limit);
  const totalPage = Math.ceil(total / limit) || 1;

  const data = paged.map((r) => ({
    id: r.id,
    category: r.category,
    description: r.description,
    incidentLocation: r.incidentLocation,
    occurredAt: r.occurredAt,
    status: r.status,
    authorityNote: r.authorityNote,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    _count: {
      media: r.media.length,
      messages: r.messages.length,
    },
  }));

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPage,
    },
  };
};

export const updateLocalReportStatus = (
  id: string,
  payload: TUpdateReportStatusPayload
): TLocalReport | null => {
  const report = cachedReports.find((r) => r.id === id);
  if (!report) return null;

  if (payload.status) {
    report.status = payload.status;
  }
  if (payload.authorityNote !== undefined) {
    report.authorityNote = payload.authorityNote;
  }
  report.updatedAt = new Date();
  saveReports(cachedReports);
  return report;
};

export const addLocalMessage = (
  reportId: string,
  sender: MessageSender,
  body: string
): TLocalMessage | null => {
  const report = cachedReports.find((r) => r.id === reportId);
  if (!report) return null;

  const msg: TLocalMessage = {
    id: crypto.randomUUID(),
    reportId,
    sender,
    body,
    createdAt: new Date(),
  };

  report.messages.push(msg);
  saveReports(cachedReports);
  return msg;
};

export const getLocalMessages = (reportId: string): TLocalMessage[] => {
  const report = cachedReports.find((r) => r.id === reportId);
  return report ? report.messages : [];
};
