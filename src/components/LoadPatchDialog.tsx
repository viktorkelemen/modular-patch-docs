import { useState, useEffect } from 'react';
import type { SavedPatch } from '../types';
import { listPatches, deletePatchFromDB } from '../db';

interface Props {
  open: boolean;
  onClose: () => void;
  onLoad: (patch: SavedPatch) => void;
}

export function LoadPatchDialog({ open, onClose, onLoad }: Props) {
  const [patches, setPatches] = useState<SavedPatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError('');
    setConfirmDeleteId(null);
    listPatches()
      .then(p => {
        setPatches(p);
        setLoading(false);
      })
      .catch(err => {
        setError(err instanceof Error ? err.message : 'Failed to load patches');
        setLoading(false);
      });
  }, [open]);

  if (!open) return null;

  const handleDelete = async (id: string) => {
    await deletePatchFromDB(id);
    setPatches(prev => prev.filter(p => p.id !== id));
    setConfirmDeleteId(null);
  };

  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
      + ' ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center"
         style={{ background: 'rgba(0,0,0,0.3)' }}
         onClick={onClose}>
      <div onClick={e => e.stopPropagation()}
           className="bg-white rounded-lg shadow-xl p-5 w-96 max-h-[70vh] flex flex-col gap-3">
        <div className="text-sm font-semibold text-neutral-700">Load Patch</div>

        {loading ? (
          <div className="text-xs text-neutral-400 py-4 text-center">Loading...</div>
        ) : error ? (
          <div className="text-xs text-red-500 py-4 text-center">{error}</div>
        ) : patches.length === 0 ? (
          <div className="text-xs text-neutral-400 py-4 text-center">No saved patches yet.</div>
        ) : (
          <div className="overflow-y-auto flex flex-col gap-1 -mx-1">
            {patches.map(p => (
              <div key={p.id}
                   className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-neutral-50 group">
                <button onClick={() => onLoad(p)}
                        className="flex-1 text-left min-w-0">
                  <div className="text-sm text-neutral-700 truncate">{p.name}</div>
                  <div className="text-[10px] text-neutral-400">{fmtDate(p.savedAt)}</div>
                </button>
                {confirmDeleteId === p.id ? (
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => handleDelete(p.id)}
                            className="text-[10px] text-red-500 hover:text-red-700">
                      Confirm
                    </button>
                    <button onClick={() => setConfirmDeleteId(null)}
                            className="text-[10px] text-neutral-400 hover:text-neutral-600">
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmDeleteId(p.id)}
                          className="text-[10px] text-neutral-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                          title="Delete">
                    Delete
                  </button>
                )}
              </div>
            ))}
          </div>
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
