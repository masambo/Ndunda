import type { AuthConfig } from "convex/server";

const clerkIssuerDomain =
  process.env.CLERK_JWT_ISSUER_DOMAIN ??
  "https://adapted-ladybug-29.clerk.accounts.dev";

export default {
  providers: [
    {
      domain: clerkIssuerDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
