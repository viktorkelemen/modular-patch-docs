import type { PatchState } from './types';

/** Runtime shape check for PatchState parsed from untrusted JSON. */
export function validatePatchState(data: unknown): data is PatchState {
  if (data == null || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.modules)) return false;
  if (!Array.isArray(obj.cables)) return false;
  // templates is required but may be empty
  if (!Array.isArray(obj.templates)) return false;

  // Validate each module's shape
  for (const m of obj.modules as unknown[]) {
    if (m == null || typeof m !== 'object') return false;
    const mod = m as Record<string, unknown>;
    if (typeof mod.id !== 'string' || typeof mod.templateId !== 'string') return false;
    if (typeof mod.x !== 'number' || typeof mod.y !== 'number') return false;
    if (!Array.isArray(mod.jacks)) return false;
  }

  // Validate each cable's shape
  for (const c of obj.cables as unknown[]) {
    if (c == null || typeof c !== 'object') return false;
    const cab = c as Record<string, unknown>;
    if (typeof cab.id !== 'string' || typeof cab.fromModuleId !== 'string') return false;
    if (typeof cab.toModuleId !== 'string') return false;
  }

  return true;
}
