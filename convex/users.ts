import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, getCurrentUserOrNull } from "./lib/auth";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const builtInAdminEmails = ["yammertaurus@gmail.com"];

function isAdminEmail(email: string) {
  const configuredAdminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return [...builtInAdminEmails, ...configuredAdminEmails]
    .includes(email.toLowerCase());
}

function normalizeEmail(email?: string) {
  return (email ?? "").trim().toLowerCase();
}

function isAdminIdentity(email?: string) {
  return isAdminEmail(normalizeEmail(email));
}

async function requireAdmin(ctx: Parameters<typeof getCurrentUser>[0]) {
  const admin = await getCurrentUser(ctx);
  if (admin.role !== "admin" && !isAdminEmail(admin.email)) throw new Error("Unauthorized");
  return admin;
}

function isDataUrl(value?: string) {
  return Boolean(value?.startsWith("data:"));
}

function approximateBytes(value?: string) {
  return value ? new TextEncoder().encode(value).length : 0;
}

async function resolveStoredFileUrl(ctx: QueryCtx | MutationCtx, value?: string) {
  if (
    !value ||
    value.startsWith("data:") ||
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("/")
  ) {
    return value;
  }

  try {
    return (await ctx.storage.getUrl(value as Id<"_storage">)) ?? value;
  } catch {
    return value;
  }
}

async function withResolvedAgentDocuments(ctx: QueryCtx | MutationCtx, user: Doc<"users">) {
  return {
    ...user,
    coverPhotoUrl: await resolveStoredFileUrl(ctx, user.coverPhotoUrl),
    idDocumentUrl: await resolveStoredFileUrl(ctx, user.idDocumentUrl),
    businessRegistrationUrl: await resolveStoredFileUrl(ctx, user.businessRegistrationUrl),
    taxCertificateUrl: await resolveStoredFileUrl(ctx, user.taxCertificateUrl),
  };
}

export const store = mutation({
  args: {
    email: v.optional(v.string()),
    fullName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const clerkUserId = identity.subject;
    const email = normalizeEmail(identity.email || args.email);
    const fullName = identity.name ?? args.fullName ?? undefined;
    const avatarUrl = identity.pictureUrl ?? args.avatarUrl ?? undefined;
    const isAdmin = isAdminIdentity(email);

    const existing = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier),
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        email,
        fullName: fullName ?? existing.fullName,
        avatarUrl: avatarUrl ?? existing.avatarUrl,
        ...(isAdmin ? { role: "admin" as const } : {}),
        updatedAt: Date.now(),
      });
      return existing._id;
    }

    return await ctx.db.insert("users", {
      tokenIdentifier: identity.tokenIdentifier,
      clerkUserId,
      email,
      fullName,
      avatarUrl,
      role: isAdmin ? "admin" : "customer",
      agentStatus: "none",
      createdAt: Date.now(),
    });
  },
});

export const current = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrNull(ctx);
    return user ? withResolvedAgentDocuments(ctx, user) : null;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const authDiagnostics = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return {
        authenticated: false,
        user: null,
        identity: null,
      };
    }

    const user = await getCurrentUserOrNull(ctx);
    return {
      authenticated: true,
      user,
      identity: {
        subject: identity.subject,
        email: identity.email ?? null,
        name: identity.name ?? null,
        tokenIdentifier: identity.tokenIdentifier,
      },
    };
  },
});

export const updateProfile = mutation({
  args: {
    fullName: v.optional(v.string()),
    phone: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    coverPhotoUrl: v.optional(v.string()),
    location: v.optional(v.string()),
    bio: v.optional(v.string()),
    agencyName: v.optional(v.string()),
    specialty: v.optional(v.string()),
    whatsapp: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (isDataUrl(args.avatarUrl) || isDataUrl(args.coverPhotoUrl)) {
      throw new Error("Images must be uploaded before saving your profile.");
    }
    await ctx.db.patch(user._id, {
      ...(args.fullName !== undefined ? { fullName: args.fullName } : {}),
      ...(args.phone !== undefined ? { phone: args.phone } : {}),
      ...(args.avatarUrl !== undefined ? { avatarUrl: args.avatarUrl } : {}),
      ...(args.coverPhotoUrl !== undefined ? { coverPhotoUrl: args.coverPhotoUrl } : {}),
      ...(args.location !== undefined ? { location: args.location } : {}),
      ...(args.bio !== undefined ? { bio: args.bio } : {}),
      ...(args.agencyName !== undefined ? { agencyName: args.agencyName } : {}),
      ...(args.specialty !== undefined ? { specialty: args.specialty } : {}),
      ...(args.whatsapp !== undefined ? { whatsapp: args.whatsapp } : {}),
      updatedAt: Date.now(),
    });
    return user._id;
  },
});

