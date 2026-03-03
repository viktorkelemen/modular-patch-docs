export type JackType = 'audio-in' | 'audio-out' | 'cv-in' | 'cv-out';

export interface JackDef {
  id: string;
  label: string;
  type: JackType;
  /** Position relative to module image, as fraction 0-1 */
  x: number;
  y: number;
}

export interface ModuleTemplate {
  id: string;
  name: string;
  brand: string;
  hp: number;
  imageDataUrl: string | null;
  /** Image width/height ratio — used to size the module container when present */
  imageAspect?: number;
  jacks: JackDef[];
}

export interface PlacedModule {
  id: string;
  templateId: string;
  x: number;
  y: number;
  jacks: JackDef[];
}

export interface Cable {
  id: string;
  color: string;
  fromModuleId: string;
  fromJackId: string;
  toModuleId: string;
  toJackId: string;
  note: string;
}

export interface PatchState {
  templates: ModuleTemplate[];
  modules: PlacedModule[];
  cables: Cable[];
}

export const CABLE_COLORS = [
  '#e53935', // red
  '#fdd835', // yellow
  '#1e88e5', // blue
  '#fb8c00', // orange
  '#43a047', // green
  '#8e24aa', // purple
  '#ec407a', // pink
  '#00acc1', // teal
];

export const EURORACK_HEIGHT_PX = 380;
export const PX_PER_HP = 15;

import dpoPanelUrl from './assets/dpo-panel.png';
import xpoPanelUrl from './assets/xpo-panel.png';
import mathsPanelUrl from './assets/maths-panel.png';
import qpasPanelUrl from './assets/qpas-panel.png';

export const DEFAULT_TEMPLATES: ModuleTemplate[] = [
  { id: 'dpo', name: 'DPO', brand: 'Make Noise', hp: 28, imageDataUrl: dpoPanelUrl, imageAspect: 1374 / 1258, jacks: [] },
  { id: 'xpo', name: 'XPO', brand: 'Make Noise', hp: 18, imageDataUrl: xpoPanelUrl, imageAspect: 1305 / 1830, jacks: [] },
  { id: 'qpas', name: 'QPAS', brand: 'Make Noise', hp: 24, imageDataUrl: qpasPanelUrl, imageAspect: 1310 / 1835, jacks: [] },
  { id: 'maths', name: 'Maths', brand: 'Make Noise', hp: 20, imageDataUrl: mathsPanelUrl, imageAspect: 1450 / 1830, jacks: [] },
];
