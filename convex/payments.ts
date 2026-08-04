import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { requireAdmin, requireIdentity } from "./auth";

const LEGAL_VERSION = "2026-07-14";

const planKey = v.union(
  v.literal("trial_run"),
  v.literal("package_1"),
  v.literal("package_2"),
  v.literal("single_run"),
);

const plans = {
  trial_run: { name: "Trial Run", amountCents: 7000, priceEnv: "STRIPE_PRICE_TRIAL_RUN" },
  package_1: { name: "Package 1", amountCents: 11000, priceEnv: "STRIPE_PRICE_PACKAGE_1" },
  package_2: { name: "Package 2", amountCents: 20000, priceEnv: "STRIPE_PRICE_PACKAGE_2" },
  single_run: { name: "Single Run", amountCents: 3500, priceEnv: "STRIPE_PRICE_SINGLE_RUN" },
} as const;

function siteUrl(origin: string) {
  const configured = process.env.SITE_URL;
  const url = new URL(configured || origin);
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (!configured && !local) throw new Error("SITE_URL is not configured.");
  if (url.protocol !== "https:" && !local) throw new Error("SITE_URL must use HTTPS.");
  return url.origin;
}

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
    bookingId: v.id("bookings"),
    sessionDate: v.string(),
    sessionTimeSlot: v.string(),
    stripeCheckoutSessionId: v.string(),
    planKey,
    planName: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    customerEmail: v.string(),
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

    // Payment did not complete (or was refunded): release the held slot so
    // it becomes bookable again. Paid reservations stay 'scheduled'.
    if (args.status !== "paid" && payment.bookingId) {
      const booking = await ctx.db.get(payment.bookingId);
      if (booking && booking.status === "scheduled") {
        await ctx.db.patch(payment.bookingId, { status: "cancelled", updatedAt: Date.now() });
      }
    }
  },
});

export const createCheckoutSession = action({
  args: {
    planKey,
    origin: v.string(),
    date: v.string(),
    timeSlot: v.string(),
  },
  handler: async (ctx, args): Promise<{ url: string; checkoutSessionId: string }> => {
    const identity = await requireIdentity(ctx);
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) throw new Error("Stripe is not configured yet.");

    const plan = plans[args.planKey];
    const priceId = process.env[plan.priceEnv];
    if (!priceId) throw new Error(`Missing ${plan.priceEnv}.`);

    const user = await ctx.runQuery(internal.payments.getCheckoutUser, {
      authProviderUserId: identity.subject,
    });
    if (!user) throw new Error("User account not found.");
    if (!user.legalAccepted || user.legalVersion !== LEGAL_VERSION) {
      throw new Error("Accept the current service terms before checkout.");
    }
    if (!user.dogName) throw new Error("Complete your dog profile before checkout.");

    // Reserve the slot BEFORE creating the Stripe session — this atomically
    // rejects a double-booking. The webhook later confirms (on paid) or the
    // reservation is released (on failure/expiry).
    const bookingId = await ctx.runMutation(internal.bookings.reserve, {
      userId: user.id,
      date: args.date,
      timeSlot: args.timeSlot,
      planName: plan.name,
      sessionFee: plan.amountCents / 100,
      surcharge: 0,
    });

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
      body.set("metadata[planName]", plan.name);
      body.set("metadata[sessionDate]", args.date);
      body.set("metadata[sessionTimeSlot]", args.timeSlot);

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
        bookingId,
        sessionDate: args.date,
        sessionTimeSlot: args.timeSlot,
        stripeCheckoutSessionId: session.id,
        planKey: args.planKey,
        planName: plan.name,
        amountCents: plan.amountCents,
        currency: "cad",
        customerEmail: user.email,
      });

      return { url: session.url, checkoutSessionId: session.id };
    } catch (error) {
      await ctx.runMutation(internal.bookings.releaseReservation, { bookingId });
      throw error;
    }
  },
});
