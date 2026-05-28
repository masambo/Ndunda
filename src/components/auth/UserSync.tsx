import { useEffect } from "react";
import { useConvexAuth, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useAuth, useUser } from "@clerk/react";

/** Ensures the signed-in Clerk user has a matching Convex users row. */
export function UserSync() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const storeUser = useMutation(api.users.store);

  useEffect(() => {
    if (isLoaded && isSignedIn && !isLoading && isAuthenticated && user) {
      void storeUser({
        email: user?.primaryEmailAddress?.emailAddress,
        fullName: user?.fullName ?? undefined,
        avatarUrl: user?.imageUrl,
      }).catch((error) => {
        console.warn("Convex user sync failed.", {
          convexAuthenticated: isAuthenticated,
          error,
        });
      });
    }
  }, [isLoaded, isSignedIn, isLoading, isAuthenticated, storeUser, user]);

  return null;
}
