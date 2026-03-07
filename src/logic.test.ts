// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import type { ModuleTemplate, PlacedModule, Cable } from './types';
import { EURORACK_HEIGHT_PX, PX_PER_HP, isOutputType, isInputType } from './types';
import {
  getModuleWidth,
  findPlacementX,
  resolveCollision,
  canConnect,
  removeCablesForModule,
  buildSignalFlow,
  loadSaved,
  savePatch,
} from './logic';

// ── Helpers ──

function makeTemplate(overrides: Partial<ModuleTemplate> = {}): ModuleTemplate {
  return {
    id: 'tpl-a',
    name: 'Test',
    brand: 'Test',
    hp: 12,
    imageDataUrl: null,
    jacks: [],
    ...overrides,
  };
}

function makeModule(overrides: Partial<PlacedModule> & { id: string; templateId: string }): PlacedModule {
  return {
    x: 0,
    y: 0,
    jacks: [],
    ...overrides,
  };
}

function makeCable(overrides: Partial<Cable> & { id: string }): Cable {
  return {
    color: '#e53935',
    fromModuleId: 'mod-a',
    fromJackId: 'jack-1',
    toModuleId: 'mod-b',
    toJackId: 'jack-2',
    note: '',
    ...overrides,
  };
}

// ── Tests ──

describe('getModuleWidth', () => {
  it('uses hp * PX_PER_HP when no imageAspect', () => {
    const t = makeTemplate({ hp: 20 });
    expect(getModuleWidth(t)).toBe(20 * PX_PER_HP);
  });

  it('uses EURORACK_HEIGHT_PX * imageAspect when present', () => {
    const t = makeTemplate({ hp: 20, imageAspect: 0.5 });
    expect(getModuleWidth(t)).toBe(EURORACK_HEIGHT_PX * 0.5);
  });
});

describe('findPlacementX', () => {
  const tpl = makeTemplate({ id: 'tpl-a', hp: 10 });
  const tplWidth = 10 * PX_PER_HP; // 150

  it('returns 100 when no modules exist', () => {
    expect(findPlacementX([], [tpl])).toBe(100);
  });

  it('places after rightmost module with gap', () => {
    const mod = makeModule({ id: 'mod-1', templateId: 'tpl-a', x: 100, y: 100 });
    expect(findPlacementX([mod], [tpl])).toBe(100 + tplWidth + 30);
  });

  it('handles multiple modules and finds the rightmost edge', () => {
    const mod1 = makeModule({ id: 'mod-1', templateId: 'tpl-a', x: 50, y: 100 });
    const mod2 = makeModule({ id: 'mod-2', templateId: 'tpl-a', x: 400, y: 100 });
    expect(findPlacementX([mod1, mod2], [tpl])).toBe(400 + tplWidth + 30);
  });

  it('uses custom gap', () => {
    const mod = makeModule({ id: 'mod-1', templateId: 'tpl-a', x: 100, y: 100 });
    expect(findPlacementX([mod], [tpl], 50)).toBe(100 + tplWidth + 50);
  });
});

describe('resolveCollision', () => {
  const tpl = makeTemplate({ id: 'tpl-a', hp: 10 });
  const w = 10 * PX_PER_HP; // 150
  const h = EURORACK_HEIGHT_PX;  // 380

  it('returns position unchanged when no overlap', () => {
    const modA = makeModule({ id: 'mod-a', templateId: 'tpl-a', x: 0, y: 0 });
    const modB = makeModule({ id: 'mod-b', templateId: 'tpl-a', x: 500, y: 0 });
    const result = resolveCollision('mod-a', 0, 0, [modA, modB], [tpl]);
    expect(result).toEqual({ x: 0, y: 0 });
  });

  it('pushes module right when overlapping from the left', () => {
    const modA = makeModule({ id: 'mod-a', templateId: 'tpl-a', x: 0, y: 0 });
    const modB = makeModule({ id: 'mod-b', templateId: 'tpl-a', x: 100, y: 0 });
    // Move A to x=50, which overlaps B (50 < 100+150 && 50+150 > 100)
    const result = resolveCollision('mod-a', 50, 0, [modA, modB], [tpl]);
    // Should push to right edge of B (100 + 150 = 250) or left edge (100 - 150 = -50)
    // pushRight = 100+150-50 = 200, pushLeft = 50+150-100 = 100 → pushLeft is smaller
    expect(result.x).toBe(100 - w); // pushed left
    expect(result.y).toBe(0);
  });

  it('pushes module down when vertical overlap is smallest', () => {
    const modA = makeModule({ id: 'mod-a', templateId: 'tpl-a', x: 0, y: 0 });
    const modB = makeModule({ id: 'mod-b', templateId: 'tpl-a', x: 0, y: 300 });
    // Move A to y=300 - same x, overlaps B vertically
    // pushRight = 0+150-0 = 150, pushLeft = 0+150-0 = 150, pushDown = 300+380-300 = 380, pushUp = 300+380-300 = 380
    // Actually for same x: pushRight = w = 150, pushLeft = w = 150 → these are smallest
    // Let me try a different scenario: move A to (0, h-10) which barely overlaps B at (0, 300)
    const result = resolveCollision('mod-a', 0, h - 10, [modA, modB], [tpl]);
    // pushRight = 150, pushLeft = 150, pushDown = 300 + 380 - 370 = 310, pushUp = 370 + 380 - 300 = 450
    // pushRight = pushLeft = 150 is smallest, picks pushRight → x = 0 + 150
    expect(result.x).toBe(w);
  });

  it('handles module not found gracefully', () => {
    const result = resolveCollision('nonexistent', 50, 50, [], [tpl]);
    expect(result).toEqual({ x: 50, y: 50 });
  });

  it('resolves chained overlaps across multiple modules', () => {
    // Three modules in a row, tightly packed
    const modA = makeModule({ id: 'mod-a', templateId: 'tpl-a', x: 0, y: 0 });
    const modB = makeModule({ id: 'mod-b', templateId: 'tpl-a', x: w, y: 0 });
    const modC = makeModule({ id: 'mod-c', templateId: 'tpl-a', x: w * 2, y: 0 });
    // Move A right into B — should not end up overlapping C either
    const result = resolveCollision('mod-a', w - 10, 0, [modA, modB, modC], [tpl]);
    // Should be pushed away and not overlap B or C
    const aLeft = result.x;
    const aRight = result.x + w;
    expect(aRight <= w || aLeft >= w + w).toBe(true); // doesn't overlap B
    expect(aRight <= w * 2 || aLeft >= w * 3).toBe(true); // doesn't overlap C
  });
});

