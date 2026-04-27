import axios from 'axios';

import { getSheetValues, getUserInfo } from '../apis/sheets';
import type { TableType } from '../types';

export interface DataResponse<T> {
  data: T[];
  source: 'live' | 'fallback';
  error?: string;
  authRequired?: boolean;
  permissionDenied?: boolean;
}

const SHEET_NAME_MAP: Record<TableType, string> = {
  employee: 'Employee',
  employeePosition: '⟳Employee position',
  position: 'Position',
  positionProcess: 'Possition process',
  team: 'Team',
  orgChart: '⟳Employee position',
  department: 'Team',
  reportingLines: 'Employee',
  workflows: 'Workflows',
  dashboard: 'Employee',
  overview: 'Project info',
  projectInfo: 'Project info',
};

const HEADER_ALIASES: Record<string, string> = {
  'employee id': 'Employee ID',
  employee: 'Employee',
  hinh: 'Image',
  'link hinh': 'Image Link',
  position: 'Position',
  team: 'Team',
  'report to': 'Report to',
  'loai nhan su': 'Employee Type',
  'ngay vao lam': 'Start Date',
  'trang thai': 'Status',
  sdt: 'Phone',
  email: 'Email',
  'ngay sinh': 'Birth Date',
  'ngay chinh thuc': 'Official Date',
  'ngay thoi viec': 'End Date',
  employee_position_id: 'Employee_Position_ID',
  'parent team': 'Parent team',
  level: 'Level',
  manager: 'Manager',
  process: 'Process',
  owner: 'Owner',
  status: 'Status',
  metric: 'Metric',
  value: 'Value',
  target: 'Target',
  item: 'Item',
  detail: 'Detail',
};

function normalizeText(value: unknown): string {
  return String(value || '')
    .replace(/ðŸ·ï¸|ðŸ“§|âŸ³|☰|🏠|📋/g, ' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_ ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function normalizeHeader(header: unknown): string {
  const normalized = normalizeText(header);
  return HEADER_ALIASES[normalized] || String(header || '').trim();
}

function getRepresentativeColumnIndex(headers: string[], table: TableType): number {
  const candidates: Record<TableType, string[]> = {
    employee: ['Employee', 'Email'],
    employeePosition: ['Employee', 'Position'],
    position: ['Position'],
    positionProcess: ['Position'],
    team: ['Team'],
    orgChart: ['Employee', 'Position'],
    department: ['Team'],
    reportingLines: ['Employee'],
    workflows: ['Process'],
    dashboard: ['Employee'],
    overview: ['Item', 'Detail'],
    projectInfo: ['Item', 'Detail'],
  };

  const headerIndex = candidates[table]
    .map((candidate) => headers.indexOf(candidate))
    .find((index) => index !== -1);

  return headerIndex ?? 0;
}

export async function fetchSheetData<T>(
  table: TableType,
  accessToken: string,
  spreadsheetId: string,
): Promise<DataResponse<T>> {
  const sheetName = SHEET_NAME_MAP[table];

  try {
    if (!accessToken) {
      return { data: [], source: 'fallback', authRequired: true };
    }

    const data = await getSheetValues(spreadsheetId, sheetName, accessToken);
    const rows = data.values;

    if (!rows || rows.length === 0) {
      return { data: [], source: 'live' };
    }

    const headers = (rows[0] as unknown[]).map(normalizeHeader);
    const repColIndex = getRepresentativeColumnIndex(headers, table);

    const unfilteredResult = rows.slice(1).map((row: unknown[], index: number) => {
      const item: Record<string, unknown> = {
        _internalId: `${table}-row-${index}`,
        _sourceTable: table,
      };

      headers.forEach((header, headerIndex) => {
        item[header] = row[headerIndex];
      });

      item._repValue = row[repColIndex];
      item._colJ = row[9];
      item._colT = row[19];

      return item;
    });

    const result = unfilteredResult.filter((item) => {
      if (table === 'department') {
        const hasValue = item._repValue !== undefined && item._repValue !== null && String(item._repValue).trim() !== '';
        return hasValue && String(item.Level || '').trim().toLowerCase() === 'department';
      }

      if (table === 'overview' || table === 'projectInfo') {
        return Boolean(String(item.Item || '').trim() || String(item.Detail || '').trim());
      }

      return item._repValue !== undefined && item._repValue !== null && String(item._repValue).trim() !== '';
    });

    result.forEach((item) => {
      delete item._repValue;
    });

    return { data: result as T[], source: 'live' };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      if (status === 401) {
        return { data: [], source: 'fallback', authRequired: true };
      }

      if (status === 403) {
        return {
          data: [],
          source: 'fallback',
          permissionDenied: true,
          error: `Google Sheets API error (403): ${errorData?.error?.message || error.message}`,
        };
      }
    }

    return {
      data: [],
      source: 'fallback',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function fetchUserProfile(accessToken: string) {
  try {
    return await getUserInfo(accessToken);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }

    console.error('Unexpected error fetching user profile:', error);
    return null;
  }
}

export async function verifyUserAuthorization(
  email: string,
  accessToken: string,
  spreadsheetId: string,
): Promise<boolean> {
  try {
    const data = await getSheetValues(spreadsheetId, 'Employee', accessToken);
    const rows = data.values;

    if (!rows || rows.length === 0) {
      return false;
    }

    const headers = (rows[0] as unknown[]).map(normalizeHeader);
    const emailColIndex = headers.findIndex((header) => header === 'Email');

    if (emailColIndex === -1) {
      console.warn('Authorization check failed: Email column was not found.');
      return false;
    }

    const normalizedEmail = email.toLowerCase().trim();

    return rows
      .slice(1)
      .map((row: unknown[]) => String(row[emailColIndex] || '').toLowerCase().trim())
      .filter(Boolean)
      .includes(normalizedEmail);
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      throw error;
    }

    console.error('Authorization check failed:', error);
    return false;
  }
}

export function formatDateValue(value: unknown): string {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  if (typeof value === 'number' && value > 20000 && value < 100000) {
    const date = new Date((value - 25569) * 86400 * 1000);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  }

  const dateStr = String(value);
  if (/^\d{4}-\d{2}-\d{2}T/.test(dateStr)) {
    const date = new Date(dateStr);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
  }

  return dateStr;
}

export function parseMultiValue(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  return String(value)
    .split(/[,\n]/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function parseDriveImage(url: unknown): string | null {
  if (!url || typeof url !== 'string') {
    return url ? String(url) : null;
  }

  if (url.startsWith('http') && !url.includes('drive.google.com') && !url.includes('usercontent.google.com')) {
    return url;
  }

  const match = url.match(/(?:\/d\/|id=)([a-zA-Z0-9-_]{25,})/);
  if (match?.[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }

  return url;
}

export function escapeHtml(value: unknown): string {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
