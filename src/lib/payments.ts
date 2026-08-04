import { api, convex } from './convexClient';

export type StripePlanKey = 'trial_run' | 'package_1' | 'package_2' | 'single_run';

export interface SessionPick {
  date: string;
  timeSlot: string;
}

export const STRIPE_PLANS: Array<{ key: StripePlanKey; name: string; price: number; sessionsCount: number; summary: string }> = [
  { key: 'trial_run', name: 'Trial Run', price: 70, sessionsCount: 2, summary: '2 starter sessions (recommended 1 week apart)' },
  { key: 'single_run', name: 'Single Run', price: 35, sessionsCount: 1, summary: '1 individual session' },
  { key: 'package_1', name: 'Package 1', price: 110, sessionsCount: 3, summary: '3 runs within one month' },
  { key: 'package_2', name: 'Package 2', price: 200, sessionsCount: 6, summary: '6 runs within one month (best value)' },
];

export async function createCheckoutSession(planKey: StripePlanKey, sessions: SessionPick[]) {
  if (!convex) throw new Error('Production backend is not connected yet.');
  return convex.action(api.payments.createCheckoutSession, {
    planKey,
    origin: window.location.origin,
    sessions,
  });
}

export async function cancelPendingCheckout() {
  if (!convex) return;
  return convex.mutation(api.payments.cancelPendingCheckout, {});
}
