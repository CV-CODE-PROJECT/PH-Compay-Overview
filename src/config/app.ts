export interface AppConfig {
  googleClientId: string;
  googleClientSecret: string;
  spreadsheetId: string;
}

function readRequiredEnv(name: 'GOOGLE_CLIENT_ID' | 'GOOGLE_CLIENT_SECRET' | 'SPREADSHEET_ID'): string {
  const value = import.meta.env[name];

  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value.trim();
}

export function getAppConfig(): AppConfig {
  return {
    googleClientId: readRequiredEnv('GOOGLE_CLIENT_ID'),
    googleClientSecret: readRequiredEnv('GOOGLE_CLIENT_SECRET'),
    spreadsheetId: readRequiredEnv('SPREADSHEET_ID'),
  };
}