export const adminImageStorageReport = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const limit = Math.min(Math.max(args.limit ?? 500, 1), 1000);
    const users = await ctx.db.query("users").take(limit);
    const fields = [
      "avatarUrl",
      "coverPhotoUrl",
      "idDocumentUrl",
      "businessRegistrationUrl",
      "taxCertificateUrl",
    ] as const;
    let affectedUsers = 0;
    let base64Fields = 0;
    let approximateBase64Bytes = 0;

    for (const user of users) {
      let userAffected = false;
      for (const field of fields) {
        const value = user[field];
        if (!isDataUrl(value)) continue;
        userAffected = true;
        base64Fields += 1;
        approximateBase64Bytes += approximateBytes(value);
      }
      if (userAffected) affectedUsers += 1;
    }

    return {
      scannedUsers: users.length,
      affectedUsers,
      base64Fields,
      approximateBase64Bytes,
      approximateBase64Megabytes: Number((approximateBase64Bytes / 1024 / 1024).toFixed(2)),
    };
  },
});

export const adminClearBase64Images = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    includeAgentDocuments: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const dryRun = args.dryRun ?? true;
    const limit = Math.min(Math.max(args.limit ?? 500, 1), 1000);
    const users = await ctx.db.query("users").take(limit);
    const fields = [
      "avatarUrl",
      "coverPhotoUrl",
      ...(args.includeAgentDocuments
        ? (["idDocumentUrl", "businessRegistrationUrl", "taxCertificateUrl"] as const)
        : []),
    ] as const;
    let affectedUsers = 0;
    let clearedFields = 0;
    let approximateBytesRemoved = 0;

    for (const user of users) {
      const patch: Partial<Pick<
        Doc<"users">,
        "avatarUrl" | "coverPhotoUrl" | "idDocumentUrl" | "businessRegistrationUrl" | "taxCertificateUrl" | "updatedAt"
      >> = {};

      for (const field of fields) {
        const value = user[field];
        if (!isDataUrl(value)) continue;
        patch[field] = "";
        clearedFields += 1;
        approximateBytesRemoved += approximateBytes(value);
      }

      if (Object.keys(patch).length === 0) continue;
      affectedUsers += 1;
      if (!dryRun) {
        await ctx.db.patch(user._id, {
          ...patch,
          updatedAt: Date.now(),
        });
      }
    }

    return {
      dryRun,
      scannedUsers: users.length,
      affectedUsers,
      clearedFields,
      approximateBytesRemoved,
      approximateMegabytesRemoved: Number((approximateBytesRemoved / 1024 / 1024).toFixed(2)),
    };
  },
});

export const applyAsAgent = mutation({
  args: {
    fullName: v.string(),
    phone: v.string(),
    location: v.string(),
    agencyName: v.optional(v.string()),
    specialty: v.string(),
    bio: v.string(),
    whatsapp: v.optional(v.string()),
    idDocumentUrl: v.string(),
    idDocumentName: v.string(),
    businessRegistrationUrl: v.optional(v.string()),
    businessRegistrationName: v.optional(v.string()),
    taxCertificateUrl: v.optional(v.string()),
    taxCertificateName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const now = Date.now();
    await ctx.db.patch(user._id, {
      fullName: args.fullName,
      phone: args.phone,
      location: args.location,
      agencyName: args.agencyName,
      specialty: args.specialty,
      bio: args.bio,
      whatsapp: args.whatsapp,
      idDocumentUrl: args.idDocumentUrl,
      idDocumentName: args.idDocumentName,
      businessRegistrationUrl: args.businessRegistrationUrl,
      businessRegistrationName: args.businessRegistrationName,
      taxCertificateUrl: args.taxCertificateUrl,
      taxCertificateName: args.taxCertificateName,
      agentStatus: "pending",
      agentAppliedAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "agent",
      title: "Agent application submitted",
      description: "Your application is under review by the Ndunda admin team.",
      path: "/profile",
      read: false,
      createdAt: now,
    });
    return user._id;
  },
});

