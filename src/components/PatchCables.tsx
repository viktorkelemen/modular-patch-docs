import type { Cable } from '../types';

interface Props {
  cables: Cable[];
  getJackWorldPos: (moduleId: string, jackId: string) => { x: number; y: number };
  highlightedCableId: string | null;
  onRemoveCable: (id: string) => void;
  draggingCable: {
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null;
}

function cablePath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  // Sag increases with distance
  const sag = Math.min(dist * 0.4, 120);
  const midX = (x1 + x2) / 2;
  const midY = Math.max(y1, y2) + sag;

  return `M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`;
}

export function PatchCables({
  cables, getJackWorldPos, highlightedCableId, onRemoveCable, draggingCable,
}: Props) {
  return (
    <svg
      className="absolute pointer-events-none"
      style={{
        top: 0,
        left: 0,
        width: 1,
        height: 1,
        overflow: 'visible',
        zIndex: 5,
      }}
    >
      <defs>
        <filter id="cableShadow">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>

      {cables.map(cable => {
        const from = getJackWorldPos(cable.fromModuleId, cable.fromJackId);
        const to = getJackWorldPos(cable.toModuleId, cable.toJackId);
        const path = cablePath(from.x, from.y, to.x, to.y);
        const isHighlighted = highlightedCableId === cable.id;

        return (
          <g key={cable.id}>
            {/* Shadow */}
            <path
              d={path}
              fill="none"
              stroke="rgba(0,0,0,0.3)"
              strokeWidth={4}
              strokeLinecap="round"
              style={{ transform: 'translate(0px, 2px)' }}
            />
            {/* Cable body */}
            <path
              d={path}
              fill="none"
              stroke={cable.color}
              strokeWidth={isHighlighted ? 4 : 3}
              strokeLinecap="round"
              opacity={isHighlighted ? 1 : 0.85}
              className="pointer-events-auto cursor-pointer"
              onDoubleClick={e => { e.stopPropagation(); onRemoveCable(cable.id); }}
              style={{ pointerEvents: 'stroke' }}
            />
            {/* Highlight glow */}
            {isHighlighted && (
              <path
                d={path}
                fill="none"
                stroke={cable.color}
                strokeWidth={8}
                strokeLinecap="round"
                opacity={0.2}
              />
            )}
            {/* Plug at start */}
            <circle cx={from.x} cy={from.y} r={5} fill={cable.color} stroke="#333" strokeWidth={1} />
            {/* Plug at end */}
            <circle cx={to.x} cy={to.y} r={5} fill={cable.color} stroke="#333" strokeWidth={1} />
          </g>
        );
      })}

      {/* Cable being drawn */}
      {draggingCable && (
        <g>
          <path
            d={cablePath(
              draggingCable.startX, draggingCable.startY,
              draggingCable.currentX, draggingCable.currentY,
            )}
            fill="none"
            stroke="#fff"
            strokeWidth={2}
            strokeLinecap="round"
            strokeDasharray="6 4"
            opacity={0.5}
          />
          <circle cx={draggingCable.startX} cy={draggingCable.startY} r={4} fill="#fff" opacity={0.6} />
        </g>
      )}
    </svg>
  );
}
