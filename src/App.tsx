import { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuid } from 'uuid';
import type { ModuleTemplate, PlacedModule, Cable, PatchState } from './types';
import {
  CABLE_COLORS,
  DEFAULT_TEMPLATES,
} from './types';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { CableLegend } from './components/CableLegend';
import { StatusBar } from './components/StatusBar';
import {
  findPlacementX,
  resolveCollision,
  loadSaved,
  savePatch,
} from './logic';

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

interface HistoryEntry {
  modules: PlacedModule[];
  cables: Cable[];
}

const MAX_HISTORY = 50;

// Merge default jacks into saved templates that lost them
function mergeDefaultJacks(savedTemplates: ModuleTemplate[]): ModuleTemplate[] {
  return savedTemplates.map(st => {
    if (st.jacks.length > 0) return st;
    const def = DEFAULT_TEMPLATES.find(d => d.id === st.id);
    if (def && def.jacks.length > 0) return { ...st, jacks: def.jacks };
    return st;
  });
}

export default function App() {
  const saved = useRef(loadSaved());
  const [templates, setTemplates] = useState<ModuleTemplate[]>(() => {
    const base = saved.current?.templates ?? DEFAULT_TEMPLATES;
    return mergeDefaultJacks(base);
  });
  const [modules, setModules] = useState<PlacedModule[]>(() => {
    // Also update placed modules whose jacks are empty but template has jacks
    const mods = saved.current?.modules ?? [];
    const tpls = mergeDefaultJacks(saved.current?.templates ?? DEFAULT_TEMPLATES);
    return mods.map(m => {
      if (m.jacks.length > 0) return m;
      const tpl = tpls.find(t => t.id === m.templateId);
      if (tpl && tpl.jacks.length > 0) {
        return { ...m, jacks: tpl.jacks.map(j => ({ ...j, id: crypto.randomUUID() })) };
      }
      return m;
    });
  });
  const [cables, setCables] = useState<Cable[]>(saved.current?.cables ?? []);
  const [patchName, setPatchName] = useState(saved.current?.patchName ?? '');
  const [patchDescription, setPatchDescription] = useState(saved.current?.patchDescription ?? '');
  const [highlightedCableId, setHighlightedCableId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [legendOpen, setLegendOpen] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const cableColorIndex = useRef(saved.current?.cables?.length ?? 0);

  // ── Undo / Redo ──
  const undoStack = useRef<HistoryEntry[]>([]);
  const redoStack = useRef<HistoryEntry[]>([]);
  // Refs to access current state in callbacks without re-creating them
  const modulesRef = useRef(modules);
  const cablesRef = useRef(cables);
  modulesRef.current = modules;
  cablesRef.current = cables;

  const pushHistory = useCallback(() => {
    undoStack.current = [
      ...undoStack.current.slice(-(MAX_HISTORY - 1)),
      { modules: modulesRef.current, cables: cablesRef.current },
    ];
    redoStack.current = [];
  }, []);

  const undo = useCallback(() => {
    const stack = undoStack.current;
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    undoStack.current = stack.slice(0, -1);
    redoStack.current = [...redoStack.current, { modules: modulesRef.current, cables: cablesRef.current }];
    setModules(prev.modules);
    setCables(prev.cables);
  }, []);

  const redo = useCallback(() => {
    const stack = redoStack.current;
    if (stack.length === 0) return;
    const next = stack[stack.length - 1];
    redoStack.current = stack.slice(0, -1);
    undoStack.current = [...undoStack.current, { modules: modulesRef.current, cables: cablesRef.current }];
    setModules(next.modules);
    setCables(next.cables);
  }, []);

  // ── Keyboard shortcuts ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Undo: Cmd+Z (no Shift)
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      // Redo: Cmd+Shift+Z
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      // Delete selected module
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedModuleId) {
        // Don't delete when focused on an input
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return;
        e.preventDefault();
        removeModule(selectedModuleId);
        setSelectedModuleId(null);
      }
      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedModuleId(null);
        setHighlightedCableId(null);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo, selectedModuleId]);

  // Auto-save to localStorage
  useEffect(() => {
    savePatch({ templates, modules, cables, patchName, patchDescription });
  }, [templates, modules, cables, patchName, patchDescription]);

  const addTemplate = useCallback((t: ModuleTemplate) => {
    setTemplates(prev => {
      const existing = prev.find(p => p.id === t.id);
      if (existing) {
        return prev.map(p => p.id === t.id ? { ...p, ...t } : p);
      }
      return [...prev, t];
    });
    // Update jacks on already-placed modules using this template
    setModules(prev => prev.map(m => {
      if (m.templateId !== t.id) return m;
      // Build a map of old jack positions by label+type so we preserve cable connections
      // For brand new jacks (no match), generate new IDs
      const updated = t.jacks.map(tj => {
        // Try to find an existing jack with same id (for built-in templates)
        const existing = m.jacks.find(mj => mj.id === tj.id);
        if (existing) return { ...tj, id: existing.id };
        // Otherwise generate a new id
        return { ...tj, id: crypto.randomUUID() };
      });
      return { ...m, jacks: updated };
    }));
  }, []);

  const placeModule = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    pushHistory();
    const mod: PlacedModule = {
      id: uuid(),
      templateId,
      x: findPlacementX(modules, templates),
      y: 100,
      jacks: template.jacks.map(j => ({ ...j, id: uuid() })),
    };
    setModules(prev => [...prev, mod]);
  }, [templates, modules, pushHistory]);

  const removeModule = useCallback((moduleId: string) => {
    pushHistory();
    setModules(prev => prev.filter(m => m.id !== moduleId));
    setCables(prev => prev.filter(c => c.fromModuleId !== moduleId && c.toModuleId !== moduleId));
  }, [pushHistory]);

  // Called once when drag starts — pushes history so the entire drag can be undone
  const onDragStart = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  const GRID_SIZE = 30;
  const updateModulePosition = useCallback((moduleId: string, x: number, y: number) => {
    let nx = x, ny = y;
    if (snapToGrid) {
      nx = Math.round(nx / GRID_SIZE) * GRID_SIZE;
      ny = Math.round(ny / GRID_SIZE) * GRID_SIZE;
    }
    setModules(prev => {
      const pos = resolveCollision(moduleId, nx, ny, prev, templates);
      return prev.map(m => m.id === moduleId ? { ...m, ...pos } : m);
    });
  }, [templates, snapToGrid]);

  const addCable = useCallback((fromModuleId: string, fromJackId: string, toModuleId: string, toJackId: string) => {
    pushHistory();
    const color = CABLE_COLORS[cableColorIndex.current % CABLE_COLORS.length];
    cableColorIndex.current++;
    const cable: Cable = {
      id: uuid(),
      color,
      fromModuleId,
      fromJackId,
      toModuleId,
      toJackId,
      note: '',
    };
    setCables(prev => [...prev, cable]);
  }, [pushHistory]);

  const removeCable = useCallback((cableId: string) => {
    pushHistory();
    setCables(prev => prev.filter(c => c.id !== cableId));
    if (highlightedCableId === cableId) setHighlightedCableId(null);
  }, [highlightedCableId, pushHistory]);

  const updateCableNote = useCallback((cableId: string, note: string) => {
    setCables(prev => prev.map(c => c.id === cableId ? { ...c, note } : c));
  }, []);

  // ── Module duplicate ──
  const duplicateModule = useCallback((moduleId: string) => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return;
    pushHistory();
    const template = templates.find(t => t.id === mod.templateId);
    if (!template) return;
    const newMod: PlacedModule = {
      id: uuid(),
      templateId: mod.templateId,
      x: mod.x + (template.imageAspect ? 380 * template.imageAspect : template.hp * 15) + 20,
      y: mod.y,
      jacks: template.jacks.map(j => ({ ...j, id: uuid() })),
    };
    setModules(prev => [...prev, newMod]);
  }, [modules, templates, pushHistory]);

  const exportJSON = useCallback(() => {
    const state: PatchState = { templates, modules, cables, patchName, patchDescription };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${patchName || 'patch'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [templates, modules, cables, patchName, patchDescription]);

  const importJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state: PatchState = JSON.parse(e.target?.result as string);
        pushHistory();
        if (state.templates) setTemplates(state.templates);
        if (state.modules) setModules(state.modules);
        if (state.cables) setCables(state.cables);
        if (state.patchName != null) setPatchName(state.patchName);
        if (state.patchDescription != null) setPatchDescription(state.patchDescription);
      } catch {
        alert('Invalid patch file');
      }
    };
    reader.readAsText(file);
  }, [pushHistory]);

  const exportPNG = useCallback(async () => {
    const el = canvasRef.current;
    if (!el) return;
    const { toPng } = await import('html-to-image');

    // Build a wrapper that includes header + canvas + legend
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position:absolute;left:-9999px;background:#f0f0ec;padding:16px;';
    document.body.appendChild(wrapper);

    // Header
    if (patchName || patchDescription) {
      const header = document.createElement('div');
      header.style.cssText = 'margin-bottom:12px;';
      if (patchName) {
        const h = document.createElement('div');
        h.textContent = patchName;
        h.style.cssText = 'font-size:18px;font-weight:600;color:#333;font-family:system-ui;';
        header.appendChild(h);
      }
      if (patchDescription) {
        const d = document.createElement('div');
        d.textContent = patchDescription;
        d.style.cssText = 'font-size:12px;color:#888;font-family:system-ui;margin-top:4px;';
        header.appendChild(d);
      }
      wrapper.appendChild(header);
    }

    // Clone the canvas content
    const clone = el.cloneNode(true) as HTMLElement;
    clone.style.position = 'relative';
    wrapper.appendChild(clone);

    // Cable legend
    if (cables.length > 0) {
      const getLabel = (moduleId: string, jackId: string) => {
        const mod = modules.find(m => m.id === moduleId);
        if (!mod) return '?';
        const tpl = templates.find(t => t.id === mod.templateId);
        const jack = mod.jacks.find(j => j.id === jackId);
        return `${tpl?.name || '?'} : ${jack?.label || '?'}`;
      };
      const legend = document.createElement('div');
      legend.style.cssText = 'margin-top:12px;font-family:system-ui;';
      const title = document.createElement('div');
      title.textContent = 'Patch Notes';
      title.style.cssText = 'font-size:11px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;';
      legend.appendChild(title);
      for (const c of cables) {
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:6px;font-size:10px;color:#555;margin-bottom:3px;';
        const dot = document.createElement('div');
        dot.style.cssText = `width:8px;height:8px;border-radius:50%;background:${c.color};flex-shrink:0;`;
        row.appendChild(dot);
        const text = document.createElement('span');
        text.textContent = `${getLabel(c.fromModuleId, c.fromJackId)} → ${getLabel(c.toModuleId, c.toJackId)}`;
        row.appendChild(text);
        if (c.note) {
          const note = document.createElement('span');
          note.textContent = ` — ${c.note}`;
          note.style.color = '#999';
          row.appendChild(note);
        }
        legend.appendChild(row);
      }
      wrapper.appendChild(legend);
    }

    try {
      const dataUrl = await toPng(wrapper, {
        backgroundColor: '#f0f0ec',
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${patchName || 'patch'}.png`;
      a.click();
    } catch (err) {
      console.error('PNG export failed', err);
    } finally {
      document.body.removeChild(wrapper);
    }
  }, [patchName, patchDescription, cables, modules, templates]);

  const exportPDF = useCallback(async () => {
    const el = canvasRef.current;
    if (!el) return;
    const { toPng } = await import('html-to-image');
    const { default: jsPDF } = await import('jspdf');

    try {
      const dataUrl = await toPng(el, { backgroundColor: '#f0f0ec', pixelRatio: 2 });
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      let y = 10;

      // Title
      if (patchName) {
        pdf.setFontSize(16);
        pdf.setTextColor(51, 51, 51);
        pdf.text(patchName, 10, y);
        y += 7;
      }
      if (patchDescription) {
        pdf.setFontSize(10);
        pdf.setTextColor(136, 136, 136);
        pdf.text(patchDescription, 10, y);
        y += 6;
      }
      if (patchName || patchDescription) y += 2;

      // Patch image
      const img = new Image();
      img.src = dataUrl;
      await new Promise(resolve => { img.onload = resolve; });
      const imgAspect = img.width / img.height;
      const maxW = pageW - 20;
      const maxH = pageH - y - 40; // leave room for legend
      let imgW = maxW;
      let imgH = imgW / imgAspect;
      if (imgH > maxH) {
        imgH = maxH;
        imgW = imgH * imgAspect;
      }
      pdf.addImage(dataUrl, 'PNG', 10, y, imgW, imgH);
      y += imgH + 6;

      // Cable legend
      if (cables.length > 0) {
        const getLabel = (moduleId: string, jackId: string) => {
          const mod = modules.find(m => m.id === moduleId);
          if (!mod) return '?';
          const tpl = templates.find(t => t.id === mod.templateId);
          const jack = mod.jacks.find(j => j.id === jackId);
          return `${tpl?.name || '?'} : ${jack?.label || '?'}`;
        };
        pdf.setFontSize(9);
        pdf.setTextColor(102, 102, 102);
        pdf.text('Patch Notes', 10, y);
        y += 4;
        pdf.setFontSize(8);
        for (const c of cables) {
          if (y > pageH - 10) break; // don't overflow page
          // Color dot
          const rgb = hexToRgb(c.color);
          pdf.setFillColor(rgb.r, rgb.g, rgb.b);
          pdf.circle(12, y - 1, 1.2, 'F');
          // Label
          pdf.setTextColor(85, 85, 85);
          let text = `${getLabel(c.fromModuleId, c.fromJackId)} → ${getLabel(c.toModuleId, c.toJackId)}`;
          if (c.note) text += `  — ${c.note}`;
          pdf.text(text, 16, y);
          y += 3.5;
        }
      }

      pdf.save(`${patchName || 'patch'}.pdf`);
    } catch (err) {
      console.error('PDF export failed', err);
    }
  }, [patchName, patchDescription, cables, modules, templates]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          open={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          templates={templates}
          onAddTemplate={addTemplate}
          onPlaceModule={placeModule}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Patch metadata header */}
          <div className="flex items-center gap-3 px-3 py-1.5 shrink-0" style={{ background: '#fafaf8', borderBottom: '1px solid #ddd' }}>
            <input
              value={patchName}
              onChange={e => setPatchName(e.target.value)}
              placeholder="Patch name"
              className="text-sm font-medium bg-transparent text-neutral-700 outline-none min-w-0"
              style={{ width: Math.max(100, patchName.length * 7 + 20) }}
            />
            <input
              value={patchDescription}
              onChange={e => setPatchDescription(e.target.value)}
              placeholder="Description..."
              className="flex-1 text-xs bg-transparent text-neutral-500 outline-none"
            />
          </div>
          <Canvas
            ref={canvasRef}
            modules={modules}
            cables={cables}
            templates={templates}
            zoom={zoom}
            onZoomChange={setZoom}
            onMoveModule={updateModulePosition}
            onRemoveModule={removeModule}
            onDragStart={onDragStart}
            onAddCable={addCable}
            onRemoveCable={removeCable}
            highlightedCableId={highlightedCableId}
            selectedModuleId={selectedModuleId}
            onSelectModule={setSelectedModuleId}
            onDuplicateModule={duplicateModule}
          />
          <CableLegend
            open={legendOpen}
            onToggle={() => setLegendOpen(!legendOpen)}
            cables={cables}
            modules={modules}
            templates={templates}
            highlightedCableId={highlightedCableId}
            onHighlight={setHighlightedCableId}
            onUpdateNote={updateCableNote}
            onRemoveCable={removeCable}
          />
        </div>
      </div>
      <StatusBar
        moduleCount={modules.length}
        cableCount={cables.length}
        zoom={zoom}
        snapToGrid={snapToGrid}
        onToggleSnap={() => setSnapToGrid(s => !s)}
        onExportPNG={exportPNG}
        onExportPDF={exportPDF}
        onExportJSON={exportJSON}
        onImportJSON={importJSON}
      />
    </div>
  );
}
