# PH Company Overview

Internal dashboard for browsing employee, role, team, and project overview data from Google Sheets.

## Runtime requirements

- Node.js 20+
- A Google OAuth client configured for Google Identity Services
- Google Sheets API enabled for the same Google Cloud project

## Environment variables

Create `.env` from `.env.example` and set:

- `GOOGLE_CLIENT_ID`
- `SPREADSHEET_ID`
- `PORT` (optional, defaults to `3000`)

`GOOGLE_CLIENT_SECRET` is not used by this app and should not be added unless the authentication flow changes.

## Development

1. Install dependencies:
   `npm install`
2. Create `.env`
3. Run the app:
   `npm run dev`

The Express server exposes:

- `GET /api/health`
- `GET /api/config`
- `GET /api/sheet/:name`

## Quality checks

- Type check: `npm run lint`
- Build client: `npm run build`
