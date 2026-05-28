import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    tokenIdentifier: v.string(),
    clerkUserId: v.string(),
    email: v.string(),
    fullName: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    coverPhotoUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    bio: v.optional(v.string()),
    agencyName: v.optional(v.string()),
    specialty: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
    idDocumentUrl: v.optional(v.string()),
    idDocumentName: v.optional(v.string()),
    businessRegistrationUrl: v.optional(v.string()),
    businessRegistrationName: v.optional(v.string()),
    taxCertificateUrl: v.optional(v.string()),
    taxCertificateName: v.optional(v.string()),
    agentStatus: v.optional(
      v.union(v.literal("none"), v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    ),
    agentAppliedAt: v.optional(v.number()),
    agentReviewedAt: v.optional(v.number()),
    role: v.union(
      v.literal("customer"),
      v.literal("agent"),
      v.literal("admin"),
    ),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_token", ["tokenIdentifier"])
    .index("by_clerk_user", ["clerkUserId"])
    .index("by_role", ["role"])
    .index("by_agent_status", ["agentStatus"]),
  properties: defineTable({
    ownerId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.string(),
    fullAddress: v.optional(v.string()),
    type: v.union(
      v.literal("room"),
      v.literal("house"),
      v.literal("plot"),
      v.literal("apartment"),
      v.literal("guesthouse"),
      v.literal("hotel"),
      v.literal("lodge"),
      v.literal("camp"),
      v.literal("lodges-camps"),
      v.literal("office-space"),
      v.literal("student-accommodation"),
      v.literal("commercial"),
      v.literal("airbnb"),
      v.literal("mbashu"),
    ),
    listingMode: v.union(v.literal("buy"), v.literal("rent")),
    rentalType: v.union(v.literal("long-term"), v.literal("short-term")),
    price: v.number(),
    bedrooms: v.number(),
    bathrooms: v.number(),
    size: v.optional(v.number()),
    images: v.array(v.string()),
    verified: v.boolean(),
    recommended: v.optional(v.boolean()),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),
      v.literal("sold"),
      v.literal("rented"),
      v.literal("inactive"),
    ),
    isNew: v.boolean(),
    availableFrom: v.optional(v.string()),
    deposit: v.optional(v.number()),
    leaseTerm: v.optional(v.string()),
    petsAllowed: v.boolean(),
    furnished: v.boolean(),
    dailyPrice: v.optional(v.number()),
    weeklyPrice: v.optional(v.number()),
    monthlyPrice: v.optional(v.number()),
    minimumStay: v.optional(v.number()),
    maxGuests: v.optional(v.number()),
    cleaningFee: v.optional(v.number()),
    checkInTime: v.optional(v.string()),
    checkOutTime: v.optional(v.string()),
    instantBook: v.boolean(),
    cancellationPolicy: v.optional(
      v.union(v.literal("flexible"), v.literal("moderate"), v.literal("strict")),
    ),
    views: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner", ["ownerId"])
    .index("by_owner_status", ["ownerId", "status"])
    .index("by_status", ["status"])
    .index("by_listing_mode", ["listingMode"])
    .index("by_type", ["type"]),
  savedProperties: defineTable({
    userId: v.id("users"),
    propertyId: v.id("properties"),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_property", ["userId", "propertyId"]),
});
