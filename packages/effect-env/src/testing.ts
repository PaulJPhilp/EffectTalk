/**
 * Testing utilities for effect-env
 *
 * Provides helpers for testing code that uses EnvService
 *
 * @example
 * ```typescript
 * import { createEnvTestLayer, createSimpleEnvTestLayer } from "effect-env/testing"
 * import { EnvService } from "effect-env"
 * import { Schema as S } from "effect"
 * import { Effect } from "effect"
 *
 * const config = S.Struct({
 *   API_KEY: S.String,
 *   PORT: S.NumberFromString,
 * })
 *
 * const testEnv = createSimpleEnvTestLayer(config, {
 *   API_KEY: "test-key",
 *   PORT: "3000",
 * })
 *
 * const program = Effect.gen(function* () {
 *   const env = yield* EnvService
 *   return yield* env.get("API_KEY")
 * })
 *
 * const result = await Effect.runPromise(Effect.provide(program, testEnv))
 * ```
 *
 * @module testing
 */

import { Schema as S } from "effect";
import { createSimpleEnv } from "@/effect-env/env/create.js";
import { EnvError } from "@/effect-env/env/errors.js";

/**
 * Create a test environment layer with provided values
 *
 * Useful for testing code that depends on environment variables
 *
 * @param schema - The schema to validate environment variables against
 * @param runtimeEnv - The environment variables to use for testing
 * @returns A Layer providing EnvService with the test environment
 */
export const createEnvTestLayer = <T>(
  schema: S.Schema<T>,
  runtimeEnv: Record<string, string | undefined>
) => createSimpleEnv(schema, runtimeEnv);

/**
 * Alias for createEnvTestLayer - create a simple test environment layer
 *
 * @param schema - The schema to validate environment variables against
 * @param runtimeEnv - The environment variables to use for testing
 * @returns A Layer providing EnvService with the test environment
 */
export const createSimpleEnvTestLayer = <T>(
  schema: S.Schema<T>,
  runtimeEnv: Record<string, string | undefined>
) => createSimpleEnv(schema, runtimeEnv);

/**
 * Create a test error handler for environment validation
 *
 * Useful for testing error handling in environment setup
 *
 * @returns A callback function that logs and stores validation errors
 */
export const createTestEnvErrorHandler = (): {
  handler: (error: EnvError) => void;
  errors: EnvError[];
} => {
  const errors: EnvError[] = [];
  return {
    handler: (error: EnvError) => {
      errors.push(error);
    },
    errors,
  };
};
