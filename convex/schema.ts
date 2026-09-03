import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const timestampFields = {
  createdAt: v.number(),
  updatedAt: v.number(),
};

const address = v.object({
  line1: v.string(),
  city: v.string(),
  province: v.string(),
  postalCode: v.string(),
});

const dogProfile = v.object({
  name: v.string(),
  breed: v.string(),
  weight: v.number(),
  age: v.number(),
  energyLevel: v.string(),
  reactivityNotes: v.string(),
});

const vaccineProfile = v.object({
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

export default defineSchema({
  users: defineTable({
    authProviderUserId: v.optional(v.string()),
    email: v.string(),
    passwordHash: v.optional(v.string()),
    passwordSalt: v.optional(v.string()),
    name: v.string(),
    phone: v.string(),
    role: v.union(v.literal("customer"), v.literal("admin")),
    address,
    coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    dog: dogProfile,
    vaccines: vaccineProfile,
    legalAccepted: v.boolean(),
    legalAcceptedAt: v.optional(v.number()),
    legalVersion: v.optional(v.string()),
    profileCompleted: v.optional(v.boolean()),
    profileSubmittedAt: v.optional(v.union(v.number(), v.null())),
    accountVerified: v.optional(v.boolean()),
    accountVerifiedAt: v.optional(v.union(v.number(), v.null())),
    accountVerifiedBy: v.optional(v.union(v.string(), v.null())),
    ...timestampFields,
  })
    .index("by_email", ["email"])
    .index("by_auth_provider_user_id", ["authProviderUserId"])
    .index("by_role", ["role"]),

  fsaZones: defineTable({
    fsa: v.string(),
    city: v.string(),
    province: v.string(),
    tier: v.union(v.literal("Tier 1"), v.literal("Tier 2")),
    surcharge: v.number(),
    status: v.union(v.literal("active"), v.literal("pending"), v.literal("inactive")),
    region: v.optional(v.union(v.literal("East"), v.literal("North"), v.literal("West"), v.literal("South"))),
    ...timestampFields,
  })
    .index("by_fsa", ["fsa"])
    .index("by_status", ["status"]),

  fleetVans: defineTable({
    name: v.string(),
    status: v.union(v.literal("Active"), v.literal("Maintenance"), v.literal("Offline")),
    location: v.string(),
    sessionsToday: v.number(),
    totalSessions: v.number(),
    ...timestampFields,
  }).index("by_status", ["status"]),

  vaccineRecords: defineTable({
    userId: v.optional(v.id("users")),
    dogName: v.string(),
    ownerName: v.string(),
    vaccineType: v.string(),
    submittedAt: v.number(),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    documentUrl: v.optional(v.string()),
    documentType: v.optional(v.string()),
    storageId: v.optional(v.string()),
    ...timestampFields,
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  bookings: defineTable({
    userId: v.optional(v.id("users")),
    vanId: v.optional(v.string()),
    fsa: v.string(),
    customerName: v.string(),
    dogName: v.string(),
    date: v.string(),
    timeSlot: v.optional(v.string()),
    planName: v.optional(v.string()),
    sessionFee: v.number(),
    surcharge: v.number(),
    coordinates: v.optional(v.object({ lat: v.number(), lng: v.number() })),
    status: v.union(v.literal("completed"), v.literal("cancelled"), v.literal("scheduled"), v.literal("pending_payment")),
    ...timestampFields,
  })
    .index("by_user", ["userId"])
    .index("by_date", ["date"])
    .index("by_date_slot", ["date", "timeSlot"])
    .index("by_status", ["status"]),

  payments: defineTable({
    userId: v.optional(v.id("users")),
    bookingIds: v.optional(v.array(v.id("bookings"))),
    sessions: v.optional(v.array(v.object({ date: v.string(), timeSlot: v.string() }))),
    stripeCheckoutSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    planKey: v.string(),
    planName: v.string(),
    amountCents: v.number(),
    currency: v.string(),
    customerEmail: v.string(),
    // Founding Member claims get a bonus session at the normal price. Recorded
    // per-payment so the admin count stays accurate after the offer ends.
    isFoundingMember: v.optional(v.boolean()),
    sessionsCount: v.optional(v.number()),
    status: v.union(
      v.literal("checkout_created"),
      v.literal("paid"),
      v.literal("cancelled"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    ...timestampFields,
  })
    .index("by_user", ["userId"])
    .index("by_checkout_session", ["stripeCheckoutSessionId"])
    .index("by_status", ["status"]),

  cmsSettings: defineTable({
    heroTagline: v.string(),
    baseSessionRate: v.number(),
    weeklyPackRate: v.number(),
    eightPackRate: v.number(),
    emergencyBannerText: v.string(),
    emergencyBannerActive: v.boolean(),
    // Admin kill-switch for the Founding Member offer, independent of the cap.
    foundingOfferClosed: v.optional(v.boolean()),
    ...timestampFields,
  }),

  auditEvents: defineTable({
    actorUserId: v.optional(v.id("users")),
    action: v.string(),
    entityType: v.string(),
    entityId: v.optional(v.string()),
    metadata: v.optional(v.any()),
    createdAt: v.number(),
  })
    .index("by_actor", ["actorUserId"])
    .index("by_entity", ["entityType", "entityId"]),
});
