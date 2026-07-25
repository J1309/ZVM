import { getItem, setItem, generateId } from '../db';
import { FSARecord } from '../types';
import { api, convex } from '../convexClient';

const KEY = 'fsa_zones';

const DEFAULT_ZONES: FSARecord[] = [
  { id: generateId(), fsa: 'T5A', city: 'Edmonton', province: 'AB', tier: 'Tier 1', surcharge: 0, status: 'active', region: 'East', createdAt: new Date().toISOString() },
  { id: generateId(), fsa: 'T5L', city: 'Edmonton', province: 'AB', tier: 'Tier 1', surcharge: 0, status: 'active', region: 'North', createdAt: new Date().toISOString() },
  { id: generateId(), fsa: 'T5R', city: 'Edmonton', province: 'AB', tier: 'Tier 1', surcharge: 0, status: 'active', region: 'West', createdAt: new Date().toISOString() },
  { id: generateId(), fsa: 'T5H', city: 'Edmonton', province: 'AB', tier: 'Tier 1', surcharge: 0, status: 'active', region: 'South', createdAt: new Date().toISOString() },
  { id: generateId(), fsa: 'T5X', city: 'Edmonton', province: 'AB', tier: 'Tier 1', surcharge: 0, status: 'active', region: 'South', createdAt: new Date().toISOString() },
];

export async function getAllZones(): Promise<FSARecord[]> {
  if (convex) return convex.query(api.fsaZones.list);
  await new Promise(r => setTimeout(r, 60));
  const stored = getItem<FSARecord[]>(KEY);
  if (!stored || stored.length === 0) {
    setItem(KEY, DEFAULT_ZONES);
    return DEFAULT_ZONES;
  }
  return stored;
}

export async function addZone(zone: Omit<FSARecord, 'id' | 'createdAt'>): Promise<FSARecord> {
  if (convex) return convex.mutation(api.fsaZones.add, { zone });
  await new Promise(r => setTimeout(r, 100));
  const zones = await getAllZones();
  const newZone: FSARecord = { ...zone, id: generateId(), createdAt: new Date().toISOString() };
  zones.push(newZone);
  setItem(KEY, zones);
  return newZone;
}

export async function updateZone(id: string, updates: Partial<FSARecord>): Promise<FSARecord> {
  if (convex) return convex.mutation(api.fsaZones.update, { id: id as any, updates });
  await new Promise(r => setTimeout(r, 80));
  const zones = await getAllZones();
  const idx = zones.findIndex(z => z.id === id);
  if (idx === -1) throw new Error('Zone not found');
  zones[idx] = { ...zones[idx], ...updates };
  setItem(KEY, zones);
  return zones[idx];
}

export async function deleteZone(id: string): Promise<void> {
  if (convex) {
    await convex.mutation(api.fsaZones.remove, { id: id as any });
    return;
  }
  await new Promise(r => setTimeout(r, 60));
  const zones = await getAllZones();
  setItem(KEY, zones.filter(z => z.id !== id));
}
