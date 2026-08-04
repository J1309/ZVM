import { getItem, setItem } from '../db';
import { Booking } from '../types';
import { api, convex } from '../convexClient';

const KEY = 'bookings';

// Time slots already held for a date, so the picker can grey them out.
export async function getTakenSlots(date: string): Promise<string[]> {
  if (convex) return convex.query(api.bookings.takenSlots, { date });
  return (getItem<Booking[]>(KEY) ?? [])
    .filter(b => b.date === date && b.status !== 'cancelled' && b.timeSlot)
    .map(b => b.timeSlot as string);
}

function generateSampleBookings(): Booking[] {
  const dogs = ['Max', 'Bella', 'Charlie', 'Luna', 'Cooper', 'Daisy', 'Rocky', 'Molly', 'Bear', 'Lucy'];
  const customers = ['Sarah C.', 'James O.', 'David P.', 'Emma R.', 'Michael S.', 'Olivia T.', 'Daniel U.', 'Sophia V.', 'William W.', 'Ava X.'];
  const fsas = ['M5V', 'V6B', 'T2P', 'K1A', 'H2X'];
  const vanIds = ['VAN-001', 'VAN-002', 'VAN-003', 'VAN-004'];
  const baseFee = 49;

  return Array.from({ length: 80 }, (_, i) => {
    const surcharge = i % 7 === 0 ? 5 : 0;
    const dayOffset = Math.floor(i / 3);
    const statuses: Array<Booking['status']> = ['completed', 'completed', 'completed', 'cancelled'];
    return {
      id: `B${String(i + 1).padStart(4, '0')}`,
      vanId: vanIds[i % vanIds.length],
      fsa: fsas[i % fsas.length],
      customerName: customers[i % customers.length],
      dogName: dogs[i % dogs.length],
      date: new Date(Date.now() - dayOffset * 86400000).toISOString().split('T')[0],
      sessionFee: baseFee,
      surcharge,
      status: statuses[i % statuses.length],
      createdAt: new Date(Date.now() - i * 86400000).toISOString(),
    };
  });
}

export async function getAllBookings(): Promise<Booking[]> {
  if (convex) return convex.query(api.bookings.list);
  await new Promise(r => setTimeout(r, 80));
  const stored = getItem<Booking[]>(KEY);
  if (!stored || stored.length === 0) {
    const samples = generateSampleBookings();
    setItem(KEY, samples);
    return samples;
  }
  return stored;
}
