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

// Atomically reserve a slot before payment. Throws if it was just taken —
// this is the authoritative double-booking guard (the picker is only a hint).
export const reserve = internalMutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
    timeSlot: v.string(),
    planName: v.string(),
    sessionFee: v.number(),
    surcharge: v.number(),
  },
  handler: async (ctx, args) => {
    if (await slotIsTaken(ctx, args.date, args.timeSlot)) {
      throw new Error("That session was just booked. Please choose another slot.");
    }
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User profile not found.");
    const now = Date.now();
    return await ctx.db.insert("bookings", {
      userId: args.userId,
      fsa: (user.address?.postalCode || "").slice(0, 3).toUpperCase(),
      customerName: user.name,
      dogName: user.dog?.name || "",
      date: args.date,
      timeSlot: args.timeSlot,
      planName: args.planName,
      sessionFee: args.sessionFee,
      surcharge: args.surcharge,
      status: "scheduled",
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Roll back a reservation if Stripe checkout could not be started.
export const releaseReservation = internalMutation({
  args: { bookingId: v.id("bookings") },
  handler: async (ctx, args) => {
    const booking = await ctx.db.get(args.bookingId);
    if (booking && booking.status === "scheduled") await ctx.db.delete(args.bookingId);
  },
});
