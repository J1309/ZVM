import { getItem, setItem } from './db';
import { getAllPayments } from './repositories/paymentRepository';

export const MAX_FOUNDING_MEMBERS = 50;
const OVERRIDE_KEY = 'founding_members_claimed_override';

export interface FoundingMemberStats {
  maxCount: number;
  claimedCount: number;
  remainingCount: number;
  isOfferActive: boolean;
  trialPrice: number;
  originalPrice: number;
  discountPercentage: number;
}

export async function getFoundingMemberStats(): Promise<FoundingMemberStats> {
  const payments = await getAllPayments();
  const trialPayments = payments.filter(p => p.planKey === 'trial_run' && p.status === 'paid');
  
  const manualOverride = getItem<number | null>(OVERRIDE_KEY);
  const claimedCount = typeof manualOverride === 'number' ? manualOverride : Math.min(trialPayments.length, MAX_FOUNDING_MEMBERS);
  const remainingCount = Math.max(0, MAX_FOUNDING_MEMBERS - claimedCount);
  const isOfferActive = remainingCount > 0;
  
  const originalPrice = 70;
  const trialPrice = isOfferActive ? 35 : originalPrice;
  const discountPercentage = isOfferActive ? 50 : 0;

  return {
    maxCount: MAX_FOUNDING_MEMBERS,
    claimedCount,
    remainingCount,
    isOfferActive,
    trialPrice,
    originalPrice,
    discountPercentage,
  };
}

export function setManualFoundingClaimedCount(count: number): void {
  const clamped = Math.max(0, Math.min(MAX_FOUNDING_MEMBERS, count));
  setItem(OVERRIDE_KEY, clamped);
}
