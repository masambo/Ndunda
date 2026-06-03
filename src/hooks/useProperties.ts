import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Doc, Id } from "../../convex/_generated/dataModel";
import type { Property, PropertyFilters } from "@/types/property";
import { stableCacheKey, useLocalCache } from "./useLocalCache";

export type { Property, PropertyFilters };

type ConvexPropertyWithOwner = Doc<"properties"> & {
  owner?: Doc<"users"> | null;
};

export function fromConvexProperty(property: ConvexPropertyWithOwner): Property {
  return {
    id: property._id,
    agent_id: null,
    owner_id: property.ownerId,
    title: property.title,
    description: property.description ?? null,
    location: property.location,
    full_address: property.fullAddress ?? null,
    latitude: property.latitude ?? null,
    longitude: property.longitude ?? null,
    type: property.type,
    listing_mode: property.listingMode,
    rental_type: property.rentalType,
    price: property.price,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    size: property.size ?? null,
    images: property.images,
    owner_name: property.owner?.fullName ?? null,
    owner_email: property.owner?.email ?? null,
    owner_avatar_url: property.owner?.avatarUrl ?? null,
    owner_phone: property.owner?.phone ?? null,
    owner_whatsapp: property.owner?.whatsapp ?? null,
    owner_role: property.owner?.role ?? null,
    verified: property.verified,
    recommended: Boolean(property.recommended),
    status: property.status,
    is_new: property.isNew,
    available_from: property.availableFrom ?? null,
    deposit: property.deposit ?? null,
    lease_term: property.leaseTerm ?? null,
    pets_allowed: property.petsAllowed,
    furnished: property.furnished,
    daily_price: property.dailyPrice ?? null,
    weekly_price: property.weeklyPrice ?? null,
    monthly_price: property.monthlyPrice ?? null,
    minimum_stay: property.minimumStay ?? null,
    max_guests: property.maxGuests ?? null,
    cleaning_fee: property.cleaningFee ?? null,
    check_in_time: property.checkInTime ?? null,
    check_out_time: property.checkOutTime ?? null,
    instant_book: property.instantBook,
    cancellation_policy: property.cancellationPolicy ?? null,
    availability: null,
    created_at: new Date(property.createdAt).toISOString(),
    updated_at: new Date(property.updatedAt).toISOString(),
  };
}

export function useOwnerProperties(
  ownerId: string | undefined,
  options?: { status?: "active" | "pending" | "sold" | "rented" | "inactive"; limit?: number },
) {
  const convexProperties = useQuery(
    api.properties.listByOwner,
    ownerId
      ? {
          ownerId: ownerId as Id<"users">,
          status: options?.status,
          limit: options?.limit,
        }
      : "skip",
  );
  const properties = useMemo(() => {
    return convexProperties?.map(fromConvexProperty) ?? [];
  }, [convexProperties]);
  const cacheKey = stableCacheKey("owner-properties", { ownerId, options });
  const cached = useLocalCache(cacheKey, convexProperties === undefined ? undefined : properties, {
    enabled: Boolean(ownerId),
  });

  return {
    properties: cached.value ?? [],
    loading: ownerId ? convexProperties === undefined && !cached.hasCachedValue : false,
    fromCache: cached.hasCachedValue,
    error: null as Error | null,
  };
}

function toConvexFilters(filters?: PropertyFilters) {
  return {
    listingMode: filters?.listingMode,
    type: filters?.type,
    rentalType: filters?.rentalType,
    minPrice: filters?.minPrice,
    maxPrice: filters?.maxPrice,
    bedrooms: filters?.bedrooms,
    bathrooms: filters?.bathrooms,
    verified: filters?.verified,
    location: filters?.location,
    status: filters?.status,
    limit: filters?.limit,
  };
}

export function useProperties(filters?: PropertyFilters, options?: { skip?: boolean }) {
  const filterArgs = toConvexFilters(filters);
  const convexProperties = useQuery(
    api.properties.list,
    options?.skip ? "skip" : filterArgs,
  );
  const properties = useMemo(() => {
    return convexProperties?.map(fromConvexProperty) ?? [];
  }, [convexProperties]);
  const cacheKey = stableCacheKey("properties", filterArgs);
  const cached = useLocalCache(cacheKey, convexProperties === undefined ? undefined : properties, {
    enabled: !options?.skip,
  });

  return {
    properties: cached.value ?? [],
    loading: options?.skip ? false : convexProperties === undefined && !cached.hasCachedValue,
    fromCache: cached.hasCachedValue,
    error: null as Error | null,
  };
}

export function useProperty(id: string | undefined) {
  const convexProperty = useQuery(
    api.properties.get,
    id ? { id: id as Id<"properties"> } : "skip",
  );
  const property = useMemo(() => {
    return convexProperty ? fromConvexProperty(convexProperty) : null;
  }, [convexProperty]);
  const cacheKey = stableCacheKey("property", { id });
  const cached = useLocalCache(cacheKey, convexProperty === undefined ? undefined : property, {
    enabled: Boolean(id),
    ttl: 10 * 60 * 1000,
  });

  return {
    property: cached.value ?? null,
    loading: id ? convexProperty === undefined && !cached.hasCachedValue : false,
    fromCache: cached.hasCachedValue,
    error: null as Error | null,
  };
}

export function useSearchProperties(query: string, filters?: PropertyFilters) {
  const trimmedQuery = query.trim();
  const convexProperties = useQuery(
    api.properties.list,
    trimmedQuery
      ? {
          ...toConvexFilters(filters),
          query: trimmedQuery,
        }
      : "skip",
  );
  const properties = useMemo(() => {
    return convexProperties?.map(fromConvexProperty) ?? [];
  }, [convexProperties]);
  const filterArgs = {
    ...toConvexFilters(filters),
    query: trimmedQuery,
  };
  const cacheKey = stableCacheKey("search-properties", filterArgs);
  const cached = useLocalCache(cacheKey, convexProperties === undefined ? undefined : properties, {
    enabled: Boolean(trimmedQuery),
  });

  return {
    properties: cached.value ?? [],
    loading: trimmedQuery ? convexProperties === undefined && !cached.hasCachedValue : false,
    fromCache: cached.hasCachedValue,
    error: null as Error | null,
  };
}
