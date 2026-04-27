/**
 * APPR Guide — Vercel-Compatible Express API
 */

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { google } = require('googleapis');
const { Readable } = require('stream');

const app = express();

// ─── Middleware ────────────────────────────────
app.use(cors({
  origin: process.env.APP_URL || '*',
  credentials: true
}));

app.use(express.json());

// ─── File upload (memory storage) ──────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// ─── Google OAuth client ───────────────────────
function makeOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.APP_URL}/api/auth/google/callback`
  );
}

// ─── Drive client ───────────────────────────────
function driveClient(tokens) {
  const auth = makeOAuthClient();
  auth.setCredentials(tokens);
  return google.drive({ version: 'v3', auth });
}

// ═══════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════

app.get('/api/auth/google', (req, res) => {
  const oauth2 = makeOAuthClient();

  const url = oauth2.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]
  });

  res.redirect(url);
});

app.get('/api/auth/google/callback', async (req, res) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${process.env.APP_URL}?auth_error=${error || 'no_code'}`);
  }

  try {
    const oauth2 = makeOAuthClient();
    const { tokens } = await oauth2.getToken(code);

    oauth2.setCredentials(tokens);

    const people = google.oauth2({ version: 'v2', auth: oauth2 });
    const { data: userInfo } = await people.userinfo.get();

    const payload = Buffer.from(JSON.stringify({
      tokens,
      user: userInfo
    })).toString('base64url');

    res.redirect(`${process.env.APP_URL}/#auth=${payload}`);
  } catch (err) {
    console.error(err);
    res.redirect(`${process.env.APP_URL}?auth_error=token_failed`);
  }
});

// ─── Auth middleware ───────────────────────────
function requireAuth(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const payload = JSON.parse(
      Buffer.from(auth.slice(7), 'base64url').toString()
    );

    req.tokens = payload.tokens;
    req.user = payload.user;

    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ═══════════════════════════════════════════════
// DRIVE
// ═══════════════════════════════════════════════

const FOLDER_NAME = 'APPR Evidence';

app.post('/api/drive/folder', requireAuth, async (req, res) => {
  try {
    const drive = driveClient(req.tokens);

    const existing = await drive.files.list({
      q: `mimeType='application/vnd.google-apps.folder' and name='${FOLDER_NAME}' and trashed=false`,
      fields: 'files(id, name)'
    });

    if (existing.data.files.length > 0) {
      return res.json({ folderId: existing.data.files[0].id });
    }

    const folder = await drive.files.create({
      requestBody: {
        name: FOLDER_NAME,
        mimeType: 'application/vnd.google-apps.folder'
      },
      fields: 'id'
    });

    res.json({ folderId: folder.data.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/drive/upload', requireAuth, upload.single('file'), async (req, res) => {
  try {
    const drive = driveClient(req.tokens);

    const stream = Readable.from(req.file.buffer);

    const result = await drive.files.create({
      requestBody: {
        name: req.body.filename || req.file.originalname,
        parents: req.body.folderId ? [req.body.folderId] : []
      },
      media: {
        mimeType: req.file.mimetype,
        body: stream
      },
      fields: 'id, name, webViewLink'
    });

    res.json(result.data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/drive/files', requireAuth, async (req, res) => {
  try {
    const drive = driveClient(req.tokens);

    const list = await drive.files.list({
      q: `'${req.query.folderId || ''}' in parents and trashed=false`,
      fields: 'files(id, name, webViewLink)',
      orderBy: 'createdTime desc'
    });

    res.json({ files: list.data.files || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════
// EXPORT (CRITICAL FOR VERCEL)
// ═══════════════════════════════════════════════

module.exports = app;
