import { v } from "convex/values";
import { action, internalMutation, internalQuery, mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin, requireIdentity } from "./auth";

const LEGAL_VERSION = "2026-07-14";

const planKey = v.union(
  v.literal("trial_run"),
  v.literal("single_run"),
  v.literal("package_1"),
  v.literal("package_2"),
);

const plans = {
  trial_run: { name: "Trial Run", amountCents: 7000, sessionsCount: 2, priceEnv: "STRIPE_PRICE_TRIAL_RUN" },
  single_run: { name: "Single Run", amountCents: 3500, sessionsCount: 1, priceEnv: "STRIPE_PRICE_SINGLE_RUN" },
  package_1: { name: "Package 1", amountCents: 11000, sessionsCount: 3, priceEnv: "STRIPE_PRICE_PACKAGE_1" },
  package_2: { name: "Package 2", amountCents: 20000, sessionsCount: 6, priceEnv: "STRIPE_PRICE_PACKAGE_2" },
} as const;

function siteUrl(origin: string) {
  const configured = process.env.SITE_URL;
  const url = new URL(configured || origin);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (!configured && !local) throw new Error("SITE_URL is not configured.");
  if (url.protocol !== "https:" && !local) throw new Error("SITE_URL must use HTTPS.");
  return url.origin;
}

/**
 * Founding Member offer: the first N Trial Run buyers pay the normal price and
 * receive one bonus session (2 + 1 = 3). The price is unchanged, so this needs
 * no Stripe coupon — only the session count differs.
 */
export const FOUNDING_MAX_MEMBERS = 50;
export const FOUNDING_BONUS_SESSIONS = 1;
const FOUNDING_PLAN_KEY = "trial_run";

// A slot is held by a completed purchase or an in-flight checkout. Abandoned
// checkouts are marked cancelled by the Stripe webhook, releasing their slot.
async function foundingSnapshot(ctx: { db: any }) {
  const rows = await ctx.db.query("payments").collect();
  const claimedCount = rows.filter((p: any) =>
    p.isFoundingMember === true &&
    (p.status === "paid" || p.status === "checkout_created")
  ).length;

  const settings = await ctx.db.query("cmsSettings").first();
  const manuallyClosed = settings?.foundingOfferClosed === true;
  const remainingCount = Math.max(0, FOUNDING_MAX_MEMBERS - claimedCount);

  return {
    maxCount: FOUNDING_MAX_MEMBERS,
    claimedCount,
    remainingCount,
    bonusSessions: FOUNDING_BONUS_SESSIONS,
    manuallyClosed,
    isOfferActive: !manuallyClosed && remainingCount > 0,
  };
}

/**
 * PUBLIC on purpose: the landing page banner needs this without a session.
 * Returns aggregate counts only — no customer names, emails, or amounts.
 */
export const foundingStatus = query({
  args: {},
  handler: async (ctx) => foundingSnapshot(ctx),
});

export const getFoundingSnapshot = internalQuery({
  args: {},
  handler: async (ctx) => foundingSnapshot(ctx),
});

/** Admin kill-switch, independent of the 50-slot cap. */
export const setFoundingOfferClosed = mutation({
  args: { closed: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const existing = await ctx.db.query("cmsSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, { foundingOfferClosed: args.closed, updatedAt: now });
    } else {
      await ctx.db.insert("cmsSettings", {
        heroTagline: "A Professional Dog Gym That Comes to You",
        baseSessionRate: 35,
        weeklyPackRate: 110,
        eightPackRate: 200,
        emergencyBannerText: "",
        emergencyBannerActive: false,
        foundingOfferClosed: args.closed,
        createdAt: now,
        updatedAt: now,
      });
    }
    return await foundingSnapshot(ctx);
  },
});

