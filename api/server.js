/**
 * APPR Guide — Express API Server
 *
 * Handles:
 *   GET  /api/auth/google          → redirect to Google OAuth consent screen
 *   GET  /api/auth/google/callback → exchange code for tokens, store in session
 *   GET  /api/auth/status          → return current auth state + user info
 *   POST /api/auth/logout          → clear session
 *   POST /api/drive/upload         → upload a file (audio or photo) to Google Drive
 *   GET  /api/drive/files          → list APPR evidence files from Drive folder
 *   POST /api/drive/folder         → ensure the APPR evidence folder exists
 */

const express    = require('express');
const cors       = require('cors');
const multer     = require('multer');
const { google } = require('googleapis');
const path       = require('path');
const { Readable } = require('stream');

const app = express();

// ─── In-memory session store (replace with redis/cookie-session for production) ───
// For Vercel serverless, we use a simple signed-cookie approach via the token
// stored client-side in localStorage (acceptable for a personal litigation tool).
// Tokens are never logged or stored server-side beyond the request lifecycle.

app.use(cors({
  origin: process.env.APP_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// ─── Multer: accept file uploads into memory (max 50 MB) ───
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// ─── OAuth2 client factory ───
function makeOAuthClient(redirectUri) {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri || `${process.env.APP_URL}/api/auth/google/callback`
  );
}

// ─── Drive client from tokens ───
function driveClient(tokens) {
  const auth = makeOAuthClient();
  auth.setCredentials(tokens);
  return google.drive({ version: 'v3', auth });
}

// ═══════════════════════════════════════════════════════════
// AUTH ROUTES
// ═══════════════════════════════════════════════════════════

// Step 1: redirect user to Google
app.get('/api/auth/google', (req, res) => {
  const oauth2 = makeOAuthClient();
  const url = oauth2.generateAuthUrl({
    access_type: 'offline',       // get refresh_token
    prompt: 'consent',            // always show consent to get refresh_token
    scope: [
      'https://www.googleapis.com/auth/drive.file',  // only files created by this app
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]
  });
  res.redirect(url);
});

// Step 2: Google redirects back with ?code=
app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${process.env.APP_URL}?auth_error=${error || 'no_code'}`);
  }

  try {
    const oauth2 = makeOAuthClient();
    const { tokens } = await oauth2.getToken(code);

    // Get user profile
    oauth2.setCredentials(tokens);
    const people = google.oauth2({ version: 'v2', auth: oauth2 });
    const { data: userInfo } = await people.userinfo.get();

    // Encode tokens + user info as a base64 payload and pass back to frontend
    // The frontend stores this in localStorage and sends it as Bearer token
    const payload = Buffer.from(JSON.stringify({
      tokens,
      user: {
        email: userInfo.email,
        name:  userInfo.name,
        picture: userInfo.picture
      }
    })).toString('base64url');

    // Redirect to app with token in hash (never in query string to avoid server logs)
    res.redirect(`${process.env.APP_URL}/#auth=${payload}`);
  } catch (err) {
    console.error('OAuth callback error:', err);
    res.redirect(`${process.env.APP_URL}?auth_error=token_exchange_failed`);
  }
});

// ─── Middleware: parse Bearer token from Authorization header ───
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  try {
    const payload = JSON.parse(Buffer.from(auth.slice(7), 'base64url').toString());
    req.tokens   = payload.tokens;
    req.userInfo = payload.user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Status check — frontend polls this on load
app.get('/api/auth/status', requireAuth, (req, res) => {
  res.json({ authenticated: true, user: req.userInfo });
});

app.post('/api/auth/logout', (req, res) => {
  // Tokens are client-side only; just confirm
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════
// DRIVE ROUTES
// ═══════════════════════════════════════════════════════════

const FOLDER_NAME = 'APPR Evidence';

// Ensure the APPR Evidence folder exists; return its ID
app.post('/api/drive/folder', requireAuth, async (req, res) => {
  try {
    const drive = driveClient(req.tokens);

    // Search for existing folder
    const list = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (list.data.files.length > 0) {
      return res.json({ folderId: list.data.files[0].id, created: false });
    }

    // Create it
    const folder = await drive.files.create({
      requestBody: {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });

    res.json({ folderId: folder.data.id, created: true });
  } catch (err) {
    console.error('Folder create error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Upload a file to Drive
// Body (multipart/form-data):
//   file       — the audio/image blob
//   filename   — desired filename (e.g. APPR_Audio_AC123_2025-02-14.webm)
//   folderId   — Drive folder ID from /api/drive/folder
//   flightNo   — flight number tag
//   airline    — airline name tag
//   label      — human description
//   type       — "audio" | "photo"
app.post('/api/drive/upload', requireAuth, upload.single('file'), async (req, res) => {
  const { filename, folderId, flightNo, airline, label, type } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'No file provided' });
  }

  try {
    const drive = driveClient(req.tokens);

    // Build description string for the Drive file
    const description = [
      'APPR Evidence',
      label       ? `Description: ${label}`  : null,
      flightNo    ? `Flight: ${flightNo}`     : null,
      airline     ? `Airline: ${airline}`     : null,
      type        ? `Type: ${type}`           : null,
      `Captured: ${new Date().toISOString()}`,
      'Generated by APPR Guide app'
    ].filter(Boolean).join('\n');

    // Convert buffer to readable stream
    const stream = Readable.from(req.file.buffer);

    const driveFile = await drive.files.create({
      requestBody: {
        name:        filename || req.file.originalname,
        parents:     folderId ? [folderId] : [],
        description,
        properties: {
          appr:     'true',
          flight:   flightNo || '',
          airline:  airline  || '',
          type:     type     || ''
        }
      },
      media: {
        mimeType: req.file.mimetype,
        body:     stream
      },
      fields: 'id, name, webViewLink, size, createdTime'
    });

    res.json({
      ok:          true,
      fileId:      driveFile.data.id,
      fileName:    driveFile.data.name,
      webViewLink: driveFile.data.webViewLink,
      size:        driveFile.data.size,
      createdTime: driveFile.data.createdTime
    });
  } catch (err) {
    console.error('Drive upload error:', err);
    res.status(500).json({ error: err.message });
  }
});

// List APPR evidence files from Drive
app.get('/api/drive/files', requireAuth, async (req, res) => {
  const { folderId } = req.query;
  try {
    const drive = driveClient(req.tokens);
    const q = folderId
      ? `'${folderId}' in parents and trashed=false`
      : `properties has { key='appr' and value='true' } and trashed=false`;

    const list = await drive.files.list({
      q,
      fields: 'files(id, name, mimeType, size, createdTime, webViewLink, properties)',
      orderBy: 'createdTime desc',
      pageSize: 100
    });

    res.json({ files: list.data.files || [] });
  } catch (err) {
    console.error('Drive list error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Start server (local dev only — Vercel uses serverless) ───
if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, () => console.log(`APPR API running on http://localhost:${PORT}`));
}

module.exports = app;
