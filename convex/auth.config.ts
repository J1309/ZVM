import type { AuthConfig } from "convex/server";

const rawDomain = process.env.CLERK_JWT_ISSUER_DOMAIN;
if (!rawDomain) throw new Error("CLERK_JWT_ISSUER_DOMAIN is not configured.");

// Strip trailing slash if present to match Clerk issuer claims cleanly
const clerkJwtIssuerDomain = rawDomain.trim().replace(/\/$/, "");

export default {
  providers: [
    {
      domain: clerkJwtIssuerDomain,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
