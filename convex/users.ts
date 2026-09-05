import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
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
  photoUrl: v.optional(v.string()),
});

const vaccines = v.object({
  rabiesFileName: v.string(),
  dhppFileName: v.string(),
  vetName: v.string(),
  vetPhone: v.string(),
  status: v.optional(v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected"))),
  verifiedAt: v.optional(v.union(v.string(), v.null())),
  verifiedBy: v.optional(v.union(v.string(), v.null())),
  documentUrl: v.optional(v.union(v.string(), v.null())),
  documentType: v.optional(v.union(v.string(), v.null())),
  storageId: v.optional(v.union(v.string(), v.null())),
});

const userPatch = {
  name: v.optional(v.string()),
  phone: v.optional(v.string()),
  address: v.optional(address),
  dog: v.optional(dog),
  vaccines: v.optional(vaccines),
  profileCompleted: v.optional(v.boolean()),
  profileSubmittedAt: v.optional(v.union(v.number(), v.null())),
  accountVerified: v.optional(v.boolean()),
  accountVerifiedAt: v.optional(v.union(v.number(), v.null())),
  accountVerifiedBy: v.optional(v.union(v.string(), v.null())),
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
    photoUrl: value.photoUrl ? text(value.photoUrl, 5000000, "Dog photo") : undefined,
  };
}

