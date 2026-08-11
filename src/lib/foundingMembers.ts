import { getItem } from './db';
import { getAllPayments } from './repositories/paymentRepository';
import { api, convex } from './convexClient';

export const MAX_FOUNDING_MEMBERS = 50;
export const FOUNDING_BONUS_SESSIONS = 1;
/** Demo-mode only: lets the admin preview a claimed count without a backend. */
const OVERRIDE_KEY = 'founding_members_claimed_override';

export interface FoundingMemberStats {
  maxCount: number;
  claimedCount: number;
  remainingCount: number;
  /** Extra sessions granted on top of the plan's normal count. */
  bonusSessions: number;
  /** True when an admin manually ended the offer before the cap was reached. */
  manuallyClosed: boolean;
  isOfferActive: boolean;
}

const CLOSED: FoundingMemberStats = {
  maxCount: MAX_FOUNDING_MEMBERS,
  claimedCount: MAX_FOUNDING_MEMBERS,
  remainingCount: 0,
  bonusSessions: FOUNDING_BONUS_SESSIONS,
  manuallyClosed: false,
  isOfferActive: false,
};

/**
 * Reads the live claim count. In production this hits a PUBLIC Convex query so
 * the landing page works for signed-out visitors; the previous version called
 * an admin-only query, which always threw and left the banner frozen.
 *
 * Fails closed: if the count can't be read we treat the offer as inactive
 * rather than advertising a bonus the server would refuse to honour.
 */
export async function getFoundingMemberStats(): Promise<FoundingMemberStats> {
  if (convex) {
    try {
      return await convex.query(api.payments.foundingStatus, {});
    } catch {
      return CLOSED;
    }
  }

  // Demo mode (no backend): derive from locally stored payments.
  try {
    const payments = await getAllPayments();
    const trialPayments = payments.filter(
      p => p.planKey === 'trial_run' && (p.status === 'paid' || p.status === 'checkout_created'),
    );
    const manualOverride = getItem<number | null>(OVERRIDE_KEY);
    const claimedCount = typeof manualOverride === 'number'
      ? manualOverride
      : Math.min(trialPayments.length, MAX_FOUNDING_MEMBERS);
    const remainingCount = Math.max(0, MAX_FOUNDING_MEMBERS - claimedCount);
    return {
      maxCount: MAX_FOUNDING_MEMBERS,
      claimedCount,
      remainingCount,
      bonusSessions: FOUNDING_BONUS_SESSIONS,
      manuallyClosed: false,
      isOfferActive: remainingCount > 0,
    };
  } catch {
    return CLOSED;
  }
}

/** Admin kill-switch. Persists server-side when a backend is connected. */
export async function setFoundingOfferClosed(closed: boolean): Promise<FoundingMemberStats> {
  if (!convex) throw new Error('Connect the production backend to change the offer status.');
  return convex.mutation(api.payments.setFoundingOfferClosed, { closed });
}

export interface FoundingMemberEntry {
  id: string;
  customerEmail: string;
  status: string;
  sessionsCount: number | null;
  amountCents: number;
  createdAt: string;
}

/** Admin-only list of who claimed a founding slot. */
export async function getFoundingMemberList(): Promise<FoundingMemberEntry[]> {
  if (!convex) return [];
  try {
    return await convex.query(api.payments.foundingMembers, {});
  } catch {
    return [];
  }
}
