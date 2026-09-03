import { getItem, setItem } from './db.ts';

// Official Canadian Launch: September 4th at 11:11 AM Mountain Daylight Time (Edmonton / Alberta, Canada)
// MDT is UTC-6. In ISO-8601: 2026-09-04T11:11:00-06:00
export const LAUNCH_TARGET_ISO = '2026-09-04T11:11:00-06:00';
export const LAUNCH_TIME_LABEL_CANADIAN = 'September 4, 2026 at 11:11 AM MDT (Canada)';

const ADMIN_FULL_LAUNCH_KEY = 'zoomievan_admin_full_launch_active';

export interface CountdownState {
  totalMs: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isLive: boolean;
}

/**
 * Calculates remaining time until the official launch moment.
 */
export function getTimeUntilLaunch(targetIso: string = LAUNCH_TARGET_ISO): CountdownState {
  const targetTime = new Date(targetIso).getTime();
  const now = Date.now();
  const totalMs = Math.max(0, targetTime - now);

  const seconds = Math.floor((totalMs / 1000) % 60);
  const minutes = Math.floor((totalMs / 1000 / 60) % 60);
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24);
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24));

  return {
    totalMs,
    days,
    hours,
    minutes,
    seconds,
    isLive: totalMs <= 0,
  };
}

/**
 * Check if the site is in Full Launch Mode (all regular pricing unlocked).
 * Returns true if the target time has passed OR if an admin has manually toggled full launch.
 */
export function isFullLaunchActive(): boolean {
  if (typeof window === 'undefined') return false;
  const manualOverride = getItem<boolean>(ADMIN_FULL_LAUNCH_KEY);
  if (manualOverride === true) return true;
  return getTimeUntilLaunch().isLive;
}

/**
 * Check if the site is currently in Early Access Only mode (Founding Members only).
 */
export function isEarlyAccessOnly(): boolean {
  return !isFullLaunchActive();
}

/**
 * Admin toggle: allows the admin to activate full launch early (e.g. 5 minutes before 11:11 AM)
 * or return to Early Access mode.
 */
export function setAdminFullLaunchOverride(active: boolean): void {
  if (typeof window !== 'undefined') {
    setItem(ADMIN_FULL_LAUNCH_KEY, active);
    window.dispatchEvent(new CustomEvent('zoomievan_launch_mode_changed', { detail: { active } }));
  }
}

/**
 * Gets whether the admin has explicitly set a manual override.
 */
export function getAdminFullLaunchOverride(): boolean {
  if (typeof window === 'undefined') return false;
  return getItem<boolean>(ADMIN_FULL_LAUNCH_KEY) === true;
}
