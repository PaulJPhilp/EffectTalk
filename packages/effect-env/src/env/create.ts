/**
 * @fileoverview
 * Primary APIs for creating typed environment layers.
 *
 * Architecture:
 * - createEnvInternal: Single source of truth for environment validation logic
 * - createEnv: Public API, direct export of createEnvInternal
 * - createSimpleEnv: Simplified API with direct implementation (optimized path)
 *
 * The implementation structure:
 * - DRY Principle: Core validation logic is in createEnvInternal, reducing duplication
 * - createSimpleEnv: Has its own implementation for optimal simplicity (no wrapper overhead)
 * - Both are covered by comprehensive test suites
 */

import { Effect, Layer, ParseResult, Schema as S } from "effect";
import { PrefixError } from "../services/prefix-enforcement/errors.js";
import type { Env } from "./api.js";
import { EnvError } from "./errors.js";
import { EnvService, makeEnv } from "./service.js";

/**
 * Configuration for createEnv with server/client separation.
 */
export interface CreateEnvConfig<Server, Client> {
  readonly server: S.Schema<Server>;
  readonly client: S.Schema<Client>;
  readonly clientPrefix: string;
  readonly runtimeEnv?: Record<string, string | undefined>;
  readonly skipValidation?: boolean;
  readonly onValidationError?: (error: EnvError | PrefixError) => void;
}

/**
 * @internal
 * Internal unified implementation of createEnv.
 * This is the single source of truth for environment validation logic.
 * Both createEnv and createSimpleEnv (as a wrapper) use this implementation.
 */
export const createEnvInternal = <Server, Client>({
  server,
  client,
  clientPrefix,
  runtimeEnv = process.env,
  skipValidation = false,
  onValidationError,
}: CreateEnvConfig<Server, Client>): Layer.Layer<
  Env<Server & Client>,
  EnvError | PrefixError
> =>
  Layer.effect(
    // NOTE: 'as any' is necessary here because EnvService is a generic class
    // and the actual type (Env<Server & Client>) is determined at layer creation time.
    // This is a standard pattern for generic services in Effect-TS.
    // biome-ignore lint/suspicious/noExplicitAny: <>
                EnvService as any,
    Effect.gen(function* () {
      // 1. Validate server schema
      const serverParsed = yield* S.decodeUnknown(server)(runtimeEnv).pipe(
        Effect.catchAll((error) => {
          const envError = new EnvError({
            message: `Server validation failed: ${ParseResult.TreeFormatter.formatErrorSync(error)}`,
            ...(error instanceof Error ? { cause: error } : {}),
          });
          if (skipValidation && onValidationError) {
            onValidationError(envError);
            return Effect.succeed({} as Server);
          }
          return Effect.fail(envError);
        }),
      );

      // 2. Validate client schema
      const clientParsed = yield* S.decodeUnknown(client)(runtimeEnv).pipe(
        Effect.catchAll((error) => {
          const envError = new EnvError({
            message: `Client validation failed: ${ParseResult.TreeFormatter.formatErrorSync(error)}`,
            ...(error instanceof Error ? { cause: error } : {}),
          });
          if (skipValidation && onValidationError) {
            onValidationError(envError);
            return Effect.succeed({} as Client);
          }
          return Effect.fail(envError);
        }),
      );

      // 3. Enforce prefix on client keys (only if client schema defined non-empty keys)
      // Skip prefix enforcement for empty client schema (used in createSimpleEnv wrapper)
      const clientKeys = Object.keys(
        clientParsed as Record<string, unknown>,
      ) as readonly string[];

      // Only enforce prefix if we have actual client variables to validate
      if (clientKeys.length > 0) {
        const violations = clientKeys.filter(
          (key) => !key.startsWith(clientPrefix),
        );

        if (violations.length > 0) {
          const error = new PrefixError({
            mode: "client",
            keys: violations,
            message: `Client variables must start with "${clientPrefix}": ${violations.join(", ")}`,
          });
          if (skipValidation && onValidationError) {
            onValidationError(error);
          } else {
            yield* Effect.fail(error);
          }
        }
      }

      // 4. Merge server and client into single typed object
      const merged = { ...serverParsed, ...clientParsed } as Server & Client;

      // 5. Return the env instance
      return makeEnv(merged, runtimeEnv);
    }),
  );

/**
 * Create a simple typed environment layer (no server/client separation).
 *
 * Useful for simple applications that don't need to separate server and client variables.
 *
 * This is a thin wrapper around createEnv that uses the provided schema as the server
 * schema and provides an empty client schema, avoiding prefix enforcement.
 *
 * @example
 * ```typescript
 * import { Schema as S } from "effect"
 * import { createSimpleEnv, EnvService } from "effect-env"
 *
 * const env = createSimpleEnv(
 *   S.Struct({
 *     PORT: S.NumberFromString,
 *     API_KEY: S.String
 *   })
 * )
 *
 * const program = Effect.gen(function* () {
 *   const envService = yield* EnvService
 *   const port = yield* envService.get("PORT")
 * })
 *
 * Effect.runPromise(Effect.provide(program, env))
 * ```
 */
export const createSimpleEnv = <T>(
  schema: S.Schema<T>,
  runtimeEnv?: Record<string, string | undefined>,
  skipValidation?: boolean,
  onValidationError?: (error: EnvError) => void,
): Layer.Layer<Env<T>, EnvError> => {
  // Wrapper around createEnvInternal:
  // - Use the provided schema as the server schema
  // - Provide an empty client schema (no client vars to validate)
  // - Pass empty object for client validation (never used, prevents prefix errors)
  // - Type assertion hides PrefixError from return type (will never occur)

  // We need a wrapper that bypasses the client schema validation for simple env
  const env = runtimeEnv ?? process.env;

  return Layer.effect(
    // biome-ignore lint: any type necessary for generic service pattern
    EnvService as any,
    Effect.gen(function* () {
      const parsed = yield* S.decodeUnknown(schema)(env).pipe(
        Effect.catchAll((error) => {
          const envError = new EnvError({
            message: `Validation failed: ${ParseResult.TreeFormatter.formatErrorSync(error)}`,
            ...(error instanceof Error ? { cause: error } : {}),
          });
          if (skipValidation && onValidationError) {
            onValidationError(envError);
            return Effect.succeed({} as T);
          }
          return Effect.fail(envError);
        }),
      );

      return makeEnv(parsed, env);
    }),
  );
};
