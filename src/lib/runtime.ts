const env = (import.meta as any)?.env ?? {};
export const hasConvexConfig = Boolean(env.VITE_CONVEX_URL);
export const hasClerkConfig = Boolean(env.VITE_CLERK_PUBLISHABLE_KEY);
export const isProductionBuild = Boolean(env.PROD);
export const isProductionBackendReady = hasConvexConfig && hasClerkConfig;
