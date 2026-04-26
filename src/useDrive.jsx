/**
 * useDrive — React hook for Google Drive integration
 *
 * Auth flow:
 *   1. User clicks "Connect Google Drive"
 *   2. Backend redirects to Google OAuth consent
 *   3. Google redirects back to /#auth=<base64-payload>
 *   4. We parse the hash, store token in localStorage, clear hash
 *   5. All API calls include token as Authorization: Bearer <token>
 *
 * The token payload is: { tokens: { access_token, refresh_token, ... }, user: { email, name, picture } }
 */

import { useState, useEffect, useCallback, useRef } from 'react';

const API = '/api';
const TOKEN_KEY = 'appr_drive_token';
const FOLDER_KEY = 'appr_drive_folder_id';

export function useDrive() {
  const [authState, setAuthState] = useState('idle'); // idle | checking | authenticated | error
  const [user, setUser]           = useState(null);
  const [folderId, setFolderId]   = useState(() => localStorage.getItem(FOLDER_KEY) || null);
  const [uploads, setUploads]     = useState({}); // { [evidenceId]: 'uploading' | 'done' | 'error' }
  const [driveFiles, setDriveFiles] = useState([]);
  const tokenRef = useRef(localStorage.getItem(TOKEN_KEY));

  // ── Parse auth token from URL hash after OAuth redirect ──
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#auth=')) {
      const payload = hash.slice(6);
      localStorage.setItem(TOKEN_KEY, payload);
      tokenRef.current = payload;
      // Clean the URL
      window.history.replaceState(null, '', window.location.pathname);
      checkAuth(payload);
    } else if (tokenRef.current) {
      checkAuth(tokenRef.current);
    }

    // Check for auth error in query string
    const params = new URLSearchParams(window.location.search);
    if (params.get('auth_error')) {
      setAuthState('error');
      console.error('OAuth error:', params.get('auth_error'));
    }
  }, []);

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${tokenRef.current}`
  }), []);

  // ── Check if stored token is still valid ──
  const checkAuth = useCallback(async (token) => {
    if (!token) return;
    setAuthState('checking');
    try {
      const resp = await fetch(`${API}/auth/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setUser(data.user);
        setAuthState('authenticated');
        // Ensure APPR folder exists
        ensureFolder(token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
        tokenRef.current = null;
        setAuthState('idle');
      }
    } catch {
      setAuthState('idle');
    }
  }, []);

  // ── Ensure the "APPR Evidence" folder exists on Drive ──
  const ensureFolder = useCallback(async (token) => {
    const existing = localStorage.getItem(FOLDER_KEY);
    if (existing) { setFolderId(existing); return existing; }

    try {
      const resp = await fetch(`${API}/drive/folder`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token || tokenRef.current}` }
      });
      if (resp.ok) {
        const { folderId: id } = await resp.json();
        localStorage.setItem(FOLDER_KEY, id);
        setFolderId(id);
        return id;
      }
    } catch (e) {
      console.error('Folder ensure error:', e);
    }
    return null;
  }, []);

  // ── Login: redirect to Google OAuth ──
  const login = useCallback(() => {
    window.location.href = `${API}/auth/google`;
  }, []);

  // ── Logout ──
  const logout = useCallback(async () => {
    await fetch(`${API}/auth/logout`, { method: 'POST' }).catch(() => {});
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(FOLDER_KEY);
    tokenRef.current = null;
    setAuthState('idle');
    setUser(null);
    setFolderId(null);
    setDriveFiles([]);
  }, []);

  // ── Upload a single evidence item to Drive ──
  const uploadToDrive = useCallback(async (ev) => {
    if (authState !== 'authenticated') throw new Error('Not authenticated');

    setUploads(p => ({ ...p, [ev.id]: 'uploading' }));

    try {
      // Get or create folder
      let folder = folderId;
      if (!folder) folder = await ensureFolder();
      if (!folder) throw new Error('Could not create Drive folder');

      const formData = new FormData();

      // Convert blob URL back to blob if needed
      let fileBlob = ev.blob || ev.file;
      if (!fileBlob && ev.url) {
        const r = await fetch(ev.url);
        fileBlob = await r.blob();
      }

      formData.append('file',     fileBlob,    ev.fname);
      formData.append('filename', ev.fname);
      formData.append('folderId', folder);
      formData.append('flightNo', ev.flight  || '');
      formData.append('airline',  ev.airline || '');
      formData.append('label',    ev.label   || '');
      formData.append('type',     ev.type    || '');

      const resp = await fetch(`${API}/drive/upload`, {
        method: 'POST',
        headers: authHeaders(),
        body: formData
      });

      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.error || 'Upload failed');
      }

      const result = await resp.json();
      setUploads(p => ({ ...p, [ev.id]: 'done' }));
      return result;
    } catch (err) {
      setUploads(p => ({ ...p, [ev.id]: 'error' }));
      throw err;
    }
  }, [authState, folderId, ensureFolder, authHeaders]);

  // ── Fetch list of Drive evidence files ──
  const fetchDriveFiles = useCallback(async () => {
    if (authState !== 'authenticated') return;
    try {
      const resp = await fetch(
        `${API}/drive/files${folderId ? `?folderId=${folderId}` : ''}`,
        { headers: authHeaders() }
      );
      if (resp.ok) {
        const { files } = await resp.json();
        setDriveFiles(files);
      }
    } catch (e) {
      console.error('Drive list error:', e);
    }
  }, [authState, folderId, authHeaders]);

  return {
    authState,
    user,
    folderId,
    uploads,
    driveFiles,
    login,
    logout,
    uploadToDrive,
    fetchDriveFiles
  };
}
