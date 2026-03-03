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
  { id: 'dpo', name: 'DPO', brand: 'Make Noise', hp: 28, imageDataUrl: dpoPanelUrl, imageAspect: 1374 / 1258, jacks: [
    // VCO A outputs
    { id: 'dpo-a-tri',      label: 'A Tri',       type: 'audio-out', x: 0.069, y: 0.134 },
    { id: 'dpo-a-saw',      label: 'A Saw',       type: 'audio-out', x: 0.147, y: 0.136 },
    { id: 'dpo-a-sine',     label: 'A Sine',      type: 'audio-out', x: 0.230, y: 0.133 },
    // VCO B outputs
    { id: 'dpo-b-sine',     label: 'B Sine',      type: 'audio-out', x: 0.407, y: 0.134 },
    { id: 'dpo-b-square',   label: 'B Square',    type: 'audio-out', x: 0.490, y: 0.134 },
    // Final output
    { id: 'dpo-final',      label: 'Final',       type: 'audio-out', x: 0.572, y: 0.133 },
    // VCO A inputs
    { id: 'dpo-a-expo',     label: 'A Expo',      type: 'cv-in',     x: 0.070, y: 0.856 },
    { id: 'dpo-a-voct',     label: 'A 1V/Oct',    type: 'cv-in',     x: 0.152, y: 0.856 },
    { id: 'dpo-a-lin',      label: 'A Lin FM',    type: 'cv-in',     x: 0.231, y: 0.857 },
    // VCO B inputs
    { id: 'dpo-b-lin',      label: 'B Lin FM',    type: 'cv-in',     x: 0.406, y: 0.859 },
    { id: 'dpo-b-voct',     label: 'B 1V/Oct',    type: 'cv-in',     x: 0.490, y: 0.857 },
    { id: 'dpo-b-expo',     label: 'B Expo',      type: 'cv-in',     x: 0.569, y: 0.857 },
    { id: 'dpo-b-extlock',  label: 'B Ext Lock',  type: 'cv-in',     x: 0.447, y: 0.763 },
    // Processing inputs
    { id: 'dpo-follow',     label: 'Follow',      type: 'cv-in',     x: 0.318, y: 0.248 },
    { id: 'dpo-fmbus',      label: 'FM Bus Idx',  type: 'cv-in',     x: 0.319, y: 0.856 },
    { id: 'dpo-shape',      label: 'Shape',       type: 'cv-in',     x: 0.927, y: 0.141 },
    { id: 'dpo-angle',      label: 'Angle',       type: 'cv-in',     x: 0.927, y: 0.326 },
    { id: 'dpo-modbus',     label: 'Mod Bus Idx', type: 'cv-in',     x: 0.745, y: 0.852 },
    { id: 'dpo-extsrc',     label: 'Ext Src',     type: 'cv-in',     x: 0.661, y: 0.857 },
    { id: 'dpo-fold',       label: 'Fold',        type: 'cv-in',     x: 0.926, y: 0.858 },
    { id: 'dpo-strike',     label: 'Strike',      type: 'cv-in',     x: 0.847, y: 0.857 },
  ] },
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
  { id: 'qpas', name: 'QPAS', brand: 'Make Noise', hp: 24, imageDataUrl: qpasPanelUrl, imageAspect: 1310 / 1835, jacks: [
    // Audio inputs
    { id: 'qpas-in-l',      label: 'In L',        type: 'cv-in',     x: 0.082, y: 0.125 },
    { id: 'qpas-in-r',      label: 'In R',        type: 'cv-in',     x: 0.232, y: 0.125 },
    // CV inputs
    { id: 'qpas-level',     label: 'Level',       type: 'cv-in',     x: 0.087, y: 0.286 },
    { id: 'qpas-freq1',     label: 'Freq 1',      type: 'cv-in',     x: 0.402, y: 0.769 },
    { id: 'qpas-freq2',     label: 'Freq 2',      type: 'cv-in',     x: 0.404, y: 0.875 },
    { id: 'qpas-q',         label: 'Q',           type: 'cv-in',     x: 0.586, y: 0.877 },
    { id: 'qpas-rad-l',     label: 'Radiate L',   type: 'cv-in',     x: 0.094, y: 0.875 },
    { id: 'qpas-rad-r',     label: 'Radiate R',   type: 'cv-in',     x: 0.898, y: 0.876 },
    { id: 'qpas-bang-l',    label: '!! L',        type: 'cv-in',     x: 0.237, y: 0.877 },
    { id: 'qpas-bang-r',    label: '!! R',        type: 'cv-in',     x: 0.758, y: 0.876 },
    // Outputs — LP
    { id: 'qpas-lp-l',      label: 'LP L',        type: 'audio-out', x: 0.764, y: 0.126 },
    { id: 'qpas-lp-r',      label: 'LP R',        type: 'audio-out', x: 0.909, y: 0.127 },
    // Outputs — BP
    { id: 'qpas-bp-l',      label: 'BP L',        type: 'audio-out', x: 0.763, y: 0.226 },
    { id: 'qpas-bp-r',      label: 'BP R',        type: 'audio-out', x: 0.909, y: 0.225 },
    // Outputs — HP
    { id: 'qpas-hp-l',      label: 'HP L',        type: 'audio-out', x: 0.764, y: 0.327 },
    { id: 'qpas-hp-r',      label: 'HP R',        type: 'audio-out', x: 0.911, y: 0.327 },
    // Outputs — SP
    { id: 'qpas-sp-l',      label: 'SP L',        type: 'audio-out', x: 0.763, y: 0.426 },
    { id: 'qpas-sp-r',      label: 'SP R',        type: 'audio-out', x: 0.909, y: 0.429 },
  ] },
  { id: 'maths', name: 'Maths', brand: 'Make Noise', hp: 20, imageDataUrl: mathsPanelUrl, imageAspect: 1450 / 1830, jacks: [] },
];
