import {
  useState,
  useRef,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import type { PlacedModule, ModuleTemplate, JackDef, JackType } from '../types';
import { EURORACK_HEIGHT_PX, PX_PER_HP } from '../types';

interface Props {
  module: PlacedModule;
  template: ModuleTemplate;
  onDragStart: (e: ReactMouseEvent) => void;
  onRemove: () => void;
  onJackDragStart: (jackId: string, e: ReactMouseEvent) => void;
  onJackDrop: (jackId: string) => void;
  isDraggingCable: boolean;
}

const JACK_TYPE_COLORS: Record<JackType, string> = {
  'audio-out': '#3b82f6',
  'cv-in': '#f97316',
};

export function ModulePanel({
  module, template,
  onDragStart, onRemove,
  onJackDragStart, onJackDrop, isDraggingCable,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const width = template.imageAspect
    ? EURORACK_HEIGHT_PX * template.imageAspect
    : template.hp * PX_PER_HP;
  const height = EURORACK_HEIGHT_PX;

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
          border: `1px solid ${hovered ? '#bbb' : '#ccc'}`,
          cursor: 'grab',
        }}
        onMouseDown={onDragStart}
      >
        {template.imageDataUrl ? (
          <img
            src={template.imageDataUrl}
            alt={template.name}
            className="w-full h-full object-contain pointer-events-none"
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
        {module.jacks.map(jack => {
          const color = JACK_TYPE_COLORS[jack.type];
          return (
            <div
              key={jack.id}
              className="absolute group flex items-center justify-center"
              style={{
                left: `${jack.x * 100}%`,
                top: `${jack.y * 100}%`,
                transform: 'translate(-50%, -50%)',
                width: 28,
                height: 28,
                zIndex: 10,
                cursor: 'pointer',
              }}
              onMouseDown={e => { e.stopPropagation(); onJackDragStart(jack.id, e); }}
              onMouseUp={() => {
                if (isDraggingCable) {
                  onJackDrop(jack.id);
                }
              }}
            >
              {/* Outer glow */}
              <div
                className="absolute rounded-full transition-transform duration-150 group-hover:scale-[1.4]"
                style={{
                  width: 20,
                  height: 20,
                  background: `${color}40`,
                  border: `2px solid ${color}`,
                  boxShadow: `0 0 6px ${color}80, 0 0 12px ${color}40`,
                }}
              />
              {/* White contrast ring */}
              <div
                className="absolute rounded-full"
                style={{
                  width: 10,
                  height: 10,
                  background: 'rgba(255,255,255,0.85)',
                  border: `2px solid ${color}`,
                }}
              />
              {/* Center dot */}
              <div
                className="rounded-full relative"
                style={{
                  width: 5,
                  height: 5,
                  background: color,
                }}
              />
              {/* Jack label */}
              {jack.label && (
                <div
                  className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap pointer-events-none"
                  style={{
                    top: -13,
                    fontSize: 7,
                    color: '#666',
                    textShadow: '0 0 3px rgba(255,255,255,0.9), 0 0 6px rgba(255,255,255,0.6)',
                    fontWeight: 500,
                  }}
                >
                  {jack.label}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Hover controls */}
      {hovered && (
        <button
          className="absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs rounded-full transition-colors"
          style={{ background: '#fff', color: '#999', border: '1px solid #ccc' }}
          onClick={e => { e.stopPropagation(); onRemove(); }}
          onMouseDown={e => e.stopPropagation()}
          title="Remove module"
        >
          &times;
        </button>
      )}

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
