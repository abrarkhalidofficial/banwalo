/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as audit from "../audit.js";
import type * as clients from "../clients.js";
import type * as ledger from "../ledger.js";
import type * as materials from "../materials.js";
import type * as productionOrders from "../productionOrders.js";
import type * as productions from "../productions.js";
import type * as stockEntries from "../stockEntries.js";
import type * as suppliers from "../suppliers.js";
import type * as user from "../user.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  audit: typeof audit;
  clients: typeof clients;
  ledger: typeof ledger;
  materials: typeof materials;
  productionOrders: typeof productionOrders;
  productions: typeof productions;
  stockEntries: typeof stockEntries;
  suppliers: typeof suppliers;
  user: typeof user;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
