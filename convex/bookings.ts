import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { requireAdmin, requireUser } from "./auth";

function bookingFromDoc(doc: any) {
  return {
    id: doc._id,
    vanId: doc.vanId ?? "",
    fsa: doc.fsa,
    customerName: doc.customerName,
    dogName: doc.dogName,
    date: doc.date,
    timeSlot: doc.timeSlot ?? "",
    planName: doc.planName ?? "",
    sessionFee: doc.sessionFee,
    surcharge: doc.surcharge,
    status: doc.status,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

// Active bookings hold a slot; cancelled ones release it.
// Pending bookings expire after 15 minutes if payment is not completed.
// Scheduled plan bookings require a verified 'paid' payment record.
async function slotIsTaken(ctx: any, date: string, timeSlot: string) {
  const now = Date.now();
  const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

  const clashes = await ctx.db
    .query("bookings")
    .withIndex("by_date_slot", (q: any) => q.eq("date", date).eq("timeSlot", timeSlot))
    .collect();

  const payments = await ctx.db.query("payments").collect();
  const paidBookingIds = new Set<string>();
  for (const p of payments) {
    if (p.status === "paid" && p.bookingIds) {
      p.bookingIds.forEach((id: any) => paidBookingIds.add(id));
    }
  }

  return clashes.some((b: any) => {
    if (!b.timeSlot || b.status === "cancelled") return false;
    if (b.status === "pending_payment") {
      return (now - b.createdAt) < FIFTEEN_MINUTES_MS;
    }
    if (b.status === "scheduled" && b.planName) {
      return paidBookingIds.has(b._id);
    }
    return true;
  });
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const bookings = await ctx.db.query("bookings").collect();
    return bookings.map(bookingFromDoc);
  },
});

// Time slots already held for a date, so the picker can grey them out.
export const takenSlots = query({
  args: { date: v.string() },
  handler: async (ctx, args) => {
    await requireUser(ctx);
    const now = Date.now();
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

    const rows = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();

    const payments = await ctx.db.query("payments").collect();
    const paidBookingIds = new Set<string>();
    for (const p of payments) {
      if (p.status === "paid" && p.bookingIds) {
        p.bookingIds.forEach((id: any) => paidBookingIds.add(id));
      }
    }

    const taken = rows.filter(b => {
      if (!b.timeSlot || b.status === "cancelled") return false;
      if (b.status === "pending_payment") {
        return (now - b.createdAt) < FIFTEEN_MINUTES_MS;
      }
      if (b.status === "scheduled" && b.planName) {
        return paidBookingIds.has(b._id);
      }
      return true;
    });

    return taken.map(b => b.timeSlot as string);
  },
});

// Sweep away expired pending_payment bookings and un-paid legacy test reservations.
export const sweepUnpaidBookings = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const FIFTEEN_MINUTES_MS = 15 * 60 * 1000;

    const allBookings = await ctx.db.query("bookings").collect();
    const allPayments = await ctx.db.query("payments").collect();

    const paidBookingIds = new Set<string>();
    for (const p of allPayments) {
      if (p.status === "paid" && p.bookingIds) {
        p.bookingIds.forEach((id: any) => paidBookingIds.add(id));
      }
    }

    for (const b of allBookings) {
      if (b.status === "pending_payment" && (now - b.createdAt > FIFTEEN_MINUTES_MS)) {
        await ctx.db.patch(b._id, { status: "cancelled", updatedAt: now });
      } else if (b.status === "scheduled" && b.planName && !paidBookingIds.has(b._id)) {
        await ctx.db.patch(b._id, { status: "cancelled", updatedAt: now });
      }
    }
  },
});

// Atomically reserve every session of a package before payment. Checks ALL
// requested slots for conflicts before inserting any — the first clash throws
// and rolls the whole mutation back, so it is naturally all-or-nothing. This
// is the authoritative double-booking guard (the picker is only a hint).
export const reserveMany = internalMutation({
  args: {
    userId: v.id("users"),
    sessions: v.array(v.object({ date: v.string(), timeSlot: v.string() })),
    planName: v.string(),
    totalAmountCents: v.number(),
    surcharge: v.number(),
  },
  handler: async (ctx, args) => {
    if (args.sessions.length === 0) throw new Error("No sessions to reserve.");

    // Reject same-day duplicates within this request, then check the DB.
    const seenDates = new Set<string>();
    for (const s of args.sessions) {
      if (seenDates.has(s.date)) throw new Error("Only one session per day is allowed.");
      seenDates.add(s.date);
      if (await slotIsTaken(ctx, s.date, s.timeSlot)) {
        throw new Error(`The ${s.timeSlot} session on ${s.date} was just booked. Please choose another slot.`);
      }
    }

    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User profile not found.");

    const now = Date.now();
    const fsa = (user.address?.postalCode || "").slice(0, 3).toUpperCase();
    // Split the package price evenly across its sessions so admin revenue totals
    // still sum to the amount paid.
    const perSessionFee = args.totalAmountCents / 100 / args.sessions.length;

    const ids: Array<import("./_generated/dataModel").Id<"bookings">> = [];
    for (const s of args.sessions) {
      ids.push(await ctx.db.insert("bookings", {
        userId: args.userId,
        fsa,
        customerName: user.name,
        dogName: user.dog?.name || "",
        date: s.date,
        timeSlot: s.timeSlot,
        planName: args.planName,
        sessionFee: perSessionFee,
        surcharge: args.surcharge,
        status: "pending_payment",
        createdAt: now,
        updatedAt: now,
      }));
    }
    return ids;
  },
});

// Roll back reservations if Stripe checkout could not be started.
export const releaseReservations = internalMutation({
  args: { bookingIds: v.array(v.id("bookings")) },
  handler: async (ctx, args) => {
    for (const bookingId of args.bookingIds) {
      const booking = await ctx.db.get(bookingId);
      if (booking && (booking.status === "pending_payment" || booking.status === "scheduled")) {
        await ctx.db.patch(bookingId, { status: "cancelled", updatedAt: Date.now() });
      }
    }
  },
});
