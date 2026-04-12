# APPR Guide — Air Passenger Protection Regulations App

A mobile-first web app for asserting your rights under Canada's Air Passenger Protection Regulations, with live flight lookup, voice/photo evidence capture, and automatic upload to Google Drive.

---

## Features

- **APPR Guides** — Step-by-step guidance for denied boarding, delays, cancellations, and baggage issues
- **Flight Lookup** — Live flight status via OpenSky Network, deep-links to FlightAware, Flightradar24, Flighty
- **Evidence Capture** — Voice recording and photo capture, auto-tagged with flight number and airline
- **Google Drive Upload** — Direct upload to a dedicated `APPR Evidence` folder, files named for litigation
- **Airline Claim Links** — Direct links to Air Canada, WestJet, and Porter Airlines claim forms
- **Evidence Checklist** — Guided documentation checklist for use at the airport

---

## Deployment Guide

### Step 1 — Get Google OAuth2 credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use an existing one)
3. Go to **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Add authorised redirect URIs:
   - `http://localhost:3001/api/auth/google/callback` (for local dev)
   - `https://YOUR-APP.vercel.app/api/auth/google/callback` (for production — add after deploying)
6. Copy your **Client ID** and **Client Secret**
7. Go to **APIs & Services → Library** and enable the **Google Drive API**
8. Go to **OAuth consent screen**, set User Type to **External**, add your own email as a test user

---

### Step 2 — Deploy to Vercel

#### Option A: Deploy via Vercel CLI (recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Clone or download this project, then:
cd appr-app
npm install

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: appr-guide (or your choice)
# - In which directory is your code located? ./
# - Want to override settings? No

# After first deploy, note your URL: https://appr-guide-xxxx.vercel.app
```

#### Option B: Deploy via GitHub + Vercel dashboard

1. Push this project to a GitHub repository
2. Go to [vercel.com](https://vercel.com) → New Project → Import from GitHub
3. Select your repository
4. Framework: **Vite**
5. Build command: `npm run build`
6. Output directory: `dist`
7. Click Deploy

---

### Step 3 — Set environment variables in Vercel

In the Vercel dashboard, go to your project → **Settings → Environment Variables** and add:

| Variable | Value |
|---|---|
| `GOOGLE_CLIENT_ID` | Your Google OAuth2 Client ID |
| `GOOGLE_CLIENT_SECRET` | Your Google OAuth2 Client Secret |
| `APP_URL` | `https://your-app-name.vercel.app` |
| `SESSION_SECRET` | Any long random string |

Then go to **Deployments** and **Redeploy** to pick up the new variables.

---

### Step 4 — Update Google OAuth redirect URI

1. Go back to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Edit your OAuth 2.0 Client ID
3. Add the production redirect URI: `https://your-app-name.vercel.app/api/auth/google/callback`
4. Save

---

### Step 5 — Test

1. Open your Vercel URL on your phone
2. Go to **Evidence Capture**
3. Tap **Sign in with Google**
4. Authorize the app — it requests only `drive.file` scope (can only see files it creates)
5. Record audio or capture a photo
6. Go to Library → tap **☁️ Drive**
7. Check your Google Drive — you should see an **APPR Evidence** folder with the uploaded file

---

## Local Development

```bash
# Copy environment template
cp .env.example .env
# Edit .env with your Google credentials and APP_URL=http://localhost:5173

# Install dependencies
npm install

# Run both frontend (Vite) and backend (Express) together
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

---

## File Structure

```
appr-app/
├── api/
│   └── server.js          # Express backend — OAuth2 + Drive upload API
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Main app component
│   └── useDrive.js        # Google Drive React hook
├── index.html
├── vite.config.js
├── vercel.json            # Vercel routing config
├── package.json
└── .env.example
```

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/auth/google` | Redirect to Google OAuth consent |
| GET | `/api/auth/google/callback` | Exchange OAuth code for tokens |
| GET | `/api/auth/status` | Check authentication status |
| POST | `/api/auth/logout` | Clear session |
| POST | `/api/drive/folder` | Ensure APPR Evidence folder exists |
| POST | `/api/drive/upload` | Upload audio/photo file to Drive |
| GET | `/api/drive/files` | List evidence files from Drive |

---

## Google Drive Permissions

The app requests only the `drive.file` scope — this means it can **only access files that it created itself**. It cannot read, modify, or delete any other files in your Google Drive.

---

## Recording Consent Notice

In most Canadian provinces, **one-party consent** applies — a participant in a conversation may record it without notifying the other parties. Laws vary by province and situation. This tool is provided for personal legal documentation purposes. Consult a lawyer for advice specific to your circumstances.

---

## Regulatory Reference

- Air Passenger Protection Regulations (SOR/2019-150)
- Canada Transportation Act, S.C. 1996, c. 10
- Montreal Convention (for international flights)
- Canadian Transportation Agency: [otc-cta.gc.ca](https://otc-cta.gc.ca)
