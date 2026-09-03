import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  LAUNCH_TARGET_ISO, 
  LAUNCH_TIME_LABEL_CANADIAN, 
  getTimeUntilLaunch 
} from '../src/lib/launchConfig.ts';

test('Launch target ISO is set to September 4, 2026 at 11:11 AM MDT (UTC-6)', () => {
  assert.equal(LAUNCH_TARGET_ISO, '2026-09-04T11:11:00-06:00');
  assert.ok(LAUNCH_TIME_LABEL_CANADIAN.includes('September 4, 2026 at 11:11 AM MDT'));
});

test('getTimeUntilLaunch calculates positive remaining time before launch', () => {
  const targetTime = new Date('2026-09-04T11:11:00-06:00').getTime();
  // Target date parsed as timestamp
  assert.ok(!isNaN(targetTime), 'Target date should be a valid timestamp');
  
  // Future countdown check
  const futureIso = new Date(Date.now() + 1000 * 60 * 60 * 25).toISOString(); // 25 hours from now
  const countdown = getTimeUntilLaunch(futureIso);
  assert.equal(countdown.isLive, false);
  assert.ok(countdown.days >= 1);
  assert.ok(countdown.totalMs > 0);
});

test('getTimeUntilLaunch returns isLive: true when target has passed', () => {
  const pastIso = new Date(Date.now() - 5000).toISOString();
  const countdown = getTimeUntilLaunch(pastIso);
  assert.equal(countdown.isLive, true);
  assert.equal(countdown.totalMs, 0);
  assert.equal(countdown.days, 0);
  assert.equal(countdown.hours, 0);
  assert.equal(countdown.minutes, 0);
  assert.equal(countdown.seconds, 0);
});
