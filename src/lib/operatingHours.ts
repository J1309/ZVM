export interface DailySession {
  id: number;
  slotNumber: number;
  label: string;
  startTime: string; // e.g. "09:00"
  endTime: string;   // e.g. "10:00"
  displayTime: string; // e.g. "9:00 AM - 10:00 AM"
  workoutMinutes: number; // 30 mins
  bufferMinutes: number;  // 30 mins travel + dog prep
}

export interface SlotOverride {
  date: string; // "YYYY-MM-DD"
  sessionId: number;
  blocked: boolean;
  reason?: string;
  updatedAt: string;
}

/**
 * ZoomieVan Official Operational Sessions (7 total daily sessions from 9:00 AM to 4:00 PM Canada Mountain Time).
 * Each 1-hour session consists of 30 mins workout + 30 mins travel & dog prep.
 */
export const DAILY_SESSIONS: DailySession[] = [
  {
    id: 1,
    slotNumber: 1,
    label: "Session 1",
    startTime: "09:00",
    endTime: "10:00",
    displayTime: "9:00 AM - 10:00 AM",
    workoutMinutes: 30,
    bufferMinutes: 30,
  },
  {
    id: 2,
    slotNumber: 2,
    label: "Session 2",
    startTime: "10:00",
    endTime: "11:00",
    displayTime: "10:00 AM - 11:00 AM",
    workoutMinutes: 30,
    bufferMinutes: 30,
  },
  {
    id: 3,
    slotNumber: 3,
    label: "Session 3",
    startTime: "11:00",
    endTime: "12:00",
    displayTime: "11:00 AM - 12:00 PM",
    workoutMinutes: 30,
    bufferMinutes: 30,
  },
  {
    id: 4,
    slotNumber: 4,
    label: "Session 4",
    startTime: "12:00",
    endTime: "13:00",
    displayTime: "12:00 PM - 1:00 PM",
    workoutMinutes: 30,
    bufferMinutes: 30,
  },
  {
    id: 5,
    slotNumber: 5,
    label: "Session 5",
    startTime: "13:00",
    endTime: "14:00",
    displayTime: "1:00 PM - 2:00 PM",
    workoutMinutes: 30,
    bufferMinutes: 30,
  },
  {
    id: 6,
    slotNumber: 6,
    label: "Session 6",
    startTime: "14:00",
    endTime: "15:00",
    displayTime: "2:00 PM - 3:00 PM",
    workoutMinutes: 30,
    bufferMinutes: 30,
  },
  {
    id: 7,
    slotNumber: 7,
    label: "Session 7",
    startTime: "15:00",
    endTime: "16:00",
    displayTime: "3:00 PM - 4:00 PM",
    workoutMinutes: 30,
    bufferMinutes: 30,
  },
];

const OVERRIDES_KEY = 'zoomievan_slot_overrides';
const inMemoryOverrides: Record<string, SlotOverride> = {};

export function getOperatingSessions(): DailySession[] {
  return DAILY_SESSIONS;
}

export function getSlotOverrides(): Record<string, SlotOverride> {
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(OVERRIDES_KEY);
      if (raw) {
        return { ...inMemoryOverrides, ...JSON.parse(raw) };
      }
    }
  } catch {}
  return { ...inMemoryOverrides };
}

export function blockSessionSlot(date: string, sessionId: number, reason = 'Emergency Driver / Van Unavailable'): SlotOverride {
  const key = `${date}_${sessionId}`;
  const override: SlotOverride = {
    date,
    sessionId,
    blocked: true,
    reason,
    updatedAt: new Date().toISOString(),
  };
  inMemoryOverrides[key] = override;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(inMemoryOverrides));
    }
  } catch {}
  return override;
}

export function unblockSessionSlot(date: string, sessionId: number): void {
  const key = `${date}_${sessionId}`;
  delete inMemoryOverrides[key];
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(OVERRIDES_KEY, JSON.stringify(inMemoryOverrides));
    }
  } catch {}
}

export function isSlotBlocked(date: string, sessionId: number): { blocked: boolean; reason?: string } {
  const key = `${date}_${sessionId}`;
  const override = getSlotOverrides()[key];
  if (override?.blocked) {
    return { blocked: true, reason: override.reason };
  }
  return { blocked: false };
}
