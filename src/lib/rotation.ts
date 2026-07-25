export type ServiceZone = 'East' | 'North' | 'West' | 'South';

export const SERVICE_ZONES: readonly ServiceZone[] = ['East', 'North', 'West', 'South'] as const;

// Anchor date: Monday, July 13, 2026 (Rotation 1 - East Day 1)
export const ROTATION_ANCHOR_DATE = '2026-07-13';

/**
 * Calculates calendar day difference between target date and anchor date in UTC/local day space.
 */
export function getDaysFromAnchor(targetDate: Date | string): number {
  const anchor = new Date(`${ROTATION_ANCHOR_DATE}T00:00:00Z`);
  const dateStr = typeof targetDate === 'string' 
    ? targetDate.slice(0, 10) 
    : targetDate.toISOString().slice(0, 10);
  const target = new Date(`${dateStr}T00:00:00Z`);

  const diffMs = target.getTime() - anchor.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Returns rotation details for a given date.
 * Cycle: 8 days total
 * Days 0-1: East
 * Days 2-3: North
 * Days 4-5: West
 * Days 6-7: South
 */
export function getRotationDetails(targetDate: Date | string) {
  const daysFromAnchor = getDaysFromAnchor(targetDate);
  
  // Safe positive modulo for 8-day cycle
  const cycleDay = ((daysFromAnchor % 8) + 8) % 8;
  const rotationIndex = Math.floor(cycleDay / 2);
  const activeZone = SERVICE_ZONES[rotationIndex];
  const dayInZone = (cycleDay % 2) + 1; // Day 1 or Day 2
  
  // Rotation number (1-based from anchor date)
  const rotationNumber = Math.floor(daysFromAnchor / 8) + 1;

  // Calculate start and end dates of current 2-day zone block
  const blockStartOffset = daysFromAnchor - (cycleDay % 2);
  const anchorMs = new Date(`${ROTATION_ANCHOR_DATE}T00:00:00Z`).getTime();
  
  const blockStartDate = new Date(anchorMs + blockStartOffset * 86400000).toISOString().slice(0, 10);
  const blockEndDate = new Date(anchorMs + (blockStartOffset + 1) * 86400000).toISOString().slice(0, 10);

  return {
    daysFromAnchor,
    cycleDay,
    rotationNumber,
    activeZone,
    dayInZone,
    blockStartDate,
    blockEndDate,
  };
}

/**
 * Returns the active ServiceZone ('East' | 'North' | 'West' | 'South') for a given date.
 */
export function getZoneForDate(targetDate: Date | string): ServiceZone {
  return getRotationDetails(targetDate).activeZone;
}

/**
 * Checks if a specific FSA region is active on a given date.
 */
export function isRegionActiveOnDate(targetDate: Date | string, region: ServiceZone): boolean {
  return getZoneForDate(targetDate) === region;
}

/**
 * Returns the next N active calendar dates for a specific FSA region starting from `fromDate`.
 * Dates are returned in ISO string format (YYYY-MM-DD).
 */
export function getUpcomingActiveDatesForRegion(
  region: ServiceZone,
  limit: number = 5,
  fromDate: Date | string = new Date()
): string[] {
  const results: string[] = [];
  const startMs = typeof fromDate === 'string'
    ? new Date(`${fromDate.slice(0, 10)}T00:00:00Z`).getTime()
    : new Date(`${fromDate.toISOString().slice(0, 10)}T00:00:00Z`).getTime();

  let currentOffset = 0;
  while (results.length < limit && currentOffset < 365) {
    const candidateDate = new Date(startMs + currentOffset * 86400000).toISOString().slice(0, 10);
    if (isRegionActiveOnDate(candidateDate, region)) {
      results.push(candidateDate);
    }
    currentOffset++;
  }

  return results;
}