export const approveAgent = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    await ctx.db.patch(args.userId, {
      role: "agent",
      agentStatus: "approved",
      agentReviewedAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "agent",
      title: "Agent application approved",
      description: "You can now access verified agent tools and publish verified listings.",
      path: "/agent-dashboard",
      read: false,
      createdAt: now,
    });
  },
});

export const rejectAgent = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const now = Date.now();
    await ctx.db.patch(args.userId, {
      agentStatus: "rejected",
      agentReviewedAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("notifications", {
      userId: args.userId,
      type: "agent",
      title: "Agent application update",
      description: "Your application was reviewed. Please contact support for details.",
      path: "/profile",
      read: false,
      createdAt: now,
    });
  },
});

export const setUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(v.literal("customer"), v.literal("agent"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.patch(args.userId, {
      role: args.role,
      ...(args.role === "agent"
        ? { agentStatus: "approved" as const, agentReviewedAt: Date.now() }
        : {}),
      ...(args.role === "customer"
        ? { agentStatus: "none" as const }
        : {}),
      updatedAt: Date.now(),
    });
  },
});

export const listAgents = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "agent"))
      .collect();
    return await Promise.all(agents.map(async (agent) => ({
      ...agent,
      listingCount: (
        await ctx.db
          .query("properties")
          .withIndex("by_owner_status", (q) => q.eq("ownerId", agent._id).eq("status", "active"))
          .take(100)
      ).length,
    })));
  },
});

export const featuredAgents = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(Math.max(args.limit ?? 4, 1), 8);
    const agents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "agent"))
      .take(limit);

    return await Promise.all(agents.map(async (agent) => ({
      ...agent,
      listingCount: (
        await ctx.db
          .query("properties")
          .withIndex("by_owner_status", (q) => q.eq("ownerId", agent._id).eq("status", "active"))
          .take(100)
      ).length,
    })));
  },
});

export const adminOverview = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getCurrentUserOrNull(ctx);
    if (!admin || (admin.role !== "admin" && !isAdminEmail(admin.email))) {
      return null;
    }
    const [users, pendingAgents, properties] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db
        .query("users")
        .withIndex("by_agent_status", (q) => q.eq("agentStatus", "pending"))
        .collect(),
      ctx.db.query("properties").collect(),
    ]);
    const propertiesWithOwners = await Promise.all(
      properties.map(async (property) => ({
        ...property,
        images: await Promise.all(
          property.images.map(async (image) => (await resolveStoredFileUrl(ctx, image)) ?? image),
        ),
        owner: await ctx.db.get(property.ownerId),
      })),
    );
    return {
      users: await Promise.all(users.map((user) => withResolvedAgentDocuments(ctx, user))),
      pendingAgents: await Promise.all(pendingAgents.map((user) => withResolvedAgentDocuments(ctx, user))),
      properties: propertiesWithOwners,
      stats: {
        users: users.length,
        agents: users.filter((user) => user.role === "agent").length,
        admins: users.filter((user) => user.role === "admin").length,
        customers: users.filter((user) => user.role === "customer").length,
        pendingAgents: pendingAgents.length,
        properties: properties.length,
        activeProperties: properties.filter((property) => property.status === "active").length,
        pendingProperties: properties.filter((property) => property.status === "pending").length,
        verifiedProperties: properties.filter((property) => property.verified).length,
        totalPropertyValue: properties.reduce((sum, property) => sum + property.price, 0),
      },
    };
  },
});

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrNull(ctx);
    if (!user) {
      return { savedProperties: 0, listings: 0, bookings: 0 };
    }
    const [savedProperties, listings] = await Promise.all([
      ctx.db
        .query("savedProperties")
        .withIndex("by_user", (q) => q.eq("userId", user._id))
        .collect(),
      ctx.db
        .query("properties")
        .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
        .collect(),
    ]);
    return {
      savedProperties: savedProperties.length,
      listings: listings.length,
      bookings: 0,
    };
  },
});