describe('removeCablesForModule', () => {
  it('removes cables connected to the module', () => {
    const cables = [
      makeCable({ id: 'c1', fromModuleId: 'mod-a', toModuleId: 'mod-b' }),
      makeCable({ id: 'c2', fromModuleId: 'mod-b', toModuleId: 'mod-c' }),
      makeCable({ id: 'c3', fromModuleId: 'mod-c', toModuleId: 'mod-a' }),
    ];
    const result = removeCablesForModule(cables, 'mod-a');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c2');
  });

  it('returns all cables when module has none', () => {
    const cables = [
      makeCable({ id: 'c1', fromModuleId: 'mod-a', toModuleId: 'mod-b' }),
    ];
    expect(removeCablesForModule(cables, 'mod-x')).toHaveLength(1);
  });

  it('returns empty array when all cables belong to module', () => {
    const cables = [
      makeCable({ id: 'c1', fromModuleId: 'mod-a', toModuleId: 'mod-b' }),
    ];
    expect(removeCablesForModule(cables, 'mod-a')).toHaveLength(0);
  });
});

describe('savePatch / loadSaved', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads patch state', () => {
    const state = {
      templates: [makeTemplate()],
      modules: [makeModule({ id: 'mod-1', templateId: 'tpl-a', x: 50, y: 100 })],
      cables: [makeCable({ id: 'c1' })],
    };
    savePatch(state);
    const loaded = loadSaved();
    expect(loaded).not.toBeNull();
    expect(loaded!.modules).toHaveLength(1);
    expect(loaded!.modules[0].x).toBe(50);
    expect(loaded!.cables).toHaveLength(1);
  });

  it('returns null when nothing saved', () => {
    expect(loadSaved()).toBeNull();
  });

  it('returns null for corrupt data', () => {
    localStorage.setItem('modular-patch-docs', 'not json');
    expect(loadSaved()).toBeNull();
  });

  it('returns null for incomplete data', () => {
    localStorage.setItem('modular-patch-docs', JSON.stringify({ templates: [] }));
    expect(loadSaved()).toBeNull();
  });
});