/** Admin view: who claimed a founding slot. */
export const foundingMembers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("payments").collect();
    return rows
      .filter(p => p.isFoundingMember === true && (p.status === "paid" || p.status === "checkout_created"))
      .sort((a, b) => a.createdAt - b.createdAt)
      .map(p => ({
        id: p._id,
        customerEmail: p.customerEmail,
        status: p.status,
        sessionsCount: p.sessionsCount ?? null,
        amountCents: p.amountCents,
        createdAt: new Date(p.createdAt).toISOString(),
      }));
  },
});

export const listAll = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("payments").collect();
    return rows.map(p => ({
      id: p._id,
      userId: p.userId ?? null,
      planKey: p.planKey,
      planName: p.planName,
      amountCents: p.amountCents,
      currency: p.currency,
      customerEmail: p.customerEmail,
      status: p.status,
      createdAt: new Date(p.createdAt).toISOString(),
    }));
  },
});

export const getCheckoutUser = internalQuery({
  args: { authProviderUserId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", q => q.eq("authProviderUserId", args.authProviderUserId))
      .unique();
    return user ? {
      id: user._id,
      email: user.email,
      legalAccepted: user.legalAccepted,
      legalVersion: user.legalVersion,
      dogName: user.dog.name,
    } : null;
  },
});

