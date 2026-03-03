import { useRef } from 'react';

interface Props {
  moduleCount: number;
  cableCount: number;
  zoom: number;
  onExportPNG: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
}

export function StatusBar({ moduleCount, cableCount, zoom, onExportPNG, onExportJSON, onImportJSON }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="h-7 flex items-center justify-between px-3 border-t"
         style={{ background: '#16161E', borderColor: '#2a2a3a', fontSize: '11px' }}>
      <div className="flex items-center gap-4 text-neutral-400">
        <span>{moduleCount} module{moduleCount !== 1 ? 's' : ''}</span>
        <span>{cableCount} cable{cableCount !== 1 ? 's' : ''}</span>
        <span>{Math.round(zoom * 100)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onExportPNG}
                className="px-2 py-0.5 text-neutral-400 hover:text-neutral-200 transition-colors">
          Export PNG
        </button>
        <button onClick={onExportJSON}
                className="px-2 py-0.5 text-neutral-400 hover:text-neutral-200 transition-colors">
          Export JSON
        </button>
        <button onClick={() => fileRef.current?.click()}
                className="px-2 py-0.5 text-neutral-400 hover:text-neutral-200 transition-colors">
          Import JSON
        </button>
        <input ref={fileRef} type="file" accept=".json" className="hidden"
               onChange={e => {
                 const f = e.target.files?.[0];
                 if (f) onImportJSON(f);
                 e.target.value = '';
               }} />
      </div>
    </div>
  );
}
