/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as authEmail from "../authEmail.js";
import type * as authEmailDb from "../authEmailDb.js";
import type * as classroom from "../classroom.js";
import type * as crons from "../crons.js";
import type * as digest from "../digest.js";
import type * as digestDb from "../digestDb.js";
import type * as email from "../email.js";
import type * as gate from "../gate.js";
import type * as household from "../household.js";
import type * as links from "../links.js";
import type * as telemetry from "../telemetry.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  authEmail: typeof authEmail;
  authEmailDb: typeof authEmailDb;
  classroom: typeof classroom;
  crons: typeof crons;
  digest: typeof digest;
  digestDb: typeof digestDb;
  email: typeof email;
  gate: typeof gate;
  household: typeof household;
  links: typeof links;
  telemetry: typeof telemetry;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
