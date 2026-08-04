import { api, convex } from './convexClient';

export type StripePlanKey = 'trial_run' | 'package_1' | 'package_2' | 'single_run';

export const STRIPE_PLANS: Array<{ key: StripePlanKey; name: string; price: number; summary: string }> = [
  { key: 'trial_run', name: 'Trial Run', price: 70, summary: '2 starter sessions' },
  { key: 'package_1', name: 'Package 1', price: 110, summary: '3 runs within one month' },
  { key: 'package_2', name: 'Package 2', price: 200, summary: '6 runs within one month' },
  { key: 'single_run', name: 'Single Run', price: 35, summary: '1 extra session' },
];

export async function createCheckoutSession(planKey: StripePlanKey, date: string, timeSlot: string) {
  if (!convex) throw new Error('Production backend is not connected yet.');
  return convex.action(api.payments.createCheckoutSession, {
    planKey,
    origin: window.location.origin,
    date,
    timeSlot,
  });
}
