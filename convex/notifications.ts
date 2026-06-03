import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser } from "./lib/auth";

const notificationType = v.union(
  v.literal("listing"),
  v.literal("saved"),
  v.literal("agent"),
  v.literal("viewing"),
  v.literal("booking"),
  v.literal("system"),
);

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const limit = Math.min(Math.max(args.limit ?? 50, 1), 100);
    return await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(100);
    return rows.filter((row) => !row.read).length;
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    type: notificationType,
    title: v.string(),
    description: v.string(),
    path: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (user._id !== args.userId && user.role !== "admin") {
      throw new Error("Unauthorized");
    }
    await ctx.db.insert("notifications", {
      ...args,
      read: false,
      createdAt: Date.now(),
    });
  },
});

export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    const rows = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .take(100);
    await Promise.all(
      rows.filter((row) => !row.read).map((row) => ctx.db.patch(row._id, { read: true })),
    );
  },
});

export const markRead = mutation({
  args: { id: v.id("notifications") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const notification = await ctx.db.get(args.id);
    if (!notification || notification.userId !== user._id) return;
    await ctx.db.patch(args.id, { read: true });
  },
});
