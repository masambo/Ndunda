import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";

const bookingStatus = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("declined"),
  v.literal("cancelled"),
);

export const create = mutation({
  args: {
    propertyId: v.id("properties"),
    checkIn: v.string(),
    checkOut: v.string(),
    guests: v.number(),
    nights: v.number(),
    subtotal: v.number(),
    cleaningFee: v.number(),
    serviceFee: v.number(),
    total: v.number(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Property not found");
    if (property.ownerId === user._id) throw new Error("You cannot book your own listing.");
    if (property.rentalType !== "short-term") {
      throw new Error("Bookings are only available for short-term rentals.");
    }
    const now = Date.now();
    const status = property.instantBook ? "confirmed" : "pending";

    const bookingId = await ctx.db.insert("bookings", {
      propertyId: args.propertyId,
      ownerId: property.ownerId,
      requesterId: user._id,
      checkIn: args.checkIn,
      checkOut: args.checkOut,
      guests: args.guests,
      nights: args.nights,
      subtotal: args.subtotal,
      cleaningFee: args.cleaningFee,
      serviceFee: args.serviceFee,
      total: args.total,
      status,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("notifications", {
      userId: property.ownerId,
      type: "booking",
      title: property.instantBook ? "New confirmed booking" : "New booking request",
      description: `${user.fullName || user.email} requested ${property.title}.`,
      path: `/property/${args.propertyId}`,
      read: false,
      createdAt: now,
    });

    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "booking",
      title: property.instantBook ? "Booking confirmed" : "Booking request sent",
      description: `${property.title} from ${args.checkIn} to ${args.checkOut}.`,
      path: `/property/${args.propertyId}`,
      read: false,
      createdAt: now,
    });

    return bookingId;
  },
});

export const listForOwner = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);
    const rows = await ctx.db
      .query("bookings")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .take(limit);
    return await Promise.all(
      rows.map(async (row) => ({
        ...row,
        property: await ctx.db.get(row.propertyId),
        requester: await ctx.db.get(row.requesterId),
      })),
    );
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("bookings"),
    status: bookingStatus,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const booking = await ctx.db.get(args.id);
    if (!booking) throw new Error("Booking not found");
    if (booking.ownerId !== user._id && user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const leadStats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const [bookings, viewings] = await Promise.all([
      ctx.db.query("bookings").withIndex("by_owner", (q) => q.eq("ownerId", user._id)).take(100),
      ctx.db.query("viewingRequests").withIndex("by_owner", (q) => q.eq("ownerId", user._id)).take(100),
    ]);

    return {
      newLeads:
        bookings.filter((booking) => booking.status === "pending").length +
        viewings.filter((viewing) => viewing.status === "pending").length,
      bookings: bookings.length,
      viewings: viewings.length,
    };
  },
});
