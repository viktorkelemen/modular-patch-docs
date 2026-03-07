import type { ModuleTemplate, PlacedModule, Cable, PatchState } from './types';
import { EURORACK_HEIGHT_PX, PX_PER_HP } from './types';

export function getModuleWidth(t: ModuleTemplate): number {
  return t.imageAspect ? EURORACK_HEIGHT_PX * t.imageAspect : t.hp * PX_PER_HP;
}

export function findPlacementX(
  modules: PlacedModule[],
  templates: ModuleTemplate[],
  gap = 30,
): number {
  if (modules.length === 0) return 100;
  let rightEdge = 0;
  for (const m of modules) {
    const t = templates.find(tp => tp.id === m.templateId);
    if (!t) continue;
    rightEdge = Math.max(rightEdge, m.x + getModuleWidth(t));
  }
  return rightEdge + gap;
}

export function resolveCollision(
  moduleId: string,
  x: number,
  y: number,
  modules: PlacedModule[],
  templates: ModuleTemplate[],
): { x: number; y: number } {
  const moving = modules.find(m => m.id === moduleId);
  if (!moving) return { x, y };
  const movingT = templates.find(t => t.id === moving.templateId);
  if (!movingT) return { x, y };
  const mw = getModuleWidth(movingT);
  const mh = EURORACK_HEIGHT_PX;

  let nx = x, ny = y;
  for (let pass = 0; pass < 5; pass++) {
    let resolved = true;
    for (const other of modules) {
      if (other.id === moduleId) continue;
      const ot = templates.find(t => t.id === other.templateId);
      if (!ot) continue;
      const ow = getModuleWidth(ot);
      const oh = EURORACK_HEIGHT_PX;

      if (nx < other.x + ow && nx + mw > other.x &&
          ny < other.y + oh && ny + mh > other.y) {
        const pushRight = other.x + ow - nx;
        const pushLeft = nx + mw - other.x;
        const pushDown = other.y + oh - ny;
        const pushUp = ny + mh - other.y;
        const min = Math.min(pushRight, pushLeft, pushDown, pushUp);
        if (min === pushRight) nx = other.x + ow;
        else if (min === pushLeft) nx = other.x - mw;
        else if (min === pushDown) ny = other.y + oh;
        else ny = other.y - mh;
        resolved = false;
      }
    }
    if (resolved) break;
  }
  return { x: nx, y: ny };
}

export function canConnect(
  fromModuleId: string, fromJackId: string,
  toModuleId: string, toJackId: string,
  modules: PlacedModule[],
): boolean {
  if (fromModuleId === toModuleId && fromJackId === toJackId) return false;
  const fromMod = modules.find(m => m.id === fromModuleId);
  const toMod = modules.find(m => m.id === toModuleId);
  const fromJack = fromMod?.jacks.find(j => j.id === fromJackId);
  const toJack = toMod?.jacks.find(j => j.id === toJackId);
  if (!fromJack || !toJack) return false;
  return fromJack.type !== toJack.type;
}

export function removeCablesForModule(cables: Cable[], moduleId: string): Cable[] {
  return cables.filter(c => c.fromModuleId !== moduleId && c.toModuleId !== moduleId);
}

const STORAGE_KEY = 'modular-patch-docs';

export function loadSaved(): PatchState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const state = JSON.parse(raw) as PatchState;
    if (state.modules && state.cables) return state;
  } catch { /* ignore corrupt data */ }
  return null;
}

export function savePatch(state: PatchState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
