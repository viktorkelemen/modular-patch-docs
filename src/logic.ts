import type { ModuleTemplate, PlacedModule, Cable, PatchState } from './types';
import { EURORACK_HEIGHT_PX, PX_PER_HP, isOutputType, isInputType } from './types';

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
  // One must be output, one must be input
  return (isOutputType(fromJack.type) && isInputType(toJack.type)) ||
         (isInputType(fromJack.type) && isOutputType(toJack.type));
}

export function removeCablesForModule(cables: Cable[], moduleId: string): Cable[] {
  return cables.filter(c => c.fromModuleId !== moduleId && c.toModuleId !== moduleId);
}

/** Build a text summary of signal routing chains. */
export function buildSignalFlow(
  cables: Cable[],
  modules: PlacedModule[],
  templates: ModuleTemplate[],
): string[] {
  const label = (moduleId: string, jackId: string) => {
    const mod = modules.find(m => m.id === moduleId);
    if (!mod) return '?';
    const tpl = templates.find(t => t.id === mod.templateId);
    const jack = mod.jacks.find(j => j.id === jackId);
    return `${tpl?.name || '?'} ${jack?.label || '?'}`;
  };

  // Build adjacency: for each (module,jack), find what it connects to
  // We treat from→to as the signal direction (output→input)
  const adj = new Map<string, string[]>();
  const hasIncoming = new Set<string>();

  for (const c of cables) {
    const fromKey = `${c.fromModuleId}:${c.fromJackId}`;
    const toKey = `${c.toModuleId}:${c.toJackId}`;

    // Determine direction: output→input
    const fromMod = modules.find(m => m.id === c.fromModuleId);
    const fromJack = fromMod?.jacks.find(j => j.id === c.fromJackId);
    const isFromOutput = fromJack?.type.endsWith('-out');

    const srcKey = isFromOutput ? fromKey : toKey;
    const dstKey = isFromOutput ? toKey : fromKey;

    if (!adj.has(srcKey)) adj.set(srcKey, []);
    adj.get(srcKey)!.push(dstKey);
    hasIncoming.add(dstKey);
  }

  // Find chain starts (sources with no incoming connections)
  const starts = [...adj.keys()].filter(k => !hasIncoming.has(k));

  // Build chains
  const chains: string[] = [];
  const visited = new Set<string>();

  function walk(key: string): string[] {
    if (visited.has(key)) return [];
    visited.add(key);
    const [modId, jackId] = key.split(':');
    const result = [label(modId, jackId)];
    const nexts = adj.get(key);
    if (nexts && nexts.length > 0) {
      for (const next of nexts) {
        const [nModId, nJackId] = next.split(':');
        const rest = walk(next);
        if (rest.length > 0) {
          result.push(...rest);
        } else {
          result.push(label(nModId, nJackId));
        }
      }
    }
    return result;
  }

  for (const start of starts) {
    const chain = walk(start);
    if (chain.length >= 2) {
      chains.push(chain.join(' → '));
    }
  }

  // Any cables not yet visited (cycles or disconnected)
  for (const c of cables) {
    const fromKey = `${c.fromModuleId}:${c.fromJackId}`;
    const toKey = `${c.toModuleId}:${c.toJackId}`;
    if (!visited.has(fromKey) && !visited.has(toKey)) {
      chains.push(`${label(c.fromModuleId, c.fromJackId)} → ${label(c.toModuleId, c.toJackId)}`);
      visited.add(fromKey);
      visited.add(toKey);
    }
  }

  return chains;
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
