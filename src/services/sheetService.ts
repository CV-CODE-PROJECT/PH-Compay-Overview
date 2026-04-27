/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { TableType } from '../types';
import { getSheetValues, getUserInfo } from '../apis/sheets';
import axios from 'axios';

export interface DataResponse<T> {
  data: T[];
  source: 'live' | 'fallback';
  error?: string;
  authRequired?: boolean;
  permissionDenied?: boolean;
}

export async function fetchSheetData<T>(table: TableType, accessToken: string, spreadsheetId: string): Promise<DataResponse<T>> {
  const sheetNameMap: Record<TableType, string> = {
    employee: 'Employee',
    employeePosition: "'⟳Employee position'",
    position: 'Position',
    positionProcess: "'Possition process'",
    team: 'Team',
    orgChart: "'⟳Employee position'",
    department: 'Team',
    reportingLines: 'Employee',
    workflows: 'Workflows',
    dashboard: 'Employee', // Fallback
    overview: "'Project info'",
    projectInfo: "'Project info'"
  };

  const sheetName = sheetNameMap[table];

  try {
    if (!accessToken) {
      console.error("fetchSheetData: No access token provided.");
      return { data: [], source: 'fallback', authRequired: true };
    }

    const data = await getSheetValues(spreadsheetId, sheetName, accessToken);
    const rows = data.values;
    if (!rows || rows.length === 0) return { data: [], source: 'live' };
    const headers = rows[0];
    
    // Determine representative column index
    let repColIndex = headers.findIndex((h: string) => typeof h === 'string' && h.includes('🏷️'));
    if (repColIndex === -1) {
      repColIndex = 7; // Column H (0-indexed 7)
    }

    const uncleanedResult = rows.slice(1).map((row: any[], i: number) => {
      const obj: any = { _internalId: `${table}-row-${i}` };
      headers.forEach((header: string, index: number) => {
        // Strip 🏷️ prefix to maintain compatibility with predefined keys (e.g., 'Employee')
        const cleanHeader = typeof header === 'string' ? header.replace(/🏷️\s*/g, '') : String(header || '');
        obj[cleanHeader] = row[index];
      });
      // Store the raw row value for the representative column to filter later
      obj._repValue = row[repColIndex];
      // Store column J explicitly for images
      obj._colJ = row[9];
      // Store column T explicitly for images (if available)
      obj._colT = row[19];
      return obj;
    });

    const result = uncleanedResult.filter((item: any) => {
      // Special filtering for synthetic 'department' table from 'Team' sheet
      if (table === 'department') {
        const val = item._repValue;
        const hasValue = val !== undefined && val !== null && String(val).trim() !== '';
        return hasValue && item.Level === 'Department';
      }

      // For overview/projectInfo, be more lenient as it might not follow the standard schema
      if (table === 'overview' || table === 'projectInfo') {
        // Just verify there's at least some data in the row (any of Item or Detail)
        return (item.Item && String(item.Item).trim() !== '') || 
               (item.Detail && String(item.Detail).trim() !== '');
      }

      // Standard filtering: Only keep rows where the representative column has a value
      const val = item._repValue;
      return val !== undefined && val !== null && String(val).trim() !== '';
    });
    
    // Clean up _repValue
    result.forEach((item: any) => delete item._repValue);

    return { data: result, source: 'live' };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const errorData = error.response?.data;

      console.error(`Sheets API Fetch Error [${status}]:`, errorData);

      if (status === 401) {
        return { data: [], source: 'fallback', authRequired: true };
      }
      if (status === 403) {
        return { 
          data: [], 
          source: 'fallback', 
          permissionDenied: true, 
          error: `Google Sheets API Error (403): ${errorData?.error?.message || error.message}. Please verify that the Google Sheets API is enabled in your Cloud Console.` 
        };
      }
    }

    console.warn(`Direct Sheets fetch failed for ${table}.`, error);
    return { 
      data: [], 
      source: 'fallback',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function fetchUserProfile(accessToken: string) {
  try {
    const data = await getUserInfo(accessToken);
    return data;
  } catch (e) {
    if (axios.isAxiosError(e) && e.response?.status === 401) {
      // Token expired, just return null and let App.tsx handle logout
      return null;
    }
    console.error("Unexpected error fetching user profile:", e);
    return null;
  }
}

/**
 * Checks if the user's email exists in the 'Employee' sheet's Email column.
 */
export async function verifyUserAuthorization(email: string, accessToken: string, spreadsheetId: string): Promise<boolean> {
  try {
    const data = await getSheetValues(spreadsheetId, 'Employee', accessToken);
    const rows = data.values;
    if (!rows || rows.length === 0) return false;

    const headers = rows[0];
    
    const emailColIndex = headers.findIndex((h: string) => {
      if (typeof h !== 'string') return false;
      const cleanH = h.replace(/[📧🏷️\s]/g, '').toLowerCase();
      return cleanH === 'email' || cleanH.includes('email');
    });

    if (emailColIndex === -1) {
      console.warn("Authorization Error: Could not find any column named 'Email' in headers:", headers);
      return false;
    }

    // Check all rows (skipping header) for the email
    const authorizedEmails = rows.slice(1).map((row: any[]) => 
      String(row[emailColIndex] || '').toLowerCase().trim()
    ).filter(Boolean);

    const isAuthorized = authorizedEmails.includes(email.toLowerCase().trim());
    
    return isAuthorized;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Rethrow 401 so App.tsx can distinguish between "not authorized" and "session expired"
      throw error;
    }
    console.error("Authorization check failed:", error);
    return false;
  }
}

export function formatDateValue(value: any): string {
  if (value === undefined || value === null || value === '') return '';
  
  // Handle numeric Excel date serials
  if (typeof value === 'number') {
    // Basic heuristic: Excel dates for current era are between 30000 and 60000
    if (value > 20000 && value < 100000) {
      const date = new Date((value - 25569) * 86400 * 1000);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    }
  }

  // Handle strings that might be date-like
  const dateStr = String(value);
  if (dateStr.match(/^\d{4}-\d{2}-\d{2}T/)) { // ISO date
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
  }

  return dateStr;
}

export function parseMultiValue(value: string | undefined): string[] {
  if (!value) return [];
  return String(value).split(/[,\n]/).map(v => v.trim()).filter(Boolean);
}

export function parseDriveImage(url: any): string | null {
  if (!url || typeof url !== 'string') {
    return url ? String(url) : null;
  }
  
  // If it's already a direct link or not a Google Drive link, return as is
  if (url.startsWith('http') && !url.includes('drive.google.com') && !url.includes('usercontent.google.com')) {
    return url;
  }

  // Regex to match ID from various Drive URL formats:
  // - drive.google.com/file/d/ID/...
  // - drive.google.com/open?id=ID
  // - drive.google.com/uc?id=ID
  // - drive.usercontent.google.com/download?id=ID
  const match = url.match(/(?:\/d\/|id=)([a-zA-Z0-9-_]{25,})/);
  if (match && match[1]) {
    // lh3.googleusercontent.com/d/{ID} is a robust format for public drive files
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  
  return url;
}
