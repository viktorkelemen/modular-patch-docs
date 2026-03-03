import {
  useState,
  useRef,
  useCallback,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { v4 as uuid } from 'uuid';
import type { PlacedModule, ModuleTemplate, JackDef, JackType } from '../types';
import { EURORACK_HEIGHT_PX, PX_PER_HP } from '../types';

interface Props {
  module: PlacedModule;
  template: ModuleTemplate;
  isEditing: boolean;
  onStartEditing: () => void;
  onStopEditing: () => void;
  onDragStart: (e: ReactMouseEvent) => void;
  onRemove: () => void;
  onUpdateJacks: (jacks: JackDef[]) => void;
  onUpdateTemplateJacks: (jacks: JackDef[]) => void;
  onJackDragStart: (jackId: string, e: ReactMouseEvent) => void;
  onJackDrop: (jackId: string) => void;
  isDraggingCable: boolean;
}

const JACK_TYPE_COLORS: Record<JackType, string> = {
  'audio-in': '#3b82f6',
  'audio-out': '#60a5fa',
  'cv-in': '#f97316',
  'cv-out': '#fbbf24',
};

export function ModulePanel({
  module, template, isEditing,
  onStartEditing, onStopEditing, onDragStart, onRemove,
  onUpdateJacks, onUpdateTemplateJacks,
  onJackDragStart, onJackDrop, isDraggingCable,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [editingJack, setEditingJack] = useState<string | null>(null);
  const [draggingJackId, setDraggingJackId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const width = template.hp * PX_PER_HP;
  const height = EURORACK_HEIGHT_PX;

  const handleImageClick = useCallback((e: ReactMouseEvent) => {
    if (!isEditing) return;
    const rect = panelRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Check if we clicked on an existing jack
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const clickedJack = module.jacks.find(j => {
      const dx = j.x - clickX;
      const dy = j.y - clickY;
      return Math.sqrt(dx * dx + dy * dy) < 0.03;
    });

    if (clickedJack) {
      setEditingJack(clickedJack.id);
      return;
    }

    // Add new jack
    const newJack: JackDef = {
      id: uuid(),
      label: '',
      type: 'cv-in',
      x: clickX,
      y: clickY,
    };
    const newJacks = [...module.jacks, newJack];
    onUpdateJacks(newJacks);
    onUpdateTemplateJacks(newJacks);
    setEditingJack(newJack.id);
  }, [isEditing, module.jacks, onUpdateJacks, onUpdateTemplateJacks]);

  const updateJack = useCallback((jackId: string, updates: Partial<JackDef>) => {
    const newJacks = module.jacks.map(j => j.id === jackId ? { ...j, ...updates } : j);
    onUpdateJacks(newJacks);
    onUpdateTemplateJacks(newJacks);
  }, [module.jacks, onUpdateJacks, onUpdateTemplateJacks]);

  const removeJack = useCallback((jackId: string) => {
    const newJacks = module.jacks.filter(j => j.id !== jackId);
    onUpdateJacks(newJacks);
    onUpdateTemplateJacks(newJacks);
    setEditingJack(null);
  }, [module.jacks, onUpdateJacks, onUpdateTemplateJacks]);

  const handleJackDragStart = useCallback((jackId: string, e: ReactMouseEvent) => {
    if (isEditing) {
      // In edit mode, drag to reposition
      e.stopPropagation();
      setDraggingJackId(jackId);
      const handleMove = (ev: globalThis.MouseEvent) => {
        const rect = panelRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
        const y = Math.max(0, Math.min(1, (ev.clientY - rect.top) / rect.height));
        updateJack(jackId, { x, y });
      };
      const handleUp = () => {
        setDraggingJackId(null);
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    } else {
      // Normal mode: start cable drawing
      onJackDragStart(jackId, e);
    }
  }, [isEditing, onJackDragStart, updateJack]);

  return (
    <div
      style={{
        position: 'absolute',
        left: module.x,
        top: module.y,
        width,
        height,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Module surface */}
      <div
        ref={panelRef}
        className="relative w-full h-full"
        style={{
          background: template.imageDataUrl ? undefined : '#f5f5f0',
          border: `1px solid ${isEditing ? '#6a9aca' : hovered ? '#bbb' : '#ccc'}`,
          cursor: isEditing ? 'crosshair' : 'grab',
          boxShadow: isEditing ? '0 0 8px rgba(106,154,202,0.3)' : undefined,
        }}
        onMouseDown={isEditing ? undefined : onDragStart}
        onClick={handleImageClick}
      >
        {template.imageDataUrl ? (
          <img
            src={template.imageDataUrl}
            alt={template.name}
            className="w-full h-full object-cover pointer-events-none"
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1">
            <span className="text-xs text-neutral-600">{template.name}</span>
            <span className="text-[9px] text-neutral-400">{template.brand}</span>
            <span className="text-[9px] text-neutral-400">{template.hp}HP</span>
          </div>
        )}

        {/* Jack markers */}
        {module.jacks.map(jack => (
          <div
            key={jack.id}
            className="absolute group flex items-center justify-center"
            style={{
              left: `${jack.x * 100}%`,
              top: `${jack.y * 100}%`,
              transform: 'translate(-50%, -50%)',
              width: 28,
              height: 28,
              zIndex: draggingJackId === jack.id ? 20 : 10,
              cursor: isEditing ? 'move' : 'crosshair',
            }}
            onMouseDown={e => { e.stopPropagation(); handleJackDragStart(jack.id, e); }}
            onMouseUp={() => {
              if (isDraggingCable && !isEditing) {
                onJackDrop(jack.id);
              }
            }}
          >
            {/* Jack ring */}
            <div
              className="rounded-full flex items-center justify-center"
              style={{
                width: 14,
                height: 14,
                background: '#111',
                border: `2px solid #888`,
                boxShadow: `0 0 4px ${JACK_TYPE_COLORS[jack.type]}40, inset 0 1px 2px rgba(0,0,0,0.5)`,
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: 4,
                  height: 4,
                  background: JACK_TYPE_COLORS[jack.type],
                  boxShadow: `0 0 3px ${JACK_TYPE_COLORS[jack.type]}`,
                }}
              />
            </div>
            {/* Jack label */}
            {jack.label && !isEditing && (
              <div
                className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
                style={{
                  top: -14,
                  fontSize: 8,
                  color: '#888',
                  textShadow: '0 1px 2px rgba(255,255,255,0.8)',
                }}
              >
                {jack.label}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hover controls */}
      {hovered && !isEditing && (
        <>
          <button
            className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs rounded-full transition-colors"
            style={{ background: '#fff', color: '#999', border: '1px solid #ccc' }}
            onClick={e => { e.stopPropagation(); onRemove(); }}
            onMouseDown={e => e.stopPropagation()}
            title="Remove module"
          >
            &times;
          </button>
          <button
            className="absolute -top-2 -right-9 h-5 px-1.5 flex items-center justify-center text-[9px] transition-colors"
            style={{ background: '#fff', color: '#999', border: '1px solid #ccc' }}
            onClick={e => { e.stopPropagation(); onStartEditing(); }}
            onMouseDown={e => e.stopPropagation()}
            title="Edit jacks"
          >
            jacks
          </button>
        </>
      )}

      {/* Edit mode bar */}
      {isEditing && (
        <div
          className="absolute -top-7 left-0 right-0 flex items-center justify-between px-2 h-6"
          style={{ background: '#e8f0f8', border: '1px solid #a0b8d0', fontSize: 10 }}
        >
          <span className="text-blue-600">Click to place jacks</span>
          <button
            className="text-blue-500 hover:text-blue-800 transition-colors"
            onClick={e => { e.stopPropagation(); onStopEditing(); setEditingJack(null); }}
          >
            Done
          </button>
        </div>
      )}

      {/* Jack editor popover */}
      {isEditing && editingJack && (() => {
        const jack = module.jacks.find(j => j.id === editingJack);
        if (!jack) return null;
        return (
          <JackEditor
            jack={jack}
            panelWidth={width}
            onUpdate={updates => updateJack(editingJack, updates)}
            onRemove={() => removeJack(editingJack)}
            onClose={() => setEditingJack(null)}
          />
        );
      })()}

      {/* Module name label */}
      <div
        className="absolute left-0 right-0 text-center pointer-events-none"
        style={{
          bottom: -16,
          fontSize: 9,
          color: '#666',
        }}
      >
        {template.name}
      </div>
    </div>
  );
}

function JackEditor({
  jack, panelWidth, onUpdate, onRemove, onClose,
}: {
  jack: JackDef;
  panelWidth: number;
  onUpdate: (u: Partial<JackDef>) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  const left = jack.x * panelWidth;
  const popoverLeft = left > panelWidth / 2 ? left - 160 : left + 20;

  return (
    <div
      className="absolute z-30 p-2 flex flex-col gap-1.5"
      style={{
        left: popoverLeft,
        top: jack.y * EURORACK_HEIGHT_PX - 20,
        width: 150,
        background: '#fff',
        border: '1px solid #ccc',
        fontSize: 10,
      }}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
    >
      <input
        className="px-1.5 py-1 bg-transparent text-neutral-700 outline-none"
        style={{ border: '1px solid #ddd' }}
        value={jack.label}
        onChange={e => onUpdate({ label: e.target.value })}
        placeholder="Jack label"
        autoFocus
      />
      <select
        className="px-1.5 py-1 bg-transparent text-neutral-700 outline-none"
        style={{ border: '1px solid #ddd', background: '#fafafa' }}
        value={jack.type}
        onChange={e => onUpdate({ type: e.target.value as JackType })}
      >
        <option value="audio-in">Audio In</option>
        <option value="audio-out">Audio Out</option>
        <option value="cv-in">CV In</option>
        <option value="cv-out">CV Out</option>
      </select>
      <div className="flex gap-1">
        <button
          className="flex-1 py-0.5 text-red-400 hover:text-red-300 transition-colors"
          style={{ border: '1px solid #e0c0c0' }}
          onClick={onRemove}
        >
          Delete
        </button>
        <button
          className="flex-1 py-0.5 text-neutral-500 hover:text-neutral-700 transition-colors"
          style={{ border: '1px solid #ddd' }}
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}
