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

export function getOperatingSessions(): DailySession[] {
  return DAILY_SESSIONS;
}
