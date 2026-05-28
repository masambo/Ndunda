import { useQuery } from "convex/react";
import { useAuth, useUser } from "@clerk/react";
import { api } from "../../convex/_generated/api";
import { isAdminEmail } from "@/lib/admin";
import { stableCacheKey, useLocalCache } from "./useLocalCache";

export function useUserProfile() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const profile = useQuery(api.users.current);
  const clerkEmail = user?.primaryEmailAddress?.emailAddress ?? "";
  const profileCacheKey = stableCacheKey("user-profile", { userId: user?.id ?? "guest" });
  const cachedProfile = useLocalCache(profileCacheKey, profile ?? undefined, {
    enabled: Boolean(isLoaded && isSignedIn && user?.id),
    ttl: 10 * 60 * 1000,
  });
  const profileForDisplay = profile ?? cachedProfile.value ?? null;
  const hasAdminEmail = isAdminEmail(profileForDisplay?.email ?? clerkEmail);
  const resolvedProfile = profileForDisplay
    ? {
        ...profileForDisplay,
        role: hasAdminEmail ? ("admin" as const) : profileForDisplay.role,
      }
    : null;
  const clerkFallback =
    isLoaded && isSignedIn && user
      ? {
          _id: undefined,
          _creationTime: Date.now(),
          tokenIdentifier: "",
          clerkUserId: user.id,
          email: clerkEmail,
          fullName: user.fullName ?? undefined,
          phone: user.primaryPhoneNumber?.phoneNumber ?? undefined,
          avatarUrl: user.imageUrl ?? undefined,
          coverPhotoUrl: undefined,
          role: hasAdminEmail ? ("admin" as const) : ("customer" as const),
          agentStatus: "none" as const,
          createdAt: Date.now(),
        }
      : null;

  const loading = !isLoaded || (isSignedIn && profile === undefined && !cachedProfile.hasCachedValue);

  return {
    profile: resolvedProfile ?? clerkFallback,
    convexProfile: resolvedProfile,
    fromCache: cachedProfile.hasCachedValue,
    loading,
    error: null as Error | null,
    refetch: () => {},
  };
}

export function useUserStats(enabled = true) {
  const { isLoaded, isSignedIn } = useAuth();
  const stats = useQuery(api.users.stats, enabled && isSignedIn ? {} : "skip");
  const loading = enabled && isSignedIn && stats === undefined;

  return {
    stats: stats ?? { savedProperties: 0, listings: 0, bookings: 0 },
    loading,
    refetch: () => {},
  };
}
