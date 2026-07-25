import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin, requireIdentity, requireSelfOrAdmin, requireUser } from "./auth";

const LEGAL_VERSION = "2026-07-14";

const address = v.object({
  line1: v.string(),
  city: v.string(),
  province: v.string(),
  postalCode: v.string(),
});

const dog = v.object({
  name: v.string(),
  breed: v.string(),
  weight: v.number(),
  age: v.number(),
  energyLevel: v.string(),
  reactivityNotes: v.string(),
});

const vaccines = v.object({
  rabiesFileName: v.string(),
  dhppFileName: v.string(),
  vetName: v.string(),
  vetPhone: v.string(),
});

const userPatch = {
  name: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(address),
  dog: v.optional(dog),
  vaccines: v.optional(vaccines),
};

function text(value: string, max: number, label: string) {
  const clean = value.trim();
  if (clean.length > max) throw new Error(`${label} is too long.`);
  return clean;
}

function cleanAddress(value: typeof address.type) {
  return {
    line1: text(value.line1, 160, "Address"),
    city: text(value.city, 80, "City"),
    province: text(value.province, 40, "Province"),
    postalCode: text(value.postalCode, 12, "Postal code").toUpperCase(),
  };
}

function cleanDog(value: typeof dog.type) {
  if (value.weight < 0 || value.weight > 400) throw new Error("Dog weight is invalid.");
  if (value.age < 0 || value.age > 40) throw new Error("Dog age is invalid.");
  return {
    name: text(value.name, 80, "Dog name"),
    breed: text(value.breed, 100, "Breed"),
    weight: value.weight,
    age: value.age,
    energyLevel: text(value.energyLevel, 40, "Energy level"),
    reactivityNotes: text(value.reactivityNotes, 1500, "Reactivity notes"),
  };
}

function cleanVaccines(value: typeof vaccines.type) {
  return {
    rabiesFileName: text(value.rabiesFileName, 180, "Rabies file name"),
    dhppFileName: text(value.dhppFileName, 180, "DHPP file name"),
    vetName: text(value.vetName, 120, "Veterinarian name"),
    vetPhone: text(value.vetPhone, 40, "Veterinarian phone"),
  };
}

function userFromDoc(doc: any) {
  return {
    id: doc._id,
    email: doc.email,
    role: doc.role,
    name: doc.name,
    phone: doc.phone,
    address: doc.address,
    coordinates: doc.coordinates,
    dog: doc.dog,
    vaccines: doc.vaccines,
    legalAccepted: doc.legalAccepted,
    legalAcceptedAt: doc.legalAcceptedAt ? new Date(doc.legalAcceptedAt).toISOString() : null,
    legalVersion: doc.legalVersion,
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return (await ctx.db.query("users").collect()).map(userFromDoc);
  },
});

export const getById = query({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    await requireSelfOrAdmin(ctx, args.id);
    const user = await ctx.db.get(args.id);
    return user ? userFromDoc(user) : null;
  },
});

export const getOrCreateCurrent = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await requireIdentity(ctx);
    const rawEmail = identity.email || args.email;
    const email = rawEmail?.trim().toLowerCase();
    if (!email) throw new Error("A verified email address is required.");

    let user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", q => q.eq("authProviderUserId", identity.subject))
      .unique();
    if (user) {
      if (user.passwordHash || user.passwordSalt) {
        await ctx.db.patch(user._id, { passwordHash: undefined, passwordSalt: undefined, updatedAt: Date.now() });
        user = await ctx.db.get(user._id);
      }
      return userFromDoc(user);
    }

    user = await ctx.db.query("users").withIndex("by_email", q => q.eq("email", email)).unique();
    if (user) {
      if (user.authProviderUserId && user.authProviderUserId !== identity.subject) {
        throw new Error("This email is already linked to another identity.");
      }
      await ctx.db.patch(user._id, {
        authProviderUserId: identity.subject,
        passwordHash: undefined,
        passwordSalt: undefined,
        updatedAt: Date.now(),
      });
      return userFromDoc(await ctx.db.get(user._id));
    }

    const now = Date.now();
    const id = await ctx.db.insert("users", {
      authProviderUserId: identity.subject,
      email,
      role: "customer",
      name: text(args.name || identity.name || email.split("@")[0], 120, "Name"),
      phone: text(args.phone || "", 40, "Phone"),
      address: { line1: "", city: "", province: "", postalCode: "" },
      dog: { name: "", breed: "", weight: 0, age: 0, energyLevel: "", reactivityNotes: "" },
      vaccines: { rabiesFileName: "", dhppFileName: "", vetName: "", vetPhone: "" },
      legalAccepted: false,
      createdAt: now,
      updatedAt: now,
    });
    return userFromDoc(await ctx.db.get(id));
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    updates: v.object(userPatch),
  },
  handler: async (ctx, args) => {
    await requireSelfOrAdmin(ctx, args.id);
    if (!(await ctx.db.get(args.id))) throw new Error("User not found.");

    const updates = {
      ...(args.updates.name !== undefined && { name: text(args.updates.name, 120, "Name") }),
      ...(args.updates.phone !== undefined && { phone: text(args.updates.phone, 40, "Phone") }),
      ...(args.updates.address && { address: cleanAddress(args.updates.address) }),
      ...(args.updates.dog && { dog: cleanDog(args.updates.dog) }),
      ...(args.updates.vaccines && { vaccines: cleanVaccines(args.updates.vaccines) }),
      updatedAt: Date.now(),
    };
    await ctx.db.patch(args.id, updates);
    return userFromDoc(await ctx.db.get(args.id));
  },
});

export const acceptLegal = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    await ctx.db.insert("auditEvents", {
      actorUserId: user._id,
      action: "legal.accepted",
      entityType: "legalAgreement",
      entityId: LEGAL_VERSION,
      createdAt: now,
    });
    await ctx.db.patch(user._id, {
      legalAccepted: true,
      legalAcceptedAt: now,
      legalVersion: LEGAL_VERSION,
      updatedAt: now,
    });
    return userFromDoc(await ctx.db.get(user._id));
  },
});
