import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { getCurrentUser, getCurrentUserOrNull } from "./lib/auth";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const propertyType = v.union(
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
);

const rentalType = v.union(v.literal("long-term"), v.literal("short-term"));
const listingMode = v.union(v.literal("buy"), v.literal("rent"));
const status = v.union(
  v.literal("active"),
  v.literal("pending"),
  v.literal("sold"),
  v.literal("rented"),
  v.literal("inactive"),
);

const builtInAdminEmails = ["yammertaurus@gmail.com"];

function isAdminEmail(email: string) {
  const configuredAdminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return [...builtInAdminEmails, ...configuredAdminEmails].includes(email.toLowerCase());
}

async function requirePropertyAdmin(ctx: Parameters<typeof getCurrentUser>[0]) {
  const user = await getCurrentUser(ctx);
  if (user.role !== "admin" && !isAdminEmail(user.email)) {
    throw new Error("Unauthorized");
  }
  return user;
}

const filters = {
  query: v.optional(v.string()),
  listingMode: v.optional(listingMode),
  type: v.optional(v.string()),
  rentalType: v.optional(rentalType),
  minPrice: v.optional(v.number()),
  maxPrice: v.optional(v.number()),
  bedrooms: v.optional(v.number()),
  bathrooms: v.optional(v.number()),
  verified: v.optional(v.boolean()),
  location: v.optional(v.string()),
  status: v.optional(v.string()),
  limit: v.optional(v.number()),
};

type FilterArgs = {
  query?: string;
  listingMode?: "buy" | "rent";
  type?: string;
  rentalType?: "long-term" | "short-term";
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  verified?: boolean;
  location?: string;
  status?: string;
  limit?: number;
};

const propertyTypes = [
  "room",
  "house",
  "plot",
  "apartment",
  "guesthouse",
  "hotel",
  "lodge",
  "camp",
  "lodges-camps",
  "office-space",
  "student-accommodation",
  "commercial",
  "airbnb",
  "mbashu",
] as const;

const statuses = ["active", "pending", "sold", "rented", "inactive"] as const;
type PropertyTypeValue = (typeof propertyTypes)[number];
type StatusValue = (typeof statuses)[number];

function isDataUrl(value: string) {
  return value.startsWith("data:");
}

function approximateBytes(value: string) {
  return new TextEncoder().encode(value).length;
}

function isPropertyTypeValue(value: string | undefined): value is PropertyTypeValue {
  return Boolean(value && (propertyTypes as readonly string[]).includes(value));
}

function isSimpleTypeFilter(value: string | undefined): value is PropertyTypeValue {
  return isPropertyTypeValue(value) && !["office-space", "student-accommodation", "lodges-camps"].includes(value);
}

function isStatusValue(value: string | undefined): value is StatusValue {
  return Boolean(value && (statuses as readonly string[]).includes(value));
}

function normalizeTypeFilter(type?: string) {
  if (!type) return undefined;
  const normalized = type.trim().toLowerCase();
  const aliases: Record<string, string> = {
    houses: "house",
    flat: "apartment",
    flats: "apartment",
    arpartment: "apartment",
    aprtment: "apartment",
    artment: "apartment",
    partment: "apartment",
    apartments: "apartment",
    plots: "plot",
    land: "plot",
    erf: "plot",
    rooms: "room",
    guesthouses: "guesthouse",
    "guest-houses": "guesthouse",
    ghetto: "mbashu",
    "ghetto-mbashu": "mbashu",
    mbhashu: "mbashu",
    offices: "office-space",
    office: "office-space",
    "student-room": "student-accommodation",
    "student-rooms": "student-accommodation",
    "student-accommodation": "student-accommodation",
    "student-accommodations": "student-accommodation",
    hotels: "office-space",
    hotel: "office-space",
    lodges: "student-accommodation",
    lodge: "lodges-camps",
    camp: "lodges-camps",
    camps: "lodges-camps",
  };
  return aliases[normalized] ?? normalized;
}

