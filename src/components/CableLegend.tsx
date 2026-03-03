import type { Cable, PlacedModule, ModuleTemplate } from '../types';

interface Props {
  open: boolean;
  onToggle: () => void;
  cables: Cable[];
  modules: PlacedModule[];
  templates: ModuleTemplate[];
  highlightedCableId: string | null;
  onHighlight: (id: string | null) => void;
  onUpdateNote: (id: string, note: string) => void;
  onRemoveCable: (id: string) => void;
}

export function CableLegend({
  open, onToggle, cables, modules, templates,
  highlightedCableId, onHighlight, onUpdateNote, onRemoveCable,
}: Props) {
  const getLabel = (moduleId: string, jackId: string) => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return '?';
    const template = templates.find(t => t.id === mod.templateId);
    const jack = mod.jacks.find(j => j.id === jackId);
    return `${template?.name || '?'} : ${jack?.label || '?'}`;
  };

  if (cables.length === 0 && !open) return null;

  return (
    <div
      className="shrink-0 border-t overflow-hidden transition-all duration-200"
      style={{
        height: open ? Math.min(200, 36 + cables.length * 32) : 28,
        background: '#16161E',
        borderColor: '#2a2a3a',
      }}
    >
      <div
        className="flex items-center justify-between px-3 h-7 cursor-pointer select-none"
        onClick={onToggle}
        style={{ borderBottom: open ? '1px solid #2a2a3a' : 'none' }}
      >
        <span className="text-[10px] font-medium text-neutral-400 uppercase tracking-wider">
          Patch Notes ({cables.length})
        </span>
        <span className="text-neutral-500 text-xs">{open ? '\u25BC' : '\u25B2'}</span>
      </div>

      {open && (
        <div className="overflow-y-auto" style={{ maxHeight: 164 }}>
          {cables.length === 0 ? (
            <div className="px-3 py-2 text-[10px] text-neutral-600">No cables yet</div>
          ) : (
            cables.map(c => (
              <div
                key={c.id}
                className="flex items-center gap-2 px-3 py-1 cursor-pointer transition-colors"
                style={{
                  background: highlightedCableId === c.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                }}
                onClick={() => onHighlight(highlightedCableId === c.id ? null : c.id)}
              >
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ background: c.color }}
                />
                <span className="text-[10px] text-neutral-300 shrink-0">
                  {getLabel(c.fromModuleId, c.fromJackId)}
                </span>
                <span className="text-[10px] text-neutral-600">&rarr;</span>
                <span className="text-[10px] text-neutral-300 shrink-0">
                  {getLabel(c.toModuleId, c.toJackId)}
                </span>
                <input
                  className="flex-1 min-w-0 text-[10px] bg-transparent text-neutral-500 outline-none px-1"
                  placeholder="add note..."
                  value={c.note}
                  onChange={e => onUpdateNote(c.id, e.target.value)}
                  onClick={e => e.stopPropagation()}
                />
                <button
                  className="text-neutral-600 hover:text-red-400 text-xs shrink-0"
                  onClick={e => { e.stopPropagation(); onRemoveCable(c.id); }}
                  title="Remove cable"
                >
                  &times;
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
