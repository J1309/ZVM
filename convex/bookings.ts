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
async function slotIsTaken(ctx: any, date: string, timeSlot: string) {
  const clashes = await ctx.db
    .query("bookings")
    .withIndex("by_date_slot", (q: any) => q.eq("date", date).eq("timeSlot", timeSlot))
    .collect();
  return clashes.some((b: any) => b.status !== "cancelled");
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
    const rows = await ctx.db
      .query("bookings")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .collect();
    return rows.filter(b => b.status !== "cancelled" && b.timeSlot).map(b => b.timeSlot as string);
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
        status: "scheduled",
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
      if (booking && booking.status === "scheduled") await ctx.db.delete(bookingId);
    }
  },
});