function typeMatches(propertyType: Doc<"properties">["type"], type?: string) {
  if (!type) return true;
  if (type === "office-space") return ["office-space", "hotel"].includes(propertyType);
  if (type === "student-accommodation") {
    return ["student-accommodation", "lodge", "camp", "lodges-camps"].includes(propertyType);
  }
  if (type === "lodges-camps") return ["lodge", "camp", "lodges-camps"].includes(propertyType);
  return propertyType === type;
}

function typeSearchText(propertyType: Doc<"properties">["type"]) {
  const labels: Record<Doc<"properties">["type"], string> = {
    room: "room rooms",
    house: "house houses",
    plot: "plot plots land erf",
    apartment: "apartment apartments flat flats aprtment artment partment arpartment",
    guesthouse: "guesthouse guest house guesthouses guest-houses",
    hotel: "hotel hotels office-space office space",
    lodge: "lodge lodges student accommodation",
    camp: "camp camps lodges camps student accommodation",
    "lodges-camps": "lodge lodges camp camps lodges-camps",
    "office-space": "office office-space office space offices",
    "student-accommodation": "student accommodation student room student rooms",
    commercial: "commercial",
    airbnb: "airbnb vacation rental",
    mbashu: "mbashu mbhashu ghetto ghetto-mbashu",
  };
  return labels[propertyType];
}

function matchesFilters(property: Doc<"properties">, args: FilterArgs) {
  if (args.listingMode === "buy" && property.type === "office-space") return false;
  if (args.listingMode && property.listingMode !== args.listingMode) return false;
  const type = normalizeTypeFilter(args.type);
  if (!typeMatches(property.type, type)) return false;
  if (args.rentalType && property.rentalType !== args.rentalType) return false;
  if (args.minPrice !== undefined && property.price < args.minPrice) return false;
  if (args.maxPrice !== undefined && property.price > args.maxPrice) return false;
  if (args.bedrooms !== undefined && property.bedrooms < args.bedrooms) return false;
  if (args.bathrooms !== undefined && property.bathrooms < args.bathrooms) return false;
  if (args.verified && !property.verified) return false;
  if (args.location && !property.location.toLowerCase().includes(args.location.toLowerCase())) {
    return false;
  }
  if (args.status && property.status !== args.status) return false;
  if (args.query) {
    const q = args.query.trim().toLowerCase();
    const queryType = normalizeTypeFilter(q);
    if (
      q &&
      !property.title.toLowerCase().includes(q) &&
      !property.location.toLowerCase().includes(q) &&
      !(property.description ?? "").toLowerCase().includes(q) &&
      !typeSearchText(property.type).includes(q) &&
      !typeMatches(property.type, queryType)
    ) {
      return false;
    }
  }
  return true;
}

async function getPropertyImageUrls(
  ctx: QueryCtx | MutationCtx,
  images: string[],
  maxImages = images.length,
  cache = new Map<string, Promise<string>>(),
) {
  return await Promise.all(
    images.slice(0, maxImages).map(async (image) => {
      if (
        image.startsWith("data:") ||
        image.startsWith("http://") ||
        image.startsWith("https://") ||
        image.startsWith("/")
      ) {
        return image;
      }

      try {
        if (!cache.has(image)) {
          cache.set(
            image,
            ctx.storage.getUrl(image as Id<"_storage">).then((url) => url ?? image),
          );
        }
        return await cache.get(image)!;
      } catch {
        return image;
      }
    }),
  );
}

async function attachOwnersAndImages(
  ctx: QueryCtx | MutationCtx,
  properties: Doc<"properties">[],
  imageLimit: number,
) {
  const ownerCache = new Map<string, Promise<Doc<"users"> | null>>();
  const imageCache = new Map<string, Promise<string>>();

  return await Promise.all(
    properties.map(async (property) => {
      const ownerKey = property.ownerId;
      if (!ownerCache.has(ownerKey)) {
        ownerCache.set(ownerKey, ctx.db.get(property.ownerId));
      }

      return {
        ...property,
        images: await getPropertyImageUrls(ctx, property.images, imageLimit, imageCache),
        owner: await ownerCache.get(ownerKey)!,
      };
    }),
  );
}

