import test from 'node:test';
import assert from 'node:assert/strict';
import { getRotationDetails, getZoneForDate, isRegionActiveOnDate, getUpcomingActiveDatesForRegion } from '../src/lib/rotation.ts';

test('8-day Service Rotation Anchor Table Verification', () => {
  const expectedTable = [
    { date: '2026-07-13', zone: 'East', dayInZone: 1 },
    { date: '2026-07-14', zone: 'East', dayInZone: 2 },
    { date: '2026-07-15', zone: 'North', dayInZone: 1 },
    { date: '2026-07-16', zone: 'North', dayInZone: 2 },
    { date: '2026-07-17', zone: 'West', dayInZone: 1 },
    { date: '2026-07-18', zone: 'West', dayInZone: 2 },
    { date: '2026-07-19', zone: 'South', dayInZone: 1 },
    { date: '2026-07-20', zone: 'South', dayInZone: 2 },
    { date: '2026-07-21', zone: 'East', dayInZone: 1 },
    { date: '2026-07-22', zone: 'East', dayInZone: 2 },
    { date: '2026-07-23', zone: 'North', dayInZone: 1 },
    { date: '2026-07-24', zone: 'North', dayInZone: 2 },
    { date: '2026-07-25', zone: 'West', dayInZone: 1 },
    { date: '2026-07-26', zone: 'West', dayInZone: 2 },
    { date: '2026-07-27', zone: 'South', dayInZone: 1 },
    { date: '2026-07-28', zone: 'South', dayInZone: 2 },
    { date: '2026-07-29', zone: 'East', dayInZone: 1 },
  ];

  for (const entry of expectedTable) {
    const details = getRotationDetails(entry.date);
    assert.equal(details.activeZone, entry.zone, `Zone mismatch for ${entry.date}`);
    assert.equal(details.dayInZone, entry.dayInZone, `Day in zone mismatch for ${entry.date}`);
    assert.equal(getZoneForDate(entry.date), entry.zone);
  }
});

test('isRegionActiveOnDate correctness', () => {
  assert.equal(isRegionActiveOnDate('2026-07-13', 'East'), true);
  assert.equal(isRegionActiveOnDate('2026-07-13', 'West'), false);
  assert.equal(isRegionActiveOnDate('2026-07-25', 'West'), true);
  assert.equal(isRegionActiveOnDate('2026-07-25', 'South'), false);
});

test('getUpcomingActiveDatesForRegion returns next consecutive rotation days', () => {
  const dates = getUpcomingActiveDatesForRegion('East', 4, '2026-07-13');
  assert.deepEqual(dates, [
    '2026-07-13',
    '2026-07-14',
    '2026-07-21',
    '2026-07-22',
  ]);
});
