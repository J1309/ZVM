import test from 'node:test';
import assert from 'node:assert/strict';
import { blockSessionSlot, unblockSessionSlot, isSlotBlocked, DAILY_SESSIONS } from '../src/lib/operatingHours.ts';

test('blockSessionSlot blocks a specific date and session slot with a custom reason', () => {
  const date = '2026-07-15';
  const sessionId = 2; // Session 2 (10 AM - 11 AM)
  const reason = 'Emergency Van Repair';

  blockSessionSlot(date, sessionId, reason);

  const status = isSlotBlocked(date, sessionId);
  assert.equal(status.blocked, true, 'Slot should be marked as blocked');
  assert.equal(status.reason, reason, 'Block reason should match emergency input');
});

test('unblockSessionSlot restores slot availability', () => {
  const date = '2026-07-15';
  const sessionId = 2;

  unblockSessionSlot(date, sessionId);

  const status = isSlotBlocked(date, sessionId);
  assert.equal(status.blocked, false, 'Slot should no longer be blocked');
});
