import test from 'node:test';
import assert from 'node:assert/strict';
import { DAILY_SESSIONS, getOperatingSessions } from '../src/lib/operatingHours.ts';

test('DAILY_SESSIONS contains exactly 7 daily 1-hour sessions', () => {
  const sessions = getOperatingSessions();
  assert.equal(sessions.length, 7, 'Should have exactly 7 daily operational sessions');
});

test('Session 1 starts at 9:00 AM and Session 7 ends at 4:00 PM', () => {
  assert.equal(DAILY_SESSIONS[0].startTime, '09:00');
  assert.equal(DAILY_SESSIONS[0].displayTime, '9:00 AM - 10:00 AM');

  assert.equal(DAILY_SESSIONS[6].endTime, '16:00');
  assert.equal(DAILY_SESSIONS[6].displayTime, '3:00 PM - 4:00 PM');
});

test('Every session consists of 30 mins workout + 30 mins buffer', () => {
  for (const session of DAILY_SESSIONS) {
    assert.equal(session.workoutMinutes, 30, `Session ${session.slotNumber} workout should be 30 mins`);
    assert.equal(session.bufferMinutes, 30, `Session ${session.slotNumber} buffer should be 30 mins`);
  }
});
