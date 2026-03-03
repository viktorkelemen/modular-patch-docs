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
  { id: 'xpo', name: 'XPO', brand: 'Make Noise', hp: 18, imageDataUrl: xpoPanelUrl, imageAspect: 1305 / 1830, jacks: [
    // Top row — mono waveform outputs
    { id: 'xpo-sine',     label: 'Sine',     type: 'audio-out', x: 0.077, y: 0.071 },
    { id: 'xpo-tri',      label: 'Triangle', type: 'audio-out', x: 0.222, y: 0.071 },
    { id: 'xpo-saw',      label: 'Saw',      type: 'audio-out', x: 0.372, y: 0.071 },
    { id: 'xpo-spike',    label: 'Spike',    type: 'audio-out', x: 0.513, y: 0.071 },
    { id: 'xpo-sub',      label: 'Sub',      type: 'audio-out', x: 0.636, y: 0.071 },
    // Sync input (top-right)
    { id: 'xpo-sync',     label: 'Sync',     type: 'audio-in',  x: 0.912, y: 0.074 },
    // FM section
    { id: 'xpo-fm',       label: 'FM In',    type: 'audio-in',  x: 0.107, y: 0.192 },
    // Stereo outputs — right side (L [MONO] / R-OUT columns)
    { id: 'xpo-pwm-l',    label: 'PWM L',    type: 'audio-out', x: 0.682, y: 0.167 },
    { id: 'xpo-pwm-r',    label: 'PWM R',    type: 'audio-out', x: 0.850, y: 0.167 },
    { id: 'xpo-vt-l',     label: 'VarTim L', type: 'audio-out', x: 0.682, y: 0.240 },
    { id: 'xpo-vt-r',     label: 'VarTim R', type: 'audio-out', x: 0.850, y: 0.240 },
    { id: 'xpo-fold-l',   label: 'Fold L',   type: 'audio-out', x: 0.682, y: 0.311 },
    { id: 'xpo-fold-r',   label: 'Fold R',   type: 'audio-out', x: 0.850, y: 0.311 },
    // Bottom row — CV inputs
    { id: 'xpo-lft',      label: 'LFT',      type: 'cv-in',     x: 0.077, y: 0.918 },
    { id: 'xpo-voct1',    label: 'V/Oct',    type: 'cv-in',     x: 0.249, y: 0.918 },
    { id: 'xpo-expo',     label: 'Expo',     type: 'cv-in',     x: 0.414, y: 0.918 },
    { id: 'xpo-voct2',    label: 'V/Oct',    type: 'cv-in',     x: 0.536, y: 0.918 },
    { id: 'xpo-cntr',     label: 'CNTR',     type: 'cv-in',     x: 0.690, y: 0.918 },
    { id: 'xpo-rt',       label: 'RT',       type: 'cv-in',     x: 0.923, y: 0.918 },
  ] },
  { id: 'qpas', name: 'QPAS', brand: 'Make Noise', hp: 24, imageDataUrl: qpasPanelUrl, imageAspect: 1310 / 1835, jacks: [] },
  { id: 'maths', name: 'Maths', brand: 'Make Noise', hp: 20, imageDataUrl: mathsPanelUrl, imageAspect: 1450 / 1830, jacks: [] },
];
