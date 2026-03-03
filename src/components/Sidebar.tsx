import { useState, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import type { ModuleTemplate } from '../types';

interface Props {
  open: boolean;
  onToggle: () => void;
  templates: ModuleTemplate[];
  onAddTemplate: (t: ModuleTemplate) => void;
  onPlaceModule: (templateId: string) => void;
}

export function Sidebar({ open, onToggle, templates, onAddTemplate, onPlaceModule }: Props) {
  const [showUpload, setShowUpload] = useState(false);

  return (
    <>
      {/* Toggle button when collapsed */}
      {!open && (
        <button
          onClick={onToggle}
          className="absolute top-2 left-2 z-30 w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-neutral-200 transition-colors"
          style={{ background: '#1e1e2e', border: '1px solid #2a2a3a' }}
        >
          &rsaquo;
        </button>
      )}
      <div
        className="flex flex-col h-full overflow-hidden transition-all duration-200 shrink-0"
        style={{
          width: open ? 220 : 0,
          background: '#16161E',
          borderRight: open ? '1px solid #2a2a3a' : 'none',
        }}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#2a2a3a' }}>
          <span className="text-xs font-medium text-neutral-300 uppercase tracking-wider">Modules</span>
          <button onClick={onToggle} className="text-neutral-500 hover:text-neutral-300 text-sm">&lsaquo;</button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {templates.map(t => (
            <button
              key={t.id}
              onClick={() => onPlaceModule(t.id)}
              className="w-full text-left px-3 py-1.5 hover:bg-white/5 transition-colors flex items-center gap-2 group"
            >
              <div
                className="w-5 h-8 shrink-0 flex items-center justify-center text-[8px] text-neutral-500"
                style={{
                  background: t.imageDataUrl ? undefined : '#1a1a2a',
                  border: '1px solid #2a2a3a',
                }}
              >
                {t.imageDataUrl ? (
                  <img src={t.imageDataUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{t.hp}</span>
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-neutral-300 truncate">{t.name}</div>
                <div className="text-[10px] text-neutral-500 truncate">{t.brand} &middot; {t.hp}HP</div>
              </div>
            </button>
          ))}
        </div>

        <div className="px-2 py-2 border-t" style={{ borderColor: '#2a2a3a' }}>
          <button
            onClick={() => setShowUpload(true)}
            className="w-full py-1.5 text-xs text-neutral-400 hover:text-neutral-200 transition-colors"
            style={{ background: '#1e1e2e', border: '1px solid #2a2a3a' }}
          >
            + Upload Module
          </button>
        </div>
      </div>

      {showUpload && (
        <UploadDialog
          onClose={() => setShowUpload(false)}
          onAdd={onAddTemplate}
        />
      )}
    </>
  );
}

function UploadDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (t: ModuleTemplate) => void }) {
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [hp, setHp] = useState(12);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => setImageDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      id: uuid(),
      name: name.trim(),
      brand: brand.trim(),
      hp,
      imageDataUrl,
      jacks: [],
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="p-4 w-72 flex flex-col gap-3"
        style={{ background: '#1e1e2e', border: '1px solid #2a2a3a' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-xs font-medium text-neutral-300 uppercase tracking-wider">Upload Module</div>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Module name"
          className="px-2 py-1.5 text-xs bg-transparent text-neutral-200 outline-none"
          style={{ border: '1px solid #2a2a3a' }}
          autoFocus
        />
        <input
          value={brand}
          onChange={e => setBrand(e.target.value)}
          placeholder="Brand"
          className="px-2 py-1.5 text-xs bg-transparent text-neutral-200 outline-none"
          style={{ border: '1px solid #2a2a3a' }}
        />
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-neutral-500 shrink-0">HP Width</label>
          <input
            type="number"
            value={hp}
            onChange={e => setHp(Number(e.target.value))}
            min={2}
            max={84}
            className="px-2 py-1.5 text-xs bg-transparent text-neutral-200 outline-none w-16"
            style={{ border: '1px solid #2a2a3a' }}
          />
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="py-2 text-xs text-neutral-400 hover:text-neutral-200 transition-colors text-center"
          style={{ border: '1px dashed #2a2a3a' }}
        >
          {imageDataUrl ? 'Image loaded' : 'Click to select image'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
               onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

        {imageDataUrl && (
          <div className="flex justify-center">
            <img src={imageDataUrl} alt="preview" className="max-h-24 object-contain" style={{ border: '1px solid #2a2a3a' }} />
          </div>
        )}

        <div className="flex gap-2 mt-1">
          <button onClick={onClose}
                  className="flex-1 py-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                  style={{ border: '1px solid #2a2a3a' }}>
            Cancel
          </button>
          <button onClick={handleSubmit}
                  className="flex-1 py-1.5 text-xs text-neutral-200 transition-colors"
                  style={{ background: '#2a2a4a', border: '1px solid #3a3a5a' }}>
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
