import { useState, useCallback, useRef } from 'react';
import { v4 as uuid } from 'uuid';
import type {
  ModuleTemplate,
  PlacedModule,
  Cable,
  PatchState,
  JackDef,
} from './types';
import {
  CABLE_COLORS,
  DEFAULT_TEMPLATES,
} from './types';
import { Sidebar } from './components/Sidebar';
import { Canvas } from './components/Canvas';
import { CableLegend } from './components/CableLegend';
import { StatusBar } from './components/StatusBar';

export default function App() {
  const [templates, setTemplates] = useState<ModuleTemplate[]>(DEFAULT_TEMPLATES);
  const [modules, setModules] = useState<PlacedModule[]>([]);
  const [cables, setCables] = useState<Cable[]>([]);
  const [highlightedCableId, setHighlightedCableId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [legendOpen, setLegendOpen] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const cableColorIndex = useRef(0);

  const addTemplate = useCallback((t: ModuleTemplate) => {
    setTemplates(prev => {
      const existing = prev.find(p => p.id === t.id);
      if (existing) {
        return prev.map(p => p.id === t.id ? { ...p, ...t } : p);
      }
      return [...prev, t];
    });
  }, []);

  const placeModule = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    const mod: PlacedModule = {
      id: uuid(),
      templateId,
      x: 200 + Math.random() * 200,
      y: 100 + Math.random() * 100,
      jacks: template.jacks.map(j => ({ ...j, id: uuid() })),
    };
    setModules(prev => [...prev, mod]);
  }, [templates]);

  const removeModule = useCallback((moduleId: string) => {
    setModules(prev => prev.filter(m => m.id !== moduleId));
    setCables(prev => prev.filter(c => c.fromModuleId !== moduleId && c.toModuleId !== moduleId));
  }, []);

  const updateModulePosition = useCallback((moduleId: string, x: number, y: number) => {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, x, y } : m));
  }, []);

  const updateModuleJacks = useCallback((moduleId: string, jacks: JackDef[]) => {
    setModules(prev => prev.map(m => m.id === moduleId ? { ...m, jacks } : m));
  }, []);

  const updateTemplateJacks = useCallback((templateId: string, jacks: JackDef[]) => {
    setTemplates(prev => prev.map(t => t.id === templateId ? { ...t, jacks } : t));
  }, []);

  const addCable = useCallback((fromModuleId: string, fromJackId: string, toModuleId: string, toJackId: string) => {
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
  }, []);

  const removeCable = useCallback((cableId: string) => {
    setCables(prev => prev.filter(c => c.id !== cableId));
    if (highlightedCableId === cableId) setHighlightedCableId(null);
  }, [highlightedCableId]);

  const updateCableNote = useCallback((cableId: string, note: string) => {
    setCables(prev => prev.map(c => c.id === cableId ? { ...c, note } : c));
  }, []);

  const exportJSON = useCallback(() => {
    const state: PatchState = { templates, modules, cables };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'patch.json';
    a.click();
    URL.revokeObjectURL(url);
  }, [templates, modules, cables]);

  const importJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const state: PatchState = JSON.parse(e.target?.result as string);
        if (state.templates) setTemplates(state.templates);
        if (state.modules) setModules(state.modules);
        if (state.cables) setCables(state.cables);
      } catch {
        alert('Invalid patch file');
      }
    };
    reader.readAsText(file);
  }, []);

  const exportPNG = useCallback(async () => {
    const el = canvasRef.current;
    if (!el) return;
    const { toPng } = await import('html-to-image');
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: '#f0f0ec',
        pixelRatio: 2,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'patch.png';
      a.click();
    } catch (err) {
      console.error('PNG export failed', err);
    }
  }, []);

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
          <Canvas
            ref={canvasRef}
            modules={modules}
            cables={cables}
            templates={templates}
            zoom={zoom}
            onZoomChange={setZoom}
            onMoveModule={updateModulePosition}
            onRemoveModule={removeModule}
            onUpdateJacks={updateModuleJacks}
            onUpdateTemplateJacks={updateTemplateJacks}
            onAddCable={addCable}
            onRemoveCable={removeCable}
            highlightedCableId={highlightedCableId}
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
        onExportPNG={exportPNG}
        onExportJSON={exportJSON}
        onImportJSON={importJSON}
      />
    </div>
  );
}
