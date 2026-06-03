import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";

export const listForProperty = query({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_property", (q) => q.eq("propertyId", args.propertyId))
      .order("desc")
      .take(100);

    return await Promise.all(
      reviews.map(async (review) => ({
        ...review,
        user: await ctx.db.get(review.userId),
      })),
    );
  },
});

export const createOrUpdate = mutation({
  args: {
    propertyId: v.id("properties"),
    rating: v.number(),
    comment: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const property = await ctx.db.get(args.propertyId);
    if (!property) throw new Error("Property not found");
    if (property.ownerId === user._id) {
      throw new Error("You cannot review your own listing.");
    }
    const rating = Math.min(Math.max(Math.round(args.rating), 1), 5);
    const comment = args.comment.trim();
    if (!comment) throw new Error("Please add a review comment.");

    const existing = await ctx.db
      .query("reviews")
      .withIndex("by_user_property", (q) => q.eq("userId", user._id).eq("propertyId", args.propertyId))
      .unique();
    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        rating,
        comment,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("reviews", {
      propertyId: args.propertyId,
      userId: user._id,
      rating,
      comment,
      createdAt: now,
      updatedAt: now,
    });
  },
});
