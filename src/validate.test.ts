import { describe, it, expect } from 'vitest';
import { validatePatchState } from './validate';

describe('validatePatchState', () => {
  const validState = {
    templates: [],
    modules: [],
    cables: [],
    patchName: 'Test',
  };

  it('accepts a valid empty PatchState', () => {
    expect(validatePatchState(validState)).toBe(true);
  });

  it('accepts a PatchState with modules and cables', () => {
    const state = {
      templates: [{ id: 't1', name: 'T', brand: 'B', hp: 12, imageDataUrl: null, jacks: [] }],
      modules: [{ id: 'm1', templateId: 't1', x: 0, y: 0, jacks: [] }],
      cables: [{ id: 'c1', color: '#f00', fromModuleId: 'm1', fromJackId: 'j1', toModuleId: 'm1', toJackId: 'j2', note: '' }],
    };
    expect(validatePatchState(state)).toBe(true);
  });

  it('rejects null', () => {
    expect(validatePatchState(null)).toBe(false);
  });

  it('rejects undefined', () => {
    expect(validatePatchState(undefined)).toBe(false);
  });

  it('rejects a string', () => {
    expect(validatePatchState('not an object')).toBe(false);
  });

  it('rejects missing modules array', () => {
    expect(validatePatchState({ templates: [], cables: [] })).toBe(false);
  });

  it('rejects missing cables array', () => {
    expect(validatePatchState({ templates: [], modules: [] })).toBe(false);
  });

  it('rejects missing templates array', () => {
    expect(validatePatchState({ modules: [], cables: [] })).toBe(false);
  });

  it('rejects a module with missing id', () => {
    const state = {
      templates: [],
      modules: [{ templateId: 't1', x: 0, y: 0, jacks: [] }],
      cables: [],
    };
    expect(validatePatchState(state)).toBe(false);
  });

  it('rejects a module with missing coordinates', () => {
    const state = {
      templates: [],
      modules: [{ id: 'm1', templateId: 't1', jacks: [] }],
      cables: [],
    };
    expect(validatePatchState(state)).toBe(false);
  });

  it('rejects a module without jacks array', () => {
    const state = {
      templates: [],
      modules: [{ id: 'm1', templateId: 't1', x: 0, y: 0 }],
      cables: [],
    };
    expect(validatePatchState(state)).toBe(false);
  });

  it('rejects a cable with missing fromModuleId', () => {
    const state = {
      templates: [],
      modules: [],
      cables: [{ id: 'c1', toModuleId: 'm1' }],
    };
    expect(validatePatchState(state)).toBe(false);
  });

  it('rejects a cable with missing toModuleId', () => {
    const state = {
      templates: [],
      modules: [],
      cables: [{ id: 'c1', fromModuleId: 'm1' }],
    };
    expect(validatePatchState(state)).toBe(false);
  });
});
