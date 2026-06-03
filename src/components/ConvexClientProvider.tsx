import { ReactNode } from "react";
import { ClerkProvider, useAuth } from "@clerk/react";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";

const DEV_CONVEX_URL = "https://fortunate-gull-846.eu-west-1.convex.cloud";
const PROD_CONVEX_URL = "https://small-parakeet-877.eu-west-1.convex.cloud";
const DEFAULT_CLERK_PUBLISHABLE_KEY =
  "pk_test_YWRhcHRlZC1sYWR5YnVnLTI5LmNsZXJrLmFjY291bnRzLmRldiQ";

const configuredConvexUrl = import.meta.env.VITE_CONVEX_URL;
const convexUrl =
  import.meta.env.PROD && configuredConvexUrl === DEV_CONVEX_URL
    ? PROD_CONVEX_URL
    : configuredConvexUrl || PROD_CONVEX_URL;
const publishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || DEFAULT_CLERK_PUBLISHABLE_KEY;

const convex = new ConvexReactClient(convexUrl);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider publishableKey={publishableKey}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
