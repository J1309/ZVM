import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./auth";

function zoneFromDoc(doc: any) {
  return {
    id: doc._id,
    fsa: doc.fsa,
    city: doc.city,
    province: doc.province,
    tier: doc.tier,
    surcharge: doc.surcharge,
    status: doc.status,
    region: doc.region,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const zones = await ctx.db.query("fsaZones").collect();
    return zones.map(zoneFromDoc);
  },
});

export const add = mutation({
  args: {
    zone: v.object({
      fsa: v.string(),
      city: v.string(),
      province: v.string(),
      tier: v.union(v.literal("Tier 1"), v.literal("Tier 2")),
      surcharge: v.number(),
      status: v.union(v.literal("active"), v.literal("pending"), v.literal("inactive")),
      region: v.optional(v.union(v.literal("East"), v.literal("North"), v.literal("West"), v.literal("South"))),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("fsaZones", {
      ...args.zone,
      fsa: args.zone.fsa.toUpperCase(),
      createdAt: now,
      updatedAt: now,
    });
    const zone = await ctx.db.get(id);
    return zoneFromDoc(zone);
  },
});

export const update = mutation({
  args: {
    id: v.id("fsaZones"),
    updates: v.object({
      fsa: v.optional(v.string()),
      city: v.optional(v.string()),
      province: v.optional(v.string()),
      tier: v.optional(v.union(v.literal("Tier 1"), v.literal("Tier 2"))),
      surcharge: v.optional(v.number()),
      status: v.optional(v.union(v.literal("active"), v.literal("pending"), v.literal("inactive"))),
      region: v.optional(v.union(v.literal("East"), v.literal("North"), v.literal("West"), v.literal("South"))),
      createdAt: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const { createdAt, ...updates } = args.updates;
    void createdAt;
    await ctx.db.patch(args.id, {
      ...updates,
      fsa: updates.fsa?.toUpperCase(),
      updatedAt: Date.now(),
    });
    const zone = await ctx.db.get(args.id);
    return zoneFromDoc(zone);
  },
});

export const remove = mutation({
  args: { id: v.id("fsaZones") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
