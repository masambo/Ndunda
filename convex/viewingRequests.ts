import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUserOrNull, getCurrentUser } from "./lib/auth";

const viewingStatus = v.union(
  v.literal("pending"),
  v.literal("confirmed"),
  v.literal("declined"),
  v.literal("completed"),
);

export const create = mutation({
  args: {
    propertyId: v.id("properties"),
    name: v.string(),
    email: v.string(),
    phone: v.string(),
    notes: v.optional(v.string()),
    requestedDate: v.string(),
    requestedTime: v.string(),
  },
  handler: async (ctx, args) => {
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Property not found");
    const requester = await getCurrentUserOrNull(ctx);
    const now = Date.now();

    const requestId = await ctx.db.insert("viewingRequests", {
      propertyId: args.propertyId,
      ownerId: property.ownerId,
      requesterId: requester?._id,
      name: args.name.trim(),
      email: args.email.trim(),
      phone: args.phone.trim(),
      notes: args.notes?.trim() || undefined,
      requestedDate: args.requestedDate,
      requestedTime: args.requestedTime,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("notifications", {
      userId: property.ownerId,
      type: "viewing",
      title: "New viewing request",
      description: `${args.name.trim()} requested a viewing for ${property.title}.`,
      path: `/property/${args.propertyId}`,
      read: false,
      createdAt: now,
    });

    return requestId;
  },
});

export const listForOwner = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);
    const rows = await ctx.db
      .query("viewingRequests")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .order("desc")
      .take(limit);
    return await Promise.all(
      rows.map(async (row) => ({
        ...row,
        property: await ctx.db.get(row.propertyId),
      })),
    );
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id("viewingRequests"),
    status: viewingStatus,
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const request = await ctx.db.get(args.id);
    if (!request) throw new Error("Viewing request not found");
    if (request.ownerId !== user._id && user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});