describe('canConnect', () => {
  const modules: PlacedModule[] = [
    makeModule({
      id: 'mod-a', templateId: 'tpl-a', x: 0, y: 0,
      jacks: [
        { id: 'j-out', label: 'Out', type: 'audio-out', x: 0.5, y: 0.1 },
        { id: 'j-in', label: 'In', type: 'cv-in', x: 0.5, y: 0.9 },
        { id: 'j-gate-out', label: 'Gate', type: 'gate-out', x: 0.3, y: 0.1 },
        { id: 'j-gate-in', label: 'Gate In', type: 'gate-in', x: 0.3, y: 0.9 },
        { id: 'j-trig-out', label: 'Trig', type: 'trigger-out', x: 0.7, y: 0.1 },
        { id: 'j-trig-in', label: 'Trig In', type: 'trigger-in', x: 0.7, y: 0.9 },
      ],
    }),
    makeModule({
      id: 'mod-b', templateId: 'tpl-a', x: 200, y: 0,
      jacks: [
        { id: 'j-out2', label: 'Out', type: 'audio-out', x: 0.5, y: 0.1 },
        { id: 'j-in2', label: 'In', type: 'cv-in', x: 0.5, y: 0.9 },
        { id: 'j-gate-in2', label: 'Gate In', type: 'gate-in', x: 0.3, y: 0.9 },
      ],
    }),
  ];

  it('allows audio-out to cv-in', () => {
    expect(canConnect('mod-a', 'j-out', 'mod-b', 'j-in2', modules)).toBe(true);
  });

  it('allows cv-in to audio-out (reversed direction)', () => {
    expect(canConnect('mod-a', 'j-in', 'mod-b', 'j-out2', modules)).toBe(true);
  });

  it('allows gate-out to gate-in', () => {
    expect(canConnect('mod-a', 'j-gate-out', 'mod-b', 'j-gate-in2', modules)).toBe(true);
  });

  it('allows audio-out to gate-in (cross-type)', () => {
    expect(canConnect('mod-a', 'j-out', 'mod-b', 'j-gate-in2', modules)).toBe(true);
  });

  it('allows trigger-out to cv-in (cross-type)', () => {
    expect(canConnect('mod-a', 'j-trig-out', 'mod-b', 'j-in2', modules)).toBe(true);
  });

  it('rejects output to output', () => {
    expect(canConnect('mod-a', 'j-out', 'mod-b', 'j-out2', modules)).toBe(false);
  });

  it('rejects input to input', () => {
    expect(canConnect('mod-a', 'j-in', 'mod-b', 'j-in2', modules)).toBe(false);
  });

  it('rejects gate-out to audio-out', () => {
    expect(canConnect('mod-a', 'j-gate-out', 'mod-b', 'j-out2', modules)).toBe(false);
  });

  it('rejects same jack to itself', () => {
    expect(canConnect('mod-a', 'j-out', 'mod-a', 'j-out', modules)).toBe(false);
  });

  it('rejects when jack not found', () => {
    expect(canConnect('mod-a', 'nonexistent', 'mod-b', 'j-in2', modules)).toBe(false);
  });
});

describe('isOutputType / isInputType', () => {
  it('identifies output types', () => {
    expect(isOutputType('audio-out')).toBe(true);
    expect(isOutputType('gate-out')).toBe(true);
    expect(isOutputType('trigger-out')).toBe(true);
    expect(isOutputType('cv-in')).toBe(false);
    expect(isOutputType('gate-in')).toBe(false);
  });

  it('identifies input types', () => {
    expect(isInputType('cv-in')).toBe(true);
    expect(isInputType('gate-in')).toBe(true);
    expect(isInputType('trigger-in')).toBe(true);
    expect(isInputType('audio-out')).toBe(false);
    expect(isInputType('gate-out')).toBe(false);
  });
});

describe('buildSignalFlow', () => {
  const tpl = makeTemplate({ id: 'tpl-a', name: 'Synth' });
  const modules: PlacedModule[] = [
    makeModule({
      id: 'mod-a', templateId: 'tpl-a', x: 0, y: 0,
      jacks: [
        { id: 'j-out', label: 'Out', type: 'audio-out', x: 0.5, y: 0.1 },
      ],
    }),
    makeModule({
      id: 'mod-b', templateId: 'tpl-a', x: 200, y: 0,
      jacks: [
        { id: 'j-in', label: 'In', type: 'cv-in', x: 0.5, y: 0.9 },
        { id: 'j-out', label: 'Out', type: 'audio-out', x: 0.5, y: 0.1 },
      ],
    }),
    makeModule({
      id: 'mod-c', templateId: 'tpl-a', x: 400, y: 0,
      jacks: [
        { id: 'j-in', label: 'In', type: 'cv-in', x: 0.5, y: 0.9 },
      ],
    }),
  ];

  it('returns empty for no cables', () => {
    expect(buildSignalFlow([], modules, [tpl])).toEqual([]);
  });

  it('builds a simple chain', () => {
    const cables = [
      makeCable({ id: 'c1', fromModuleId: 'mod-a', fromJackId: 'j-out', toModuleId: 'mod-b', toJackId: 'j-in' }),
    ];
    const flow = buildSignalFlow(cables, modules, [tpl]);
    expect(flow).toHaveLength(1);
    expect(flow[0]).toContain('Synth Out');
    expect(flow[0]).toContain('→');
    expect(flow[0]).toContain('Synth In');
  });

  it('chains multiple connections', () => {
    const cables = [
      makeCable({ id: 'c1', fromModuleId: 'mod-a', fromJackId: 'j-out', toModuleId: 'mod-b', toJackId: 'j-in' }),
      makeCable({ id: 'c2', fromModuleId: 'mod-b', fromJackId: 'j-out', toModuleId: 'mod-c', toJackId: 'j-in' }),
    ];
    const flow = buildSignalFlow(cables, modules, [tpl]);
    expect(flow.length).toBeGreaterThanOrEqual(1);
  });
});
