import { useState, useRef, useCallback } from 'react';
import { v4 as uuid } from 'uuid';
import type { ModuleTemplate, JackDef, JackType } from '../types';
import { DEFAULT_TEMPLATES } from '../types';

interface Props {
  open: boolean;
  onToggle: () => void;
  templates: ModuleTemplate[];
  onAddTemplate: (t: ModuleTemplate) => void;
  onPlaceModule: (templateId: string) => void;
}

export function Sidebar({ open, onToggle, templates, onAddTemplate, onPlaceModule }: Props) {
  const [showUpload, setShowUpload] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ModuleTemplate | null>(null);

  return (
    <>
      {!open && (
        <button
          onClick={onToggle}
          className="absolute top-2 left-2 z-30 w-7 h-7 flex items-center justify-center text-neutral-500 hover:text-neutral-700 transition-colors"
          style={{ background: '#fff', border: '1px solid #ddd' }}
        >
          &rsaquo;
        </button>
      )}
      <div
        className="flex flex-col h-full overflow-hidden transition-all duration-200 shrink-0"
        style={{
          width: open ? 260 : 0,
          background: '#fafaf8',
          borderRight: open ? '1px solid #ddd' : 'none',
        }}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b" style={{ borderColor: '#ddd' }}>
          <span className="text-base font-medium text-neutral-600 uppercase tracking-wider">Modules</span>
          <button onClick={onToggle} className="text-neutral-400 hover:text-neutral-600 text-sm">&lsaquo;</button>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {templates.map(t => (
            <div
              key={t.id}
              className="w-full text-left px-3 py-2 hover:bg-black/5 transition-colors flex items-center gap-3 group"
            >
              <div
                className="w-5 h-8 shrink-0 flex items-center justify-center text-[8px] text-neutral-400 cursor-pointer"
                style={{
                  background: t.imageDataUrl ? undefined : '#f0f0ec',
                  border: '1px solid #ddd',
                }}
                onClick={() => onPlaceModule(t.id)}
              >
                {t.imageDataUrl ? (
                  <img src={t.imageDataUrl} alt="" className="w-full h-full object-contain" />
                ) : (
                  <span>{t.hp}</span>
                )}
              </div>
              <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onPlaceModule(t.id)}>
                <div className="text-base text-neutral-700 truncate">{t.name}</div>
                <div className="text-sm text-neutral-400 truncate">{t.brand} &middot; {t.hp}HP</div>
              </div>
              {t.imageDataUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // If template has no jacks, fall back to defaults
                    if (t.jacks.length === 0) {
                      const def = DEFAULT_TEMPLATES.find(d => d.id === t.id);
                      if (def && def.jacks.length > 0) {
                        setEditingTemplate({ ...t, jacks: def.jacks });
                        return;
                      }
                    }
                    setEditingTemplate(t);
                  }}
                  className="shrink-0 px-1 py-0.5 text-[10px] rounded transition-colors"
                  style={{ color: '#aaa', border: '1px solid transparent' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#ccc'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.borderColor = 'transparent'; }}
                  title="Edit jacks"
                >
                  edit
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="px-2 py-2 border-t" style={{ borderColor: '#ddd' }}>
          <button
            onClick={() => setShowUpload(true)}
            className="w-full py-2 text-base text-neutral-500 hover:text-neutral-700 transition-colors"
            style={{ background: '#f0f0ec', border: '1px solid #ddd' }}
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

      {editingTemplate && (
        <JackEditor
          imageDataUrl={editingTemplate.imageDataUrl!}
          jacks={editingTemplate.jacks}
          onJacksChange={(jacks) => setEditingTemplate({ ...editingTemplate, jacks })}
          onBack={() => setEditingTemplate(null)}
          onDone={() => {
            onAddTemplate({ ...editingTemplate });
            setEditingTemplate(null);
          }}
          moduleName={editingTemplate.name}
          backLabel="Cancel"
          doneLabel={`Save (${editingTemplate.jacks.length} jacks)`}
        />
      )}
    </>
  );
}

const JACK_TYPES: { value: JackType; label: string; color: string }[] = [
  { value: 'audio-out',    label: 'Audio Out',    color: '#3b82f6' },
  { value: 'cv-in',        label: 'CV In',        color: '#f97316' },
  { value: 'gate-out',     label: 'Gate Out',     color: '#22c55e' },
  { value: 'gate-in',      label: 'Gate In',      color: '#a855f7' },
  { value: 'trigger-out',  label: 'Trigger Out',  color: '#ef4444' },
  { value: 'trigger-in',   label: 'Trigger In',   color: '#ec4899' },
];

function UploadDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (t: ModuleTemplate) => void }) {
  const [step, setStep] = useState<'info' | 'jacks'>('info');
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [hp, setHp] = useState(12);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageAspect, setImageAspect] = useState<number | undefined>(undefined);
  const [jacks, setJacks] = useState<JackDef[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageDataUrl(dataUrl);
      // Compute aspect ratio from loaded image
      const img = new Image();
      img.onload = () => setImageAspect(img.width / img.height);
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleNext = () => {
    if (!name.trim()) return;
    if (imageDataUrl) {
      setStep('jacks');
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onAdd({
      id: uuid(),
      name: name.trim(),
      brand: brand.trim(),
      hp,
      imageDataUrl,
      imageAspect,
      jacks,
    });
    onClose();
  };

  if (step === 'jacks') {
    return (
      <JackEditor
        imageDataUrl={imageDataUrl!}
        jacks={jacks}
        onJacksChange={setJacks}
        onBack={() => setStep('info')}
        onDone={handleSubmit}
        moduleName={name}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="p-4 w-72 flex flex-col gap-3 rounded shadow-lg"
        style={{ background: '#fff', border: '1px solid #ddd' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-xs font-medium text-neutral-600 uppercase tracking-wider">Upload Module</div>

        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Module name"
          className="px-2 py-1.5 text-xs bg-transparent text-neutral-800 outline-none"
          style={{ border: '1px solid #ddd' }}
          autoFocus
        />
        <input
          value={brand}
          onChange={e => setBrand(e.target.value)}
          placeholder="Brand"
          className="px-2 py-1.5 text-xs bg-transparent text-neutral-800 outline-none"
          style={{ border: '1px solid #ddd' }}
        />
        <div className="flex items-center gap-2">
          <label className="text-[10px] text-neutral-500 shrink-0">HP Width</label>
          <input
            type="number"
            value={hp}
            onChange={e => setHp(Number(e.target.value))}
            min={2}
            max={84}
            className="px-2 py-1.5 text-xs bg-transparent text-neutral-800 outline-none w-16"
            style={{ border: '1px solid #ddd' }}
          />
        </div>

        <button
          onClick={() => fileRef.current?.click()}
          className="py-2 text-xs text-neutral-500 hover:text-neutral-700 transition-colors text-center"
          style={{ border: '1px dashed #ccc' }}
        >
          {imageDataUrl ? 'Image loaded' : 'Click to select image'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden"
               onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />

        {imageDataUrl && (
          <div className="flex justify-center">
            <img src={imageDataUrl} alt="preview" className="max-h-24 object-contain" style={{ border: '1px solid #ddd' }} />
          </div>
        )}

        <div className="flex gap-2 mt-1">
          <button onClick={onClose}
                  className="flex-1 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                  style={{ border: '1px solid #ddd' }}>
            Cancel
          </button>
          <button onClick={handleNext}
                  className="flex-1 py-1.5 text-xs text-white transition-colors"
                  style={{ background: '#555', border: '1px solid #444' }}>
            {imageDataUrl ? 'Next: Place Jacks' : 'Add'}
          </button>
        </div>
      </div>
    </div>
  );
}

function JackEditor({
  imageDataUrl, jacks, onJacksChange, onBack, onDone, moduleName,
  backLabel = 'Back', doneLabel,
}: {
  imageDataUrl: string;
  jacks: JackDef[];
  onJacksChange: (jacks: JackDef[]) => void;
  onBack: () => void;
  onDone: () => void;
  moduleName: string;
  backLabel?: string;
  doneLabel?: string;
}) {
  const imgRef = useRef<HTMLDivElement>(null);
  const [selectedJackId, setSelectedJackId] = useState<string | null>(null);
  const [placingType, setPlacingType] = useState<JackType>('audio-out');
  const draggingRef = useRef<string | null>(null);

  const handleImageClick = useCallback((e: React.MouseEvent) => {
    // Don't place a new jack if we just finished dragging
    if (draggingRef.current) return;
    const rect = imgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || x > 1 || y < 0 || y > 1) return;

    const jack: JackDef = {
      id: uuid(),
      label: '',
      type: placingType,
      x: Math.round(x * 1000) / 1000,
      y: Math.round(y * 1000) / 1000,
    };
    onJacksChange([...jacks, jack]);
    setSelectedJackId(jack.id);
  }, [jacks, onJacksChange, placingType]);

  const handleJackDragStart = useCallback((jackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedJackId(jackId);
    const didMove = { current: false };

    const onMove = (me: MouseEvent) => {
      const rect = imgRef.current?.getBoundingClientRect();
      if (!rect) return;
      didMove.current = true;
      const x = Math.max(0, Math.min(1, (me.clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (me.clientY - rect.top) / rect.height));
      onJacksChange(jacks.map(j => j.id === jackId ? {
        ...j,
        x: Math.round(x * 1000) / 1000,
        y: Math.round(y * 1000) / 1000,
      } : j));
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (didMove.current) {
        // Prevent the click handler from firing after drag
        draggingRef.current = jackId;
        requestAnimationFrame(() => { draggingRef.current = null; });
      }
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [jacks, onJacksChange]);

  const updateJack = useCallback((id: string, updates: Partial<JackDef>) => {
    onJacksChange(jacks.map(j => j.id === id ? { ...j, ...updates } : j));
  }, [jacks, onJacksChange]);

  const removeJack = useCallback((id: string) => {
    onJacksChange(jacks.filter(j => j.id !== id));
    if (selectedJackId === id) setSelectedJackId(null);
  }, [jacks, onJacksChange, selectedJackId]);

  const selectedJack = jacks.find(j => j.id === selectedJackId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onDone}>
      <div
        className="p-4 flex flex-col gap-3 rounded shadow-lg"
        style={{ background: '#fff', border: '1px solid #ddd', width: 480, maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="text-xs font-medium text-neutral-600 uppercase tracking-wider">
          Place Jacks — {moduleName}
        </div>
        <div className="text-[10px] text-neutral-400">
          Click to place jacks. Drag to reposition. Click a jack to select &amp; edit.
        </div>

        {/* Type selector */}
        <div className="flex gap-1 flex-wrap">
          {JACK_TYPES.map(jt => (
            <button
              key={jt.value}
              onClick={() => setPlacingType(jt.value)}
              className="px-2 py-1 text-[10px] rounded transition-colors"
              style={{
                background: placingType === jt.value ? jt.color : '#f5f5f0',
                color: placingType === jt.value ? '#fff' : '#666',
                border: `1px solid ${placingType === jt.value ? jt.color : '#ddd'}`,
              }}
            >
              {jt.label}
            </button>
          ))}
        </div>

        {/* Image with jack overlay */}
        <div
          ref={imgRef}
          className="relative cursor-crosshair select-none mx-auto"
          style={{ maxHeight: 360 }}
          onClick={handleImageClick}
        >
          <img
            src={imageDataUrl}
            alt="Module panel"
            className="h-full object-contain pointer-events-none"
            style={{ maxHeight: 360 }}
            draggable={false}
          />
          {/* Jack markers */}
          {jacks.map(jack => {
            const typeInfo = JACK_TYPES.find(jt => jt.value === jack.type);
            const isSelected = jack.id === selectedJackId;
            return (
              <div
                key={jack.id}
                className="absolute flex items-center justify-center"
                style={{
                  left: `${jack.x * 100}%`,
                  top: `${jack.y * 100}%`,
                  transform: 'translate(-50%, -50%)',
                  width: 20,
                  height: 20,
                  zIndex: 10,
                  cursor: 'grab',
                }}
                onMouseDown={e => handleJackDragStart(jack.id, e)}
                onClick={e => {
                  e.stopPropagation();
                  setSelectedJackId(isSelected ? null : jack.id);
                }}
              >
                <div
                  className="absolute rounded-full"
                  style={{
                    width: 16,
                    height: 16,
                    background: `${typeInfo?.color || '#999'}60`,
                    border: `2px solid ${typeInfo?.color || '#999'}`,
                    boxShadow: isSelected ? `0 0 0 2px #fff, 0 0 0 4px ${typeInfo?.color || '#999'}` : undefined,
                  }}
                />
                <div
                  className="rounded-full relative"
                  style={{ width: 4, height: 4, background: typeInfo?.color || '#999' }}
                />
                {jack.label && (
                  <div
                    className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
                    style={{
                      top: -11,
                      fontSize: 7,
                      color: '#333',
                      textShadow: '0 0 3px #fff, 0 0 6px #fff',
                      fontWeight: 600,
                    }}
                  >
                    {jack.label}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected jack editor */}
        {selectedJack && (
          <div className="flex items-center gap-2 p-2 rounded" style={{ background: '#f8f8f6', border: '1px solid #eee' }}>
            <input
              value={selectedJack.label}
              onChange={e => updateJack(selectedJack.id, { label: e.target.value })}
              placeholder="Label (e.g. Out 1)"
              className="flex-1 px-2 py-1 text-xs bg-white text-neutral-800 outline-none"
              style={{ border: '1px solid #ddd' }}
              autoFocus
            />
            <select
              value={selectedJack.type}
              onChange={e => updateJack(selectedJack.id, { type: e.target.value as JackType })}
              className="px-1 py-1 text-[10px] bg-white text-neutral-700 outline-none"
              style={{ border: '1px solid #ddd' }}
            >
              {JACK_TYPES.map(jt => (
                <option key={jt.value} value={jt.value}>{jt.label}</option>
              ))}
            </select>
            <button
              onClick={() => removeJack(selectedJack.id)}
              className="text-xs text-neutral-400 hover:text-red-400 px-1"
              title="Remove jack"
            >
              &times;
            </button>
          </div>
        )}

        {/* Jack count */}
        <div className="text-[10px] text-neutral-400">
          {jacks.length} jack{jacks.length !== 1 ? 's' : ''} placed
        </div>

        <div className="flex gap-2">
          <button onClick={onBack}
                  className="flex-1 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 transition-colors"
                  style={{ border: '1px solid #ddd' }}>
            {backLabel}
          </button>
          <button onClick={onDone}
                  className="flex-1 py-1.5 text-xs text-white transition-colors"
                  style={{ background: '#555', border: '1px solid #444' }}>
            {doneLabel || `Add Module (${jacks.length} jacks)`}
          </button>
        </div>
      </div>
    </div>
  );
}
