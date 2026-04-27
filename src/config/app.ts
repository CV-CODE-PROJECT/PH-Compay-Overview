export interface AppConfig {
  googleClientId: string;
  googleClientSecret: string;
  spreadsheetId: string;
}

function readRequiredEnv(name: 'VITE_GOOGLE_CLIENT_ID' | 'VITE_GOOGLE_CLIENT_SECRET' | 'VITE_SPREADSHEET_ID'): string {
  const value = import.meta.env[name];

  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

export function getAppConfig(): AppConfig {
  return {
    googleClientId: readRequiredEnv('VITE_GOOGLE_CLIENT_ID'),
    googleClientSecret: readRequiredEnv('VITE_GOOGLE_CLIENT_SECRET'),
    spreadsheetId: readRequiredEnv('VITE_SPREADSHEET_ID'),
  };
}
