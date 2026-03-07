import { useState } from 'react';
import type { SavedPatch } from '../types';
import { listPatches } from '../db';
import { savePatchToDB } from '../db';
import {
  requestAccessToken,
  revokeToken,
  createSpreadsheet,
  pushPatches,
  pullPatches,
} from '../sheets';

interface Props {
  open: boolean;
  onClose: () => void;
  onPatchesImported: (patches: SavedPatch[]) => void;
}

const LS_SHEET_ID_KEY = 'modular-patch-docs-sheet-id';

export function SheetsPanel({ open, onClose, onPatchesImported }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [spreadsheetId, setSpreadsheetId] = useState(
    () => localStorage.getItem(LS_SHEET_ID_KEY) ?? '',
  );
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const saveSheetId = (id: string) => {
    setSpreadsheetId(id);
    if (id) localStorage.setItem(LS_SHEET_ID_KEY, id);
    else localStorage.removeItem(LS_SHEET_ID_KEY);
  };

  const handleConnect = async () => {
    setBusy(true);
    setStatus('');
    try {
      const t = await requestAccessToken();
      setToken(t);
      setStatus('Connected');
    } catch (err) {
      setStatus(`Auth failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const handleDisconnect = () => {
    if (token) revokeToken(token);
    setToken(null);
    setStatus('Disconnected');
  };

  const handleCreate = async () => {
    if (!token) return;
    setBusy(true);
    setStatus('');
    try {
      const id = await createSpreadsheet(token);
      saveSheetId(id);
      setStatus('Spreadsheet created');
    } catch (err) {
      setStatus(`Create failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const handlePush = async () => {
    if (!token || !spreadsheetId) return;
    setBusy(true);
    setStatus('');
    try {
      const patches = await listPatches();
      await pushPatches(token, spreadsheetId, patches);
      setStatus(`Pushed ${patches.length} patch${patches.length !== 1 ? 'es' : ''}`);
    } catch (err) {
      setStatus(`Push failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  const handlePull = async () => {
    if (!token || !spreadsheetId) return;
    setBusy(true);
    setStatus('');
    try {
      const remote = await pullPatches(token, spreadsheetId);
      // Merge into IndexedDB (remote wins on same id)
      for (const p of remote) {
        await savePatchToDB(p);
      }
      onPatchesImported(remote);
      setStatus(`Pulled ${remote.length} patch${remote.length !== 1 ? 'es' : ''}`);
    } catch (err) {
      setStatus(`Pull failed: ${(err as Error).message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.3)' }}
         onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           className="bg-white rounded-lg shadow-xl p-5 w-96 flex flex-col gap-3">
        <div className="text-sm font-semibold text-neutral-700">Google Sheets Sync</div>

        {/* Auth */}
        <div className="flex items-center gap-2">
          {token ? (
            <button onClick={handleDisconnect} disabled={busy}
                    className="text-xs px-2 py-1 border rounded text-neutral-600 hover:bg-neutral-50">
              Disconnect
            </button>
          ) : (
            <button onClick={handleConnect} disabled={busy}
                    className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50">
              Connect Google
            </button>
          )}
        </div>

        {/* Spreadsheet ID */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-neutral-400 uppercase tracking-wide">Spreadsheet ID</label>
          <div className="flex gap-1">
            <input
              value={spreadsheetId}
              onChange={e => saveSheetId(e.target.value)}
              placeholder="Paste or create new"
              className="flex-1 border rounded px-2 py-1 text-xs outline-none focus:border-blue-400"
            />
            <button onClick={handleCreate} disabled={busy || !token}
                    className="text-xs px-2 py-1 border rounded text-neutral-600 hover:bg-neutral-50 disabled:opacity-40 shrink-0">
              New
            </button>
          </div>
        </div>

        {/* Push / Pull */}
        <div className="flex gap-2">
          <button onClick={handlePush} disabled={busy || !token || !spreadsheetId}
                  className="flex-1 text-xs px-2 py-1.5 border rounded text-neutral-600 hover:bg-neutral-50 disabled:opacity-40">
            Push to Sheets
          </button>
          <button onClick={handlePull} disabled={busy || !token || !spreadsheetId}
                  className="flex-1 text-xs px-2 py-1.5 border rounded text-neutral-600 hover:bg-neutral-50 disabled:opacity-40">
            Pull from Sheets
          </button>
        </div>

        {/* Status */}
        {status && (
          <div className="text-[10px] text-neutral-500">{status}</div>
        )}

        <div className="flex justify-end">
          <button onClick={onClose}
                  className="px-3 py-1 text-xs text-neutral-500 hover:text-neutral-700">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
