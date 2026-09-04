/* eslint-disable */
/**
 * Generated Convex API references.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 */
import type { ApiFromModules, FilterApi, FunctionReference } from "convex/server";
import type * as bookings from "../bookings.js";
import type * as cms from "../cms.js";
import type * as fleet from "../fleet.js";
import type * as fsaZones from "../fsaZones.js";
import type * as payments from "../payments.js";
import type * as seed from "../seed.js";
import type * as users from "../users.js";
import type * as vaccines from "../vaccines.js";
import type * as geo from "../geo.js";
import type * as emails from "../emails.js";

declare const fullApi: ApiFromModules<{
  bookings: typeof bookings;
  cms: typeof cms;
  emails: typeof emails;
  fleet: typeof fleet;
  fsaZones: typeof fsaZones;
  geo: typeof geo;
  payments: typeof payments;
  seed: typeof seed;
  users: typeof users;
  vaccines: typeof vaccines;
}>;

export declare const api: FilterApi<typeof fullApi, FunctionReference<any, "public">>;
export declare const internal: FilterApi<typeof fullApi, FunctionReference<any, "internal">>;