export const list = query({
  args: filters,
  handler: async (ctx, args) => {
    const normalizedType = normalizeTypeFilter(args.type);
    const resultLimit = Math.min(Math.max(args.limit ?? 48, 1), 100);
    const candidateLimit = Math.min(
      Math.max(resultLimit * (args.query ? 10 : 5), args.query ? 200 : 80),
      500,
    );
    const rows = isStatusValue(args.status)
      ? await ctx.db
          .query("properties")
          .withIndex("by_status", (q) => q.eq("status", args.status as StatusValue))
          .order("desc")
          .take(candidateLimit)
      : args.listingMode
        ? await ctx.db
            .query("properties")
            .withIndex("by_listing_mode", (q) => q.eq("listingMode", args.listingMode!))
            .order("desc")
            .take(candidateLimit)
        : isSimpleTypeFilter(normalizedType)
          ? await ctx.db
              .query("properties")
              .withIndex("by_type", (q) => q.eq("type", normalizedType))
              .order("desc")
              .take(candidateLimit)
          : await ctx.db.query("properties").order("desc").take(candidateLimit);
    const properties = rows
      .filter((property) => matchesFilters(property, args))
      .sort((a, b) => Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)) || b.createdAt - a.createdAt)
      .slice(0, resultLimit);
    return await attachOwnersAndImages(ctx, properties, 3);
  },
});

export const get = query({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    const property = await ctx.db.get(args.id);
    if (!property) return null;
    return {
      ...property,
      images: await getPropertyImageUrls(ctx, property.images),
      owner: await ctx.db.get(property.ownerId),
    };
  },
});

export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrNull(ctx);
    if (!user) return [];
    const properties = await ctx.db
      .query("properties")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
    return await Promise.all(
      (await attachOwnersAndImages(ctx, properties, 3)),
    );
  },
});

export const saved = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrNull(ctx);
    if (!user) return [];
    const savedRows = await ctx.db
      .query("savedProperties")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .collect();
    const properties = await Promise.all(
      savedRows.map((row) => ctx.db.get(row.propertyId)),
    );
    return await Promise.all(
      (await attachOwnersAndImages(
        ctx,
        properties.filter((property) => property !== null),
        3,
      )),
    );
  },
});