export const recordCheckoutSession = internalMutation({
  args: {
    userId: v.id("users"),
    bookingIds: v.array(v.id("bookings")),
    sessions: v.array(v.object({ date: v.string(), timeSlot: v.string() })),
    stripeCheckoutSessionId: v.string(),
    planKey,
    planName: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    customerEmail: v.string(),
    isFoundingMember: v.boolean(),
    sessionsCount: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.insert("payments", {
      ...args,
      status: "checkout_created",
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const markCheckoutSession = internalMutation({
  args: {
    stripeCheckoutSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    userId: v.optional(v.string()),
    amountTotal: v.optional(v.number()),
    currency: v.optional(v.string()),
    status: v.union(
      v.literal("paid"),
      v.literal("cancelled"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
  },
  handler: async (ctx, args) => {
    const payment = await ctx.db
      .query("payments")
      .withIndex("by_checkout_session", q => q.eq("stripeCheckoutSessionId", args.stripeCheckoutSessionId))
      .unique();

    if (!payment) return;
    if (args.status === "paid") {
      if (args.userId !== payment.userId) throw new Error("Stripe customer reference mismatch.");
      if (args.amountTotal !== payment.amountCents || args.currency?.toLowerCase() !== payment.currency) {
        throw new Error("Stripe payment amount mismatch.");
      }
    }
    if (payment.status === "paid" && args.status !== "refunded") return;

    await ctx.db.patch(payment._id, {
      stripePaymentIntentId: args.stripePaymentIntentId,
      status: args.status,
      updatedAt: Date.now(),
    });

    // When paid, promote pending_payment reservations to 'scheduled'.
    // Otherwise, release un-paid / cancelled / failed / refunded reservations.
    if (payment.bookingIds) {
      const targetStatus = args.status === "paid" ? "scheduled" : "cancelled";
      for (const bookingId of payment.bookingIds) {
        const booking = await ctx.db.get(bookingId);
        if (booking && (booking.status === "pending_payment" || booking.status === "scheduled")) {
          await ctx.db.patch(bookingId, { status: targetStatus, updatedAt: Date.now() });
        }
      }
    }
  },
});

export const cancelPendingCheckout = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await requireIdentity(ctx);
    const user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", q => q.eq("authProviderUserId", identity.subject))
      .unique();
    if (!user) return;

    const pendingBookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect();

    for (const b of pendingBookings) {
      if (b.status === "pending_payment") {
        await ctx.db.patch(b._id, { status: "cancelled", updatedAt: Date.now() });
      }
    }
  },
});

export const createCheckoutSession = action({
  args: {
    planKey,
    origin: v.string(),
    sessions: v.array(v.object({ date: v.string(), timeSlot: v.string() })),
  },
  handler: async (ctx, args): Promise<{ url: string; checkoutSessionId: string }> => {
    const identity = await requireIdentity(ctx);
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) throw new Error("Stripe is not configured yet.");

    const plan = plans[args.planKey];
    const priceId = process.env[plan.priceEnv];
    if (!priceId) throw new Error(`Missing ${plan.priceEnv}.`);

    // Founding status is decided here, on the server — never trusted from the
    // client. An eligible Trial Run gets one bonus session at the same price.
    const founding = await ctx.runQuery(internal.payments.getFoundingSnapshot, {});
    const isFoundingClaim = args.planKey === FOUNDING_PLAN_KEY && founding.isOfferActive;
    const expectedSessions = plan.sessionsCount + (isFoundingClaim ? FOUNDING_BONUS_SESSIONS : 0);

    // Founding members do not pick dates online; the owner personally calls them to arrange sessions.
    if (!isFoundingClaim && args.sessions.length !== expectedSessions) {
      throw new Error(`${plan.name} requires ${expectedSessions} session${expectedSessions === 1 ? "" : "s"}.`);
    }

    const user = await ctx.runQuery(internal.payments.getCheckoutUser, {
      authProviderUserId: identity.subject,
    });
    if (!user) throw new Error("User account not found.");
    if (!user.legalAccepted || user.legalVersion !== LEGAL_VERSION) {
      throw new Error("Accept the current service terms before checkout.");
    }
    if (!user.dogName) throw new Error("Complete your dog profile before checkout.");

    // Reserve sessions if scheduled online (for regular plans). For founding members,
    // reservations are scheduled manually via personal owner phone call.
    const planLabel = isFoundingClaim ? `${plan.name} (Founding Member)` : plan.name;
    let bookingIds: Array<import("./_generated/dataModel").Id<"bookings">> = [];
    if (!isFoundingClaim && args.sessions.length > 0) {
      bookingIds = await ctx.runMutation(internal.bookings.reserveMany, {
        userId: user.id,
        sessions: args.sessions,
        planName: planLabel,
        totalAmountCents: plan.amountCents,
        surcharge: 0,
      });
    }

    try {
      const baseUrl = siteUrl(args.origin);
      const body = new URLSearchParams();
      body.set("mode", "payment");
      body.set("line_items[0][price]", priceId);
      body.set("line_items[0][quantity]", "1");
      body.set("success_url", `${baseUrl}/dashboard?checkout=success`);
      body.set("cancel_url", `${baseUrl}/dashboard?checkout=cancelled`);
      body.set("customer_email", user.email);
      body.set("client_reference_id", user.id);
      body.set("metadata[userId]", user.id);
      body.set("metadata[planKey]", args.planKey);
      body.set("metadata[planName]", planLabel);
      body.set("metadata[foundingMember]", isFoundingClaim ? "yes" : "no");
      body.set("metadata[sessionsCount]", String(expectedSessions));
      body.set("metadata[sessions]", args.sessions.map(s => `${s.date} ${s.timeSlot}`).join("; "));

      const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const session = await response.json();

      if (!response.ok) throw new Error(session.error?.message || "Stripe checkout could not be started.");
      if (!session.id || !session.url) throw new Error("Stripe did not return a checkout URL.");

      await ctx.runMutation(internal.payments.recordCheckoutSession, {
        userId: user.id,
        bookingIds,
        sessions: args.sessions,
        stripeCheckoutSessionId: session.id,
        planKey: args.planKey,
        planName: planLabel,
        amountCents: plan.amountCents,
        currency: "cad",
        customerEmail: user.email,
        isFoundingMember: isFoundingClaim,
        sessionsCount: expectedSessions,
      });

      return { url: session.url, checkoutSessionId: session.id };
    } catch (error) {
      await ctx.runMutation(internal.bookings.releaseReservations, { bookingIds });
      throw error;
    }
  },
});
