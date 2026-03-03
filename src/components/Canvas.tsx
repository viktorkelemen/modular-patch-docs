import {
  forwardRef,
  useRef,
  useState,
  useCallback,
  useEffect,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import type { PlacedModule, Cable, ModuleTemplate, JackDef } from '../types';
import { EURORACK_HEIGHT_PX, PX_PER_HP } from '../types';
import { ModulePanel } from './ModulePanel';
import { PatchCables } from './PatchCables';

interface Props {
  modules: PlacedModule[];
  cables: Cable[];
  templates: ModuleTemplate[];
  zoom: number;
  onZoomChange: (z: number) => void;
  onMoveModule: (id: string, x: number, y: number) => void;
  onRemoveModule: (id: string) => void;
  onUpdateJacks: (moduleId: string, jacks: JackDef[]) => void;
  onUpdateTemplateJacks: (templateId: string, jacks: JackDef[]) => void;
  onAddCable: (fromModuleId: string, fromJackId: string, toModuleId: string, toJackId: string) => void;
  onRemoveCable: (cableId: string) => void;
  highlightedCableId: string | null;
}

export const Canvas = forwardRef<HTMLDivElement, Props>(function Canvas(
  {
    modules, cables, templates, zoom, onZoomChange,
    onMoveModule, onRemoveModule, onUpdateJacks, onUpdateTemplateJacks,
    onAddCable, onRemoveCable, highlightedCableId,
  },
  ref,
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });

  // Dragging cable state
  const [draggingCable, setDraggingCable] = useState<{
    fromModuleId: string;
    fromJackId: string;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);

  // Module being dragged
  const [draggingModule, setDraggingModule] = useState<{
    moduleId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  // Editing jacks
  const [editingModuleId, setEditingModuleId] = useState<string | null>(null);

  const screenToCanvas = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: (clientX - rect.left - pan.x) / zoom,
      y: (clientY - rect.top - pan.y) / zoom,
    };
  }, [pan, zoom]);

  // Pan: middle-click or alt+click
  const handleMouseDown = useCallback((e: ReactMouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsPanning(true);
      panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    }
  }, [pan]);

  useEffect(() => {
    const handleMove = (e: globalThis.MouseEvent) => {
      if (isPanning) {
        setPan({
          x: panStart.current.panX + (e.clientX - panStart.current.x),
          y: panStart.current.panY + (e.clientY - panStart.current.y),
        });
      }
      if (draggingModule) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        onMoveModule(draggingModule.moduleId, pos.x - draggingModule.offsetX, pos.y - draggingModule.offsetY);
      }
      if (draggingCable) {
        const pos = screenToCanvas(e.clientX, e.clientY);
        setDraggingCable(prev => prev ? { ...prev, currentX: pos.x, currentY: pos.y } : null);
      }
    };
    const handleUp = () => {
      setIsPanning(false);
      setDraggingModule(null);
      if (draggingCable) {
        setDraggingCable(null);
      }
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isPanning, draggingModule, draggingCable, screenToCanvas, onMoveModule]);

  // Zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.min(3, Math.max(0.15, zoom * delta));

    // Zoom towards cursor
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      setPan(prev => ({
        x: cx - (cx - prev.x) * (newZoom / zoom),
        y: cy - (cy - prev.y) * (newZoom / zoom),
      }));
    }
    onZoomChange(newZoom);
  }, [zoom, onZoomChange]);

  const handleModuleDragStart = useCallback((moduleId: string, e: ReactMouseEvent) => {
    if (editingModuleId) return;
    const pos = screenToCanvas(e.clientX, e.clientY);
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    setDraggingModule({
      moduleId,
      offsetX: pos.x - mod.x,
      offsetY: pos.y - mod.y,
    });
  }, [editingModuleId, modules, screenToCanvas]);

  const getJackWorldPos = useCallback((moduleId: string, jackId: string) => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return { x: 0, y: 0 };
    const jack = mod.jacks.find(j => j.id === jackId);
    if (!jack) return { x: 0, y: 0 };
    const template = templates.find(t => t.id === mod.templateId);
    if (!template) return { x: 0, y: 0 };

    const moduleWidth = template.imageAspect
      ? EURORACK_HEIGHT_PX * template.imageAspect
      : template.hp * PX_PER_HP;
    const moduleHeight = EURORACK_HEIGHT_PX;

    return {
      x: mod.x + jack.x * moduleWidth,
      y: mod.y + jack.y * moduleHeight,
    };
  }, [modules, templates]);

  const handleJackDragStart = useCallback((moduleId: string, jackId: string, e: ReactMouseEvent) => {
    e.stopPropagation();
    const pos = getJackWorldPos(moduleId, jackId);
    setDraggingCable({
      fromModuleId: moduleId,
      fromJackId: jackId,
      startX: pos.x,
      startY: pos.y,
      currentX: pos.x,
      currentY: pos.y,
    });
  }, [getJackWorldPos]);

  const handleJackDrop = useCallback((moduleId: string, jackId: string) => {
    if (draggingCable && (draggingCable.fromModuleId !== moduleId || draggingCable.fromJackId !== jackId)) {
      onAddCable(draggingCable.fromModuleId, draggingCable.fromJackId, moduleId, jackId);
    }
    setDraggingCable(null);
  }, [draggingCable, onAddCable]);

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden select-none"
      style={{
        background: '#f0f0ec',
        cursor: isPanning ? 'grabbing' : draggingCable ? 'crosshair' : 'default',
      }}
      onMouseDown={handleMouseDown}
      onWheel={handleWheel}
      onContextMenu={e => e.preventDefault()}
    >
      {/* Dot grid */}
      <DotGrid pan={pan} zoom={zoom} />

      {/* Transformed canvas layer */}
      <div
        ref={ref}
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      >
        {/* SVG cable layer */}
        <PatchCables
          cables={cables}
          modules={modules}
          templates={templates}
          getJackWorldPos={getJackWorldPos}
          highlightedCableId={highlightedCableId}
          onRemoveCable={onRemoveCable}
          draggingCable={draggingCable}
        />

        {/* Module DOM layer */}
        {modules.map(mod => {
          const template = templates.find(t => t.id === mod.templateId);
          if (!template) return null;
          return (
            <ModulePanel
              key={mod.id}
              module={mod}
              template={template}
              isEditing={editingModuleId === mod.id}
              onStartEditing={() => setEditingModuleId(mod.id)}
              onStopEditing={() => setEditingModuleId(null)}
              onDragStart={e => handleModuleDragStart(mod.id, e)}
              onRemove={() => onRemoveModule(mod.id)}
              onUpdateJacks={jacks => onUpdateJacks(mod.id, jacks)}
              onUpdateTemplateJacks={jacks => onUpdateTemplateJacks(template.id, jacks)}
              onJackDragStart={(jackId, e) => handleJackDragStart(mod.id, jackId, e)}
              onJackDrop={jackId => handleJackDrop(mod.id, jackId)}
              isDraggingCable={!!draggingCable}
            />
          );
        })}
      </div>
    </div>
  );
});

function DotGrid({ pan, zoom }: { pan: { x: number; y: number }; zoom: number }) {
  const spacing = 30;
  const dotSize = 1;
  const offsetX = ((pan.x % (spacing * zoom)) + spacing * zoom) % (spacing * zoom);
  const offsetY = ((pan.y % (spacing * zoom)) + spacing * zoom) % (spacing * zoom);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
      <defs>
        <pattern
          id="dotGrid"
          x={offsetX}
          y={offsetY}
          width={spacing * zoom}
          height={spacing * zoom}
          patternUnits="userSpaceOnUse"
        >
          <circle cx={dotSize} cy={dotSize} r={dotSize} fill="#c0c0b8" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#dotGrid)" />
    </svg>
  );
}
