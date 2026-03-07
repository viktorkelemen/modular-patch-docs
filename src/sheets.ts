import type { SavedPatch } from './types';
import { validatePatchState } from './validate';

const SCOPES = 'https://www.googleapis.com/auth/spreadsheets';
const DISCOVERY = 'https://sheets.googleapis.com/v4/spreadsheets';
const SHEET_NAME = 'Patches';

// ── Script loader ──

let gisLoaded = false;

function loadGIS(): Promise<void> {
  if (gisLoaded && window.google?.accounts) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      gisLoaded = true;
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.onload = () => { gisLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(script);
  });
}

// ── Auth ──

export async function requestAccessToken(): Promise<string> {
  await loadGIS();
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error('VITE_GOOGLE_CLIENT_ID not set');

  return new Promise((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp) => {
        if (resp.error) {
          reject(new Error(resp.error_description || resp.error));
        } else {
          resolve(resp.access_token);
        }
      },
    });
    client.requestAccessToken({ prompt: '' });
  });
}

export function revokeToken(token: string): void {
  window.google?.accounts.oauth2.revoke(token);
}

// ── Error helpers ──

export function formatError(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

export class TokenExpiredError extends Error {
  constructor() {
    super('Token expired — please reconnect');
    this.name = 'TokenExpiredError';
  }
}

// ── Sheets helpers ──

async function sheetsRequest(token: string, url: string, init?: RequestInit) {
  const resp = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });
  if (resp.status === 401) throw new TokenExpiredError();
  if (!resp.ok) throw new Error(`Sheets API error: ${resp.status} ${resp.statusText}`);
  return resp.json();
}

function sheetsGet(token: string, url: string) {
  return sheetsRequest(token, url);
}

function sheetsPost(token: string, url: string, body: unknown) {
  return sheetsRequest(token, url, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

function sheetsPut(token: string, url: string, body: unknown) {
  return sheetsRequest(token, url, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

// ── Public API ──

export async function createSpreadsheet(token: string): Promise<string> {
  const data = await sheetsPost(token, DISCOVERY, {
    properties: { title: 'Modular Patch Docs — Patches' },
    sheets: [{ properties: { title: SHEET_NAME } }],
  });
  const spreadsheetId = data.spreadsheetId as string;
  // Write header row
  await sheetsPut(
    token,
    `${DISCOVERY}/${spreadsheetId}/values/${SHEET_NAME}!A1:D1?valueInputOption=RAW`,
    { values: [['id', 'name', 'savedAt', 'stateJSON']] },
  );
  return spreadsheetId;
}

export async function pushPatches(
  token: string,
  spreadsheetId: string,
  patches: SavedPatch[],
): Promise<void> {
  // Clear existing data (keep header)
  const range = `${SHEET_NAME}!A2:D`;
  try {
    await sheetsPost(
      token,
      `${DISCOVERY}/${spreadsheetId}/values/${range}:clear`,
      {},
    );
  } catch (err) {
    // Range may not exist yet on a fresh spreadsheet — only swallow 400s
    if (err instanceof TokenExpiredError) throw err;
    console.warn('Clear range failed (may be empty):', formatError(err));
  }

  if (patches.length === 0) return;

  const rows = patches.map(p => [
    p.id,
    p.name,
    String(p.savedAt),
    JSON.stringify(p.state),
  ]);

  await sheetsPut(
    token,
    `${DISCOVERY}/${spreadsheetId}/values/${SHEET_NAME}!A2:D?valueInputOption=RAW`,
    { values: rows },
  );
}

export async function pullPatches(
  token: string,
  spreadsheetId: string,
): Promise<SavedPatch[]> {
  const data = await sheetsGet(
    token,
    `${DISCOVERY}/${spreadsheetId}/values/${SHEET_NAME}!A2:D1000`,
  );
  const rows = (data.values ?? []) as string[][];
  const patches: SavedPatch[] = [];

  for (const r of rows) {
    if (r.length < 4) {
      console.warn('Skipping malformed row (expected 4 columns):', r);
      continue;
    }
    let state: unknown;
    try {
      state = JSON.parse(r[3]);
    } catch {
      console.warn('Skipping row with invalid JSON in stateJSON column:', r[0]);
      continue;
    }
    if (!validatePatchState(state)) {
      console.warn('Skipping row with invalid PatchState shape:', r[0]);
      continue;
    }
    patches.push({
      id: r[0],
      name: r[1],
      savedAt: Number(r[2]),
      state,
    });
  }

  return patches;
}
