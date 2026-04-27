import 'dotenv/config';

import axios from 'axios';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const PORT = Number(process.env.PORT || 3000);
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const SHEET_NAME_MAP: Record<string, string> = {
  employee: 'Employee',
  'employee-position': '⟳Employee position',
  position: 'Position',
  'position-process': 'Possition process',
  team: 'Team',
  department: 'Team',
  'reporting-lines': 'Employee',
  workflows: 'Workflows',
  overview: 'Project info',
  'project-info': 'Project info',
};

function requirePublicConfig() {
  if (!SPREADSHEET_ID || !GOOGLE_CLIENT_ID) {
    throw new Error('Missing required environment variables: GOOGLE_CLIENT_ID and SPREADSHEET_ID.');
  }

  return {
    googleClientId: GOOGLE_CLIENT_ID,
    spreadsheetId: SPREADSHEET_ID,
  };
}

async function startServer() {
  const app = express();

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/config', (_req, res) => {
    try {
      res.json(requirePublicConfig());
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Runtime configuration is invalid.';
      res.status(500).json({ error: message });
    }
  });

  app.get('/api/sheet/:name', async (req, res) => {
    const authHeader = req.headers.authorization;
    const sheetName = SHEET_NAME_MAP[req.params.name];

    if (!authHeader) {
      return res.status(401).json({ error: 'Missing Authorization header. Use Bearer <token>.' });
    }

    if (!sheetName) {
      return res.status(400).json({ error: 'Unsupported sheet name.' });
    }

    try {
      const { spreadsheetId } = requirePublicConfig();
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`,
        {
          params: { valueRenderOption: 'UNFORMATTED_VALUE' },
          headers: {
            Authorization: authHeader,
            Accept: 'application/json',
          },
          timeout: 10000,
        },
      );

      res.json(response.data);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status || 500;
        const payload = error.response?.data || { error: error.message };
        console.error(`Sheet proxy error [${req.params.name}]`, payload);
        return res.status(status).json(payload);
      }

      const message = error instanceof Error ? error.message : 'Unexpected proxy error.';
      console.error(`Sheet proxy error [${req.params.name}]`, message);
      return res.status(500).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
