import { ConvexReactClient } from "convex/react";
import { api } from "../../convex/_generated/api.js";
import { hasClerkConfig, hasConvexConfig } from "./runtime.ts";

const convexUrl = (import.meta as any)?.env?.VITE_CONVEX_URL;

export const convex = hasConvexConfig && hasClerkConfig && convexUrl ? new ConvexReactClient(convexUrl) : null;
export const usesConvexBackend = Boolean(convex);
export { api };