export const listByOwner = query({
  args: {
    ownerId: v.id("users"),
    status: v.optional(status),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const resultLimit = Math.min(Math.max(args.limit ?? 24, 1), 60);
    const properties = args.status
      ? await ctx.db
          .query("properties")
          .withIndex("by_owner_status", (q) => q.eq("ownerId", args.ownerId).eq("status", args.status!))
          .order("desc")
          .take(resultLimit)
      : await ctx.db
          .query("properties")
          .withIndex("by_owner", (q) => q.eq("ownerId", args.ownerId))
          .order("desc")
          .take(resultLimit);

    return await attachOwnersAndImages(ctx, properties, 3);
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getCurrentUser(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});


export const create = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    location: v.string(),
    fullAddress: v.optional(v.string()),
    type: propertyType,
    listingMode,
    rentalType,
    price: v.number(),
    bedrooms: v.number(),
    bathrooms: v.number(),
    size: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    images: v.array(v.string()),
    dailyPrice: v.optional(v.number()),
    weeklyPrice: v.optional(v.number()),
    monthlyPrice: v.optional(v.number()),
    minimumStay: v.optional(v.number()),
    maxGuests: v.optional(v.number()),
    cleaningFee: v.optional(v.number()),
    checkInTime: v.optional(v.string()),
    checkOutTime: v.optional(v.string()),
    instantBook: v.optional(v.boolean()),
    cancellationPolicy: v.optional(v.union(v.literal("flexible"), v.literal("moderate"), v.literal("strict"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (args.listingMode === "buy" && args.type === "office-space") {
      throw new Error("Office Space is only available for rent listings.");
    }
    const now = Date.now();
    const propertyId = await ctx.db.insert("properties", {
      ownerId: user._id,
      title: args.title,
      description: args.description,
      location: args.location,
      fullAddress: args.fullAddress,
      type: args.type,
      listingMode: args.listingMode,
      rentalType: args.rentalType,
      price: args.price,
      bedrooms: args.bedrooms,
      bathrooms: args.bathrooms,
      size: args.size,
      latitude: args.latitude,
      longitude: args.longitude,
      images: args.images,
      verified: user.role === "agent" || user.role === "admin",
      recommended: false,
      status: "active",
      isNew: true,
      deposit: args.listingMode === "rent" && args.rentalType === "long-term" ? args.price : undefined,
      leaseTerm: args.listingMode === "rent" && args.rentalType === "long-term" ? "12 months" : undefined,
      petsAllowed: false,
      furnished: false,
      dailyPrice: args.dailyPrice,
      weeklyPrice: args.weeklyPrice,
      monthlyPrice: args.monthlyPrice,
      minimumStay: args.minimumStay,
      maxGuests: args.maxGuests,
      cleaningFee: args.cleaningFee,
      checkInTime: args.checkInTime,
      checkOutTime: args.checkOutTime,
      instantBook: args.instantBook ?? false,
      cancellationPolicy: args.cancellationPolicy,
      views: 0,
      createdAt: now,
      updatedAt: now,
    });
    await ctx.db.insert("notifications", {
      userId: user._id,
      type: "listing",
      title: "Your listing is live",
      description: `${args.title} is now published on Ndunda.`,
      read: false,
      createdAt: now,
    });
    return propertyId;
  },
});

export const update = mutation({
  args: {
    id: v.id("properties"),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.string(),
    fullAddress: v.optional(v.string()),
    type: propertyType,
    listingMode,
    rentalType,
    price: v.number(),
    bedrooms: v.number(),
    bathrooms: v.number(),
    size: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    images: v.array(v.string()),
    dailyPrice: v.optional(v.number()),
    weeklyPrice: v.optional(v.number()),
    monthlyPrice: v.optional(v.number()),
    minimumStay: v.optional(v.number()),
    maxGuests: v.optional(v.number()),
    cleaningFee: v.optional(v.number()),
    checkInTime: v.optional(v.string()),
    checkOutTime: v.optional(v.string()),
    instantBook: v.optional(v.boolean()),
    cancellationPolicy: v.optional(v.union(v.literal("flexible"), v.literal("moderate"), v.literal("strict"))),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const property = await ctx.db.get(args.id);
    if (!property) throw new Error("Property not found");
    if (property.ownerId !== user._id && user.role !== "admin" && !isAdminEmail(user.email)) {
      throw new Error("Unauthorized");
    }
    if (args.listingMode === "buy" && args.type === "office-space") {
      throw new Error("Office Space is only available for rent listings.");
    }

    await ctx.db.patch(args.id, {
      title: args.title,
      description: args.description,
      location: args.location,
      fullAddress: args.fullAddress,
      type: args.type,
      listingMode: args.listingMode,
      rentalType: args.rentalType,
      price: args.price,
      bedrooms: args.bedrooms,
      bathrooms: args.bathrooms,
      size: args.size,
      latitude: args.latitude,
      longitude: args.longitude,
      images: args.images,
      dailyPrice: args.dailyPrice,
      weeklyPrice: args.weeklyPrice,
      monthlyPrice: args.monthlyPrice,
      minimumStay: args.minimumStay,
      maxGuests: args.maxGuests,
      cleaningFee: args.cleaningFee,
      checkInTime: args.rentalType === "short-term" ? args.checkInTime : undefined,
      checkOutTime: args.rentalType === "short-term" ? args.checkOutTime : undefined,
      instantBook: args.rentalType === "short-term" ? (args.instantBook ?? false) : false,
      cancellationPolicy: args.rentalType === "short-term" ? args.cancellationPolicy : undefined,
      deposit: args.listingMode === "rent" && args.rentalType === "long-term" ? args.price : undefined,
      leaseTerm: args.listingMode === "rent" && args.rentalType === "long-term" ? "12 months" : undefined,
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("properties") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const property = await ctx.db.get(args.id);
    if (!property) return;
    if (property.ownerId !== user._id && user.role !== "admin" && !isAdminEmail(user.email)) {
      throw new Error("Unauthorized");
    }
    await ctx.db.delete(args.id);
  },
});

export const adminUpdateStatus = mutation({
  args: {
    id: v.id("properties"),
    status,
  },
  handler: async (ctx, args) => {
    await requirePropertyAdmin(ctx);
    await ctx.db.patch(args.id, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const adminToggleVerified = mutation({
  args: {
    id: v.id("properties"),
    verified: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requirePropertyAdmin(ctx);
    await ctx.db.patch(args.id, {
      verified: args.verified,
      updatedAt: Date.now(),
    });
  },
});

export const adminToggleRecommended = mutation({
  args: {
    id: v.id("properties"),
    recommended: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requirePropertyAdmin(ctx);
    await ctx.db.patch(args.id, {
      recommended: args.recommended,
      updatedAt: Date.now(),
    });
  },
});

export const adminImageStorageReport = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePropertyAdmin(ctx);
    const limit = Math.min(Math.max(args.limit ?? 500, 1), 1000);
    const properties = await ctx.db.query("properties").take(limit);
    let affectedProperties = 0;
    let base64Images = 0;
    let approximateBase64Bytes = 0;

    for (const property of properties) {
      const legacyImages = property.images.filter(isDataUrl);
      if (legacyImages.length === 0) continue;
      affectedProperties += 1;
      base64Images += legacyImages.length;
      approximateBase64Bytes += legacyImages.reduce(
        (sum, image) => sum + approximateBytes(image),
        0,
      );
    }

    return {
      scannedProperties: properties.length,
      affectedProperties,
      base64Images,
      approximateBase64Bytes,
      approximateBase64Megabytes: Number((approximateBase64Bytes / 1024 / 1024).toFixed(2)),
    };
  },
});

export const adminClearBase64Images = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requirePropertyAdmin(ctx);
    const dryRun = args.dryRun ?? true;
    const limit = Math.min(Math.max(args.limit ?? 500, 1), 1000);
    const properties = await ctx.db.query("properties").take(limit);
    let affectedProperties = 0;
    let removedImages = 0;
    let approximateBytesRemoved = 0;

    for (const property of properties) {
      const keptImages = property.images.filter((image) => !isDataUrl(image));
      if (keptImages.length === property.images.length) continue;

      const removed = property.images.filter(isDataUrl);
      affectedProperties += 1;
      removedImages += removed.length;
      approximateBytesRemoved += removed.reduce(
        (sum, image) => sum + approximateBytes(image),
        0,
      );

      if (!dryRun) {
        await ctx.db.patch(property._id, {
          images: keptImages,
          updatedAt: Date.now(),
        });
      }
    }

    return {
      dryRun,
      scannedProperties: properties.length,
      affectedProperties,
      removedImages,
      approximateBytesRemoved,
      approximateMegabytesRemoved: Number((approximateBytesRemoved / 1024 / 1024).toFixed(2)),
    };
  },
});

export const toggleSaved = mutation({
  args: { propertyId: v.id("properties") },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    const existing = await ctx.db
      .query("savedProperties")
      .withIndex("by_user_property", (q) => q.eq("userId", user._id).eq("propertyId", args.propertyId))
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
      return false;
    }

    await ctx.db.insert("savedProperties", {
      userId: user._id,
      propertyId: args.propertyId,
      createdAt: Date.now(),
    });
    return true;
  },
});
