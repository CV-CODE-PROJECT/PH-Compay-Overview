import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // API routes
  // app.get("/api/config", (req, res) => {
  //   res.json({
  //     googleClientId: process.env.GOOGLE_CLIENT_ID || '1041613406784-5rnbpi7saldnbdlpsr4nve7bgnv1dh30.apps.googleusercontent.com',
  //     spreadsheetId: process.env.SPREADSHEET_ID || '14NM9PVywNKksD6waxWj2adzvHIkjHOKI_HCYFFJgAeg'
  //   });
  // });

  // Generic Sheet Proxy API
  app.get("/api/sheet/:name", async (req, res) => {
    const { name } = req.params;
    // Map friendly names if needed
    let sheetName = name;
    if (name === 'employee-position') sheetName = '⟳Employee position';
    if (name === 'employee') sheetName = 'Employee';

    const authHeader = req.headers.authorization;
    const spreadsheetId = process.env.SPREADSHEET_ID || '14NM9PVywNKksD6waxWj2adzvHIkjHOKI_HCYFFJgAeg';
    
    if (!authHeader) {
      return res.status(401).json({ error: "Missing Authorization header. Use Bearer <token>" });
    }

    try {
      const response = await axios.get(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}`,
        { 
          params: { valueRenderOption: 'UNFORMATTED_VALUE' },
          headers: { 
            'Authorization': authHeader,
            'Accept': 'application/json'
          } 
        }
      );
      res.json(response.data);
    } catch (error: any) {
      console.error(`Error fetching sheet ${sheetName}:`, error.response?.data || error.message);
      res.status(error.response?.status || 500).json(error.response?.data || { error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