function cleanVaccines(value: typeof vaccines.type) {
  return {
    rabiesFileName: text(value.rabiesFileName, 180, "Rabies file name"),
    dhppFileName: text(value.dhppFileName, 180, "DHPP file name"),
    vetName: text(value.vetName, 120, "Veterinarian name"),
    vetPhone: text(value.vetPhone, 40, "Veterinarian phone"),
    status: value.status || "pending",
    verifiedAt: value.verifiedAt ?? null,
    verifiedBy: value.verifiedBy ?? null,
    documentUrl: value.documentUrl ?? null,
    documentType: value.documentType ?? null,
    storageId: value.storageId ?? null,
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
    profileCompleted: doc.profileCompleted ?? false,
    profileSubmittedAt: doc.profileSubmittedAt ? new Date(doc.profileSubmittedAt).toISOString() : null,
    accountVerified: doc.accountVerified ?? false,
    accountVerifiedAt: doc.accountVerifiedAt ? new Date(doc.accountVerifiedAt).toISOString() : null,
    accountVerifiedBy: doc.accountVerifiedBy ?? null,
    assignedSessionDate: doc.assignedSessionDate,
    assignedTimeSlot: doc.assignedTimeSlot,
    assignedNotes: doc.assignedNotes,
    callConfirmed: doc.callConfirmed ?? false,
    callConfirmedAt: doc.callConfirmedAt ? new Date(doc.callConfirmedAt).toISOString() : null,
    assignedBy: doc.assignedBy ?? null,
    hasPaid: doc.hasPaid ?? false,
    paidAt: doc.paidAt ? new Date(doc.paidAt).toISOString() : null,
    paidPlanName: doc.paidPlanName ?? null,
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

    const isPrivilegedAdmin = email === "zoomievan87@gmail.com" || email === "admin";

    let user = await ctx.db
      .query("users")
      .withIndex("by_auth_provider_user_id", q => q.eq("authProviderUserId", identity.subject))
      .unique();
    if (user) {
      const patches: Record<string, any> = {};
      if (isPrivilegedAdmin && user.role !== "admin") {
        patches.role = "admin";
      }
      if (user.passwordHash || user.passwordSalt) {
        patches.passwordHash = undefined;
        patches.passwordSalt = undefined;
      }
      if (Object.keys(patches).length > 0) {
        patches.updatedAt = Date.now();
        await ctx.db.patch(user._id, patches);
        const refreshed = await ctx.db.get(user._id);
        if (refreshed) user = refreshed;
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
        ...(isPrivilegedAdmin && user.role !== "admin" ? { role: "admin" } : {}),
      });
      const refreshed = await ctx.db.get(user._id);
      return userFromDoc(refreshed || user);
    }

    const now = Date.now();
    const resolvedName = text(args.name || identity.name || email.split("@")[0], 120, "Name");
    const id = await ctx.db.insert("users", {
      authProviderUserId: identity.subject,
      email,
      role: "customer",
      name: resolvedName,
      phone: text(args.phone || "", 40, "Phone"),
      address: { line1: "", city: "", province: "", postalCode: "" },
      dog: { name: "", breed: "", weight: 0, age: 0, energyLevel: "", reactivityNotes: "" },
      vaccines: { rabiesFileName: "", dhppFileName: "", vetName: "", vetPhone: "" },
      legalAccepted: false,
      createdAt: now,
      updatedAt: now,
    });
    if (isPrivilegedAdmin) {
      await ctx.db.patch(id, { role: "admin" });
    }

    // Mail 1: Friendly welcome & profile completion email on new user registration
    try {
      await ctx.scheduler.runAfter(0, internal.emails.sendWelcomeEmail, {
        to: email,
        userName: resolvedName,
      });
    } catch (schedErr) {
      console.error("[Email Scheduler] Failed to schedule welcome email:", schedErr);
    }

    return userFromDoc(await ctx.db.get(id));
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const update = mutation({
  args: {
    id: v.id("users"),
    updates: v.object(userPatch),
  },
  handler: async (ctx, args) => {
    await requireSelfOrAdmin(ctx, args.id);
    const user = await ctx.db.get(args.id);
    if (!user) throw new Error("User not found.");

    const now = Date.now();
    let cleanedVaccines = args.updates.vaccines ? cleanVaccines(args.updates.vaccines) : undefined;
    if (cleanedVaccines && cleanedVaccines.storageId) {
      try {
        const fileUrl = await ctx.storage.getUrl(cleanedVaccines.storageId as any);
        if (fileUrl) {
          cleanedVaccines.documentUrl = fileUrl;
        }
      } catch (err) {
        console.warn("Could not resolve storage URL:", err);
      }
    }

    const updates = {
      ...(args.updates.name !== undefined && { name: text(args.updates.name, 120, "Name") }),
      ...(args.updates.phone !== undefined && { phone: text(args.updates.phone, 40, "Phone") }),
      ...(args.updates.address && { address: cleanAddress(args.updates.address) }),
      ...(args.updates.dog && { dog: cleanDog(args.updates.dog) }),
      ...(cleanedVaccines && { vaccines: cleanedVaccines }),
      ...(args.updates.profileCompleted !== undefined && { profileCompleted: args.updates.profileCompleted }),
      ...(args.updates.profileSubmittedAt !== undefined && { profileSubmittedAt: args.updates.profileSubmittedAt }),
      ...(args.updates.accountVerified !== undefined && { accountVerified: args.updates.accountVerified }),
      ...(args.updates.accountVerifiedAt !== undefined && { accountVerifiedAt: args.updates.accountVerifiedAt }),
      ...(args.updates.accountVerifiedBy !== undefined && { accountVerifiedBy: args.updates.accountVerifiedBy }),
      updatedAt: now,
    };
    await ctx.db.patch(args.id, updates);

    // If vaccines were updated with a certificate, also ensure vaccineRecords queue has it
    if (cleanedVaccines && (cleanedVaccines.rabiesFileName || cleanedVaccines.documentUrl)) {
      const existingRecord = await ctx.db
        .query("vaccineRecords")
        .withIndex("by_user", q => q.eq("userId", args.id))
        .first();

      const recordData = {
        userId: args.id,
        dogName: (args.updates.dog?.name || user.dog?.name || "Dog"),
        ownerName: (args.updates.name || user.name),
        vaccineType: `Rabies + DHPP (${cleanedVaccines.rabiesFileName || "certificate"})`,
        submittedAt: now,
        status: cleanedVaccines.status || "pending",
        documentUrl: cleanedVaccines.documentUrl || undefined,
        documentType: cleanedVaccines.documentType || undefined,
        storageId: cleanedVaccines.storageId || undefined,
        updatedAt: now,
      };

      if (existingRecord) {
        await ctx.db.patch(existingRecord._id, recordData);
      } else {
        await ctx.db.insert("vaccineRecords", {
          ...recordData,
          createdAt: now,
        });
      }
    }

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

export const submitProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    await ctx.db.patch(user._id, {
      profileCompleted: true,
      profileSubmittedAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("auditEvents", {
      actorUserId: user._id,
      action: "profile.submitted",
      entityType: "user",
      entityId: user._id,
      metadata: { name: user.name, dogName: user.dog?.name },
      createdAt: now,
    });
    return userFromDoc(await ctx.db.get(user._id));
  },
});

export const verifyAccount = mutation({
  args: {
    userId: v.id("users"),
    verified: v.boolean(),
    assignedSessionDate: v.optional(v.string()),
    assignedTimeSlot: v.optional(v.string()),
    assignedNotes: v.optional(v.string()),
    callConfirmed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    await ctx.db.patch(args.userId, {
      accountVerified: args.verified,
      accountVerifiedAt: args.verified ? now : null,
      accountVerifiedBy: args.verified ? (admin.name || "Admin") : null,
      ...(args.assignedSessionDate !== undefined && { assignedSessionDate: args.assignedSessionDate }),
      ...(args.assignedTimeSlot !== undefined && { assignedTimeSlot: args.assignedTimeSlot }),
      ...(args.assignedNotes !== undefined && { assignedNotes: args.assignedNotes }),
      ...(args.callConfirmed !== undefined && {
        callConfirmed: args.callConfirmed,
        callConfirmedAt: args.callConfirmed ? now : null,
        assignedBy: admin.name || "Admin",
      }),
      updatedAt: now,
    });
    const targetUser = await ctx.db.get(args.userId);

    // If an admin has allotted a session date & time slot, automatically reflect it in the bookings table
    if (args.assignedSessionDate && args.assignedTimeSlot && targetUser) {
      const existingBooking = await ctx.db
        .query("bookings")
        .withIndex("by_user", q => q.eq("userId", args.userId))
        .first();

      if (existingBooking) {
        await ctx.db.patch(existingBooking._id, {
          date: args.assignedSessionDate,
          timeSlot: args.assignedTimeSlot,
          status: "scheduled",
          updatedAt: now,
        });
      } else if (targetUser.hasPaid) {
        await ctx.db.insert("bookings", {
          userId: args.userId,
          fsa: (targetUser.address?.postalCode || "").slice(0, 3).toUpperCase(),
          customerName: targetUser.name,
          dogName: targetUser.dog?.name || "Dog",
          date: args.assignedSessionDate,
          timeSlot: args.assignedTimeSlot,
          planName: targetUser.paidPlanName || "Slatmill Package",
          sessionFee: 70,
          surcharge: 0,
          status: "scheduled",
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    await ctx.db.insert("auditEvents", {
      actorUserId: admin._id,
      action: args.verified ? "account.verified" : "account.unverified",
      entityType: "user",
      entityId: args.userId,
      metadata: { targetUserName: targetUser?.name, sessionDate: args.assignedSessionDate, timeSlot: args.assignedTimeSlot },
      createdAt: now,
    });

    // Mail 2: Sent when admin verifies profile and requests payment
    if (args.verified && targetUser?.email) {
      try {
        await ctx.scheduler.runAfter(0, internal.emails.sendVerificationEmail, {
          to: targetUser.email,
          userName: targetUser.name || "Dog Parent",
          dogName: targetUser.dog?.name || "Your Dog",
          sessionDate: args.assignedSessionDate || targetUser.assignedSessionDate || undefined,
          timeSlot: args.assignedTimeSlot || targetUser.assignedTimeSlot || undefined,
        });
      } catch (schedErr) {
        console.error("[Email Scheduler] Failed to schedule verification email:", schedErr);
      }
    }

    return targetUser ? userFromDoc(targetUser) : null;
  },
});

export const deleteSelf = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);
    const now = Date.now();

    // Cancel any bookings
    const userBookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect();
    for (const b of userBookings) {
      if (b.status !== "completed") {
        await ctx.db.patch(b._id, { status: "cancelled", updatedAt: now });
      }
    }

    // Delete vaccineRecords
    const records = await ctx.db
      .query("vaccineRecords")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .collect();
    for (const r of records) {
      await ctx.db.delete(r._id);
    }

    await ctx.db.insert("auditEvents", {
      actorUserId: user._id,
      action: "account.deleted_by_user",
      entityType: "user",
      entityId: user._id,
      metadata: { email: user.email, name: user.name },
      createdAt: now,
    });

    await ctx.db.delete(user._id);
    return { success: true };
  },
});

export const remove = mutation({
  args: { id: v.id("users") },
  handler: async (ctx, args) => {
    const admin = await requireAdmin(ctx);
    const now = Date.now();
    const user = await ctx.db.get(args.id);
    if (!user) return;

    const userBookings = await ctx.db
      .query("bookings")
      .withIndex("by_user", q => q.eq("userId", args.id))
      .collect();
    for (const b of userBookings) {
      if (b.status !== "completed") {
        await ctx.db.patch(b._id, { status: "cancelled", updatedAt: now });
      }
    }

    await ctx.db.insert("auditEvents", {
      actorUserId: admin._id,
      action: "account.deleted_by_admin",
      entityType: "user",
      entityId: args.id,
      metadata: { email: user.email, name: user.name },
      createdAt: now,
    });

    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const setAdminRoleByEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanEmail = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", q => q.eq("email", cleanEmail))
      .unique();
    if (!user) {
      throw new Error(`User with email "${cleanEmail}" not found in Convex.`);
    }
    await ctx.db.patch(user._id, { role: "admin", updatedAt: Date.now() });
    const refreshed = await ctx.db.get(user._id);
    return refreshed ? userFromDoc(refreshed) : null;
  },
});

export const recordPaymentSuccess = mutation({
  args: {
    planName: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);
    const now = Date.now();
    const isTrialOrFounding = args.planName.toLowerCase().includes("trial") || args.planName.toLowerCase().includes("founding");
    const paymentAmountCents = isTrialOrFounding ? 7000 : 3500;
    const paymentAmountDollars = paymentAmountCents / 100;

    await ctx.db.patch(user._id, {
      hasPaid: true,
      paidAt: now,
      paidPlanName: args.planName,
      updatedAt: now,
    });

    // Ensure payment is tracked in the payments table for admin reporting
    const existingPayment = await ctx.db
      .query("payments")
      .withIndex("by_user", q => q.eq("userId", user._id))
      .filter(q => q.eq(q.field("status"), "paid"))
      .first();

    if (!existingPayment) {
      await ctx.db.insert("payments", {
        userId: user._id,
        bookingIds: [],
        sessions: user.assignedSessionDate && user.assignedTimeSlot ? [{ date: user.assignedSessionDate, timeSlot: user.assignedTimeSlot }] : [],
        stripeCheckoutSessionId: `cs_dashboard_${now}_${user._id.slice(-6)}`,
        planKey: isTrialOrFounding ? "trial_run" : "single_run",
        planName: args.planName,
        amountCents: paymentAmountCents,
        currency: "cad",
        customerEmail: user.email,
        isFoundingMember: isTrialOrFounding,
        sessionsCount: isTrialOrFounding ? 3 : 1,
        status: "paid",
        createdAt: now,
        updatedAt: now,
      });
    }

    if (user.assignedSessionDate && user.assignedTimeSlot) {
      const existingBooking = await ctx.db
        .query("bookings")
        .withIndex("by_user", q => q.eq("userId", user._id))
        .first();

      if (existingBooking) {
        await ctx.db.patch(existingBooking._id, {
          sessionFee: paymentAmountDollars,
          planName: args.planName,
          status: "scheduled",
          updatedAt: now,
        });
      } else {
        await ctx.db.insert("bookings", {
          userId: user._id,
          fsa: (user.address?.postalCode || "").slice(0, 3).toUpperCase(),
          customerName: user.name,
          dogName: user.dog?.name || "Dog",
          date: user.assignedSessionDate,
          timeSlot: user.assignedTimeSlot,
          planName: args.planName,
          sessionFee: paymentAmountDollars,
          surcharge: 0,
          status: "scheduled",
          createdAt: now,
          updatedAt: now,
        });
      }
    }
    await ctx.db.insert("auditEvents", {
      actorUserId: user._id,
      action: "payment.completed",
      entityType: "user",
      entityId: user._id,
      metadata: { planName: args.planName, sessionDate: user.assignedSessionDate },
      createdAt: now,
    });

    // Mail 3: Order & Booking Confirmation Email
    if (user.email) {
      const fullAddress = user.address?.line1
        ? `${user.address.line1}, ${user.address.city || ""} ${user.address.province || ""} ${user.address.postalCode || ""}`.trim()
        : undefined;

      try {
        await ctx.scheduler.runAfter(0, internal.emails.sendOrderConfirmationEmail, {
          to: user.email,
          userName: user.name || "Dog Parent",
          dogName: user.dog?.name || "Your Dog",
          planName: args.planName || "Founding Member Trial Run (3 Sessions)",
          amountPaid: "$70.00 CAD",
          sessionDate: user.assignedSessionDate || undefined,
          timeSlot: user.assignedTimeSlot || undefined,
          address: fullAddress,
        });
      } catch (schedErr) {
        console.error("[Email Scheduler] Failed to schedule order confirmation email:", schedErr);
      }
    }

    return userFromDoc(await ctx.db.get(user._id));
  },
});
