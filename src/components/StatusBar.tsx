import { useRef } from 'react';

interface Props {
  moduleCount: number;
  cableCount: number;
  zoom: number;
  snapToGrid: boolean;
  onToggleSnap: () => void;
  onExportPNG: () => void;
  onExportPDF: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onSave: () => void;
  onLoad: () => void;
  onSync: () => void;
}

export function StatusBar({
  moduleCount, cableCount, zoom,
  snapToGrid, onToggleSnap,
  onExportPNG, onExportPDF, onExportJSON, onImportJSON,
  onSave, onLoad, onSync,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-7 flex items-center justify-between px-3 border-t"
         style={{ background: '#fafaf8', borderColor: '#ddd', fontSize: '11px' }}>
      <div className="flex items-center gap-4 text-neutral-400">
        <span>{moduleCount} module{moduleCount !== 1 ? 's' : ''}</span>
        <span>{cableCount} cable{cableCount !== 1 ? 's' : ''}</span>
        <span>{Math.round(zoom * 100)}%</span>
        <button
          onClick={onToggleSnap}
          className="transition-colors"
          style={{ color: snapToGrid ? '#3b82f6' : undefined }}
          title="Toggle snap-to-grid"
        >
          {snapToGrid ? 'Grid: On' : 'Grid: Off'}
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onSave}
                className="px-2 py-0.5 text-neutral-500 hover:text-neutral-700 transition-colors"
                title="Save patch (Cmd+S)">
          Save
        </button>
        <button onClick={onLoad}
                className="px-2 py-0.5 text-neutral-500 hover:text-neutral-700 transition-colors"
                title="Load saved patch">
          Load
        </button>
        <span className="text-neutral-200">|</span>
        <button onClick={onExportPNG}
                className="px-2 py-0.5 text-neutral-500 hover:text-neutral-700 transition-colors">
          PNG
        </button>
        <button onClick={onExportPDF}
                className="px-2 py-0.5 text-neutral-500 hover:text-neutral-700 transition-colors">
          PDF
        </button>
        <button onClick={onExportJSON}
                className="px-2 py-0.5 text-neutral-500 hover:text-neutral-700 transition-colors">
          JSON
        </button>
        <button onClick={() => fileRef.current?.click()}
                className="px-2 py-0.5 text-neutral-500 hover:text-neutral-700 transition-colors">
          Import
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden"
               onChange={e => {
                 const f = e.target.files?.[0];
                 if (f) onImportJSON(f);
                 e.target.value = '';
               }} />
        <span className="text-neutral-200">|</span>
        <button onClick={onSync}
                className="px-2 py-0.5 text-neutral-500 hover:text-neutral-700 transition-colors"
                title="Google Sheets sync">
          Sync
        </button>
      </div>
    </div>
  );
}
