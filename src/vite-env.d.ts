/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly GOOGLE_CLIENT_ID: string;
  readonly GOOGLE_CLIENT_SECRET: string;
  readonly SPREADSHEET_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
