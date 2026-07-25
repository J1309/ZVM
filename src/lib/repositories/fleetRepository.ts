import { getItem, setItem, generateId } from '../db';
import { FleetVan } from '../types';
import { api, convex } from '../convexClient';

const KEY = 'fleet_vans';

const DEFAULT_VANS: FleetVan[] = [
  { id: 'VAN-001', name: 'Thunder', status: 'Active', location: 'Edmonton East', sessionsToday: 12, totalSessions: 847, createdAt: new Date().toISOString() },
  { id: 'VAN-002', name: 'Storm', status: 'Active', location: 'Edmonton West', sessionsToday: 9, totalSessions: 623, createdAt: new Date().toISOString() },
  { id: 'VAN-003', name: 'Lightning', status: 'Maintenance', location: 'Shop', sessionsToday: 0, totalSessions: 412, createdAt: new Date().toISOString() },
  { id: 'VAN-004', name: 'Bolt', status: 'Active', location: 'Edmonton South', sessionsToday: 11, totalSessions: 756, createdAt: new Date().toISOString() },
];

export async function getAllVans(): Promise<FleetVan[]> {
  if (convex) return convex.query(api.fleet.list);
  await new Promise(r => setTimeout(r, 60));
  const stored = getItem<FleetVan[]>(KEY);
  if (!stored || stored.length === 0) {
    setItem(KEY, DEFAULT_VANS);
    return DEFAULT_VANS;
  }
  return stored;
}

export async function addVan(van: Omit<FleetVan, 'id' | 'sessionsToday' | 'totalSessions' | 'createdAt'>): Promise<FleetVan> {
  if (convex) return convex.mutation(api.fleet.add, { van });
  await new Promise(r => setTimeout(r, 100));
  const vans = await getAllVans();
  const newVan: FleetVan = {
    ...van,
    id: generateId(),
    sessionsToday: 0,
    totalSessions: 0,
    createdAt: new Date().toISOString(),
  };
  vans.push(newVan);
  setItem(KEY, vans);
  return newVan;
}

export async function updateVan(id: string, updates: Partial<FleetVan>): Promise<FleetVan> {
  if (convex) return convex.mutation(api.fleet.update, { id: id as any, updates });
  await new Promise(r => setTimeout(r, 80));
  const vans = await getAllVans();
  const idx = vans.findIndex(v => v.id === id);
  if (idx === -1) throw new Error('Van not found');
  vans[idx] = { ...vans[idx], ...updates };
  setItem(KEY, vans);
  return vans[idx];
}

export async function deleteVan(id: string): Promise<void> {
  if (convex) {
    await convex.mutation(api.fleet.remove, { id: id as any });
    return;
  }
  await new Promise(r => setTimeout(r, 50));
  const vans = await getAllVans();
  setItem(KEY, vans.filter(v => v.id !== id));
}

export async function incrementSession(id: string): Promise<FleetVan> {
  if (convex) return convex.mutation(api.fleet.incrementSession, { id: id as any });
  const vans = await getAllVans();
  const idx = vans.findIndex(v => v.id === id);
  if (idx === -1) throw new Error('Van not found');
  vans[idx].sessionsToday += 1;
  vans[idx].totalSessions += 1;
  setItem(KEY, vans);
  return vans[idx];
}
