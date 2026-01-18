/**
 * HTTP server for effect-models-website
 *
 * This file will be populated when the application code is migrated.
 */

import { Effect } from "effect";

const server = Effect.gen(function* () {
  yield* Effect.log("Server starting...");
  // Server implementation will be added here
  return { status: "ready" };
});

Effect.runPromise(server);
