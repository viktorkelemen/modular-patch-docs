export type JackType = 'audio-out' | 'cv-in';

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
  { id: 'xpo', name: 'XPO', brand: 'Make Noise', hp: 18, imageDataUrl: xpoPanelUrl, imageAspect: 1305 / 1830, jacks: [
    // Top row — mono waveform outputs
    { id: 'xpo-sine',     label: 'Sine',     type: 'audio-out', x: 0.081, y: 0.129 },
    { id: 'xpo-tri',      label: 'Triangle', type: 'audio-out', x: 0.221, y: 0.127 },
    { id: 'xpo-saw',      label: 'Saw',      type: 'audio-out', x: 0.362, y: 0.129 },
    { id: 'xpo-spike',    label: 'Spike',    type: 'audio-out', x: 0.505, y: 0.127 },
    { id: 'xpo-sub',      label: 'Sub',      type: 'audio-out', x: 0.645, y: 0.127 },
    // Sync input (top-right)
    { id: 'xpo-sync',     label: 'Sync',     type: 'cv-in',     x: 0.846, y: 0.125 },
    // FM section
    { id: 'xpo-fm',       label: 'FM In',    type: 'cv-in',     x: 0.221, y: 0.247 },
    { id: 'xpo-fm-cv',    label: 'FM CV',    type: 'cv-in',     x: 0.079, y: 0.289 },
    // Stereo outputs — right side (L [MONO] / R-OUT columns)
    { id: 'xpo-pwm-l',    label: 'PWM L',    type: 'audio-out', x: 0.772, y: 0.228 },
    { id: 'xpo-pwm-r',    label: 'PWM R',    type: 'audio-out', x: 0.917, y: 0.230 },
    { id: 'xpo-vt-l',     label: 'VarTim L', type: 'audio-out', x: 0.771, y: 0.329 },
    { id: 'xpo-vt-r',     label: 'VarTim R', type: 'audio-out', x: 0.916, y: 0.329 },
    { id: 'xpo-fold-l',   label: 'Fold L',   type: 'audio-out', x: 0.771, y: 0.430 },
    { id: 'xpo-fold-r',   label: 'Fold R',   type: 'audio-out', x: 0.916, y: 0.432 },
    // Bottom row — CV inputs
    { id: 'xpo-lft',      label: 'LFT',      type: 'cv-in',     x: 0.077, y: 0.881 },
    { id: 'xpo-voct1',    label: 'V/Oct',    type: 'cv-in',     x: 0.250, y: 0.881 },
    { id: 'xpo-expo',     label: 'Expo',     type: 'cv-in',     x: 0.392, y: 0.882 },
    { id: 'xpo-voct2',    label: 'V/Oct',    type: 'cv-in',     x: 0.530, y: 0.882 },
    { id: 'xpo-cntr',     label: 'CNTR',     type: 'cv-in',     x: 0.698, y: 0.880 },
    { id: 'xpo-rt',       label: 'RT',       type: 'cv-in',     x: 0.918, y: 0.881 },
  ] },
  { id: 'qpas', name: 'QPAS', brand: 'Make Noise', hp: 24, imageDataUrl: qpasPanelUrl, imageAspect: 1310 / 1835, jacks: [] },
  { id: 'maths', name: 'Maths', brand: 'Make Noise', hp: 20, imageDataUrl: mathsPanelUrl, imageAspect: 1450 / 1830, jacks: [] },
];
