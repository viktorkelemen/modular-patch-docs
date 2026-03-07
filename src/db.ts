import { openDB, type DBSchema } from 'idb';
import type { SavedPatch } from './types';

interface PatchDB extends DBSchema {
  patches: {
    key: string;
    value: SavedPatch;
    indexes: { 'by-savedAt': number };
  };
}

function getDB() {
  return openDB<PatchDB>('modular-patch-docs', 1, {
    upgrade(db) {
      const store = db.createObjectStore('patches', { keyPath: 'id' });
      store.createIndex('by-savedAt', 'savedAt');
    },
  });
}

export async function savePatchToDB(patch: SavedPatch): Promise<void> {
  const db = await getDB();
  await db.put('patches', patch);
}

export async function listPatches(): Promise<SavedPatch[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('patches', 'by-savedAt');
  return all.reverse(); // newest first
}

export async function loadPatchFromDB(id: string): Promise<SavedPatch | undefined> {
  const db = await getDB();
  return db.get('patches', id);
}

export async function deletePatchFromDB(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('patches', id);
}

export async function patchNameExists(name: string): Promise<boolean> {
  const all = await listPatches();
  return all.some(p => p.name === name);
}
