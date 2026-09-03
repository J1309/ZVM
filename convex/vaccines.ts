import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./auth";

function vaccineFromDoc(doc: any) {
  return {
    id: doc._id,
    dogName: doc.dogName,
    ownerName: doc.ownerName,
    vaccineType: doc.vaccineType,
    submittedAt: new Date(doc.submittedAt).toISOString(),
    status: doc.status,
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const records = await ctx.db.query("vaccineRecords").collect();
    return records.map(vaccineFromDoc);
  },
});

export const add = mutation({
  args: {
    record: v.object({
      dogName: v.string(),
      ownerName: v.string(),
      vaccineType: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    const id = await ctx.db.insert("vaccineRecords", {
      ...args.record,
      submittedAt: now,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });
    const record = await ctx.db.get(id);
    return vaccineFromDoc(record);
  },
});

export const approve = mutation({
  args: { id: v.id("vaccineRecords") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    await ctx.db.patch(args.id, { status: "approved", reviewedBy: admin._id, reviewedAt: now, updatedAt: now });
    const record = await ctx.db.get(args.id);

    // Sync to user record if linked
    if (record?.userId) {
      const user = await ctx.db.get(record.userId);
      if (user) {
        await ctx.db.patch(user._id, {
          vaccines: {
            ...user.vaccines,
            status: "approved",
            verifiedAt: new Date(now).toISOString(),
            verifiedBy: admin.name || "Admin",
          },
          updatedAt: now,
        });
      }
    }

    await ctx.db.insert("auditEvents", {
      actorUserId: admin._id,
      action: "vaccine.approved",
      entityType: "vaccineRecord",
      entityId: args.id,
      metadata: { dogName: record?.dogName, ownerName: record?.ownerName },
      createdAt: now,
    });

    return vaccineFromDoc(record);
  },
});

export const reject = mutation({
  args: { id: v.id("vaccineRecords") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    await ctx.db.patch(args.id, { status: "rejected", reviewedBy: admin._id, reviewedAt: now, updatedAt: now });
    const record = await ctx.db.get(args.id);

    // Sync to user record if linked
    if (record?.userId) {
      const user = await ctx.db.get(record.userId);
      if (user) {
        await ctx.db.patch(user._id, {
          vaccines: {
            ...user.vaccines,
            status: "rejected",
            verifiedAt: null,
            verifiedBy: admin.name || "Admin",
          },
          updatedAt: now,
        });
      }
    }

    await ctx.db.insert("auditEvents", {
      actorUserId: admin._id,
      action: "vaccine.rejected",
      entityType: "vaccineRecord",
      entityId: args.id,
      metadata: { dogName: record?.dogName, ownerName: record?.ownerName },
      createdAt: now,
    });

    return vaccineFromDoc(record);
  },
});

export const remove = mutation({
  args: { id: v.id("vaccineRecords") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.id);
  },
});
