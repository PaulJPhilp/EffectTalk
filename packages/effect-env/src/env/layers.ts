import { Effect, Layer, ParseResult, Schema as S } from "effect";
import { EnvError } from "./errors.js";
import { EnvService, makeEnv } from "./service.js";

/**
 * @deprecated Use createEnv or createSimpleEnv instead
 *
 * Layer that parses process.env with the given schema.
 */
export const fromProcess = <E>(schema: S.Schema<E>) =>

  Layer.effect(
    // biome-ignore lint: any type necessary for generic service pattern
    EnvService as any,
    Effect.gen(function* () {
      const parsed = yield* S.decodeUnknown(schema)(process.env).pipe(
        Effect.mapError(
          (error) =>
            new EnvError(
              `Schema validation failed: ${ParseResult.TreeFormatter.formatErrorSync(error)}`,
            ),
        ),
      );
      return makeEnv(parsed, process.env);
    }),
  );

/**
 * @deprecated Use createEnv or createSimpleEnv instead
 *
 * Layer that loads .env file and parses with schema.
 */
export const fromDotenv = <E>(schema: S.Schema<E>, opts?: { path?: string }) =>

  Layer.effect(
    // biome-ignore lint: any type necessary for generic service pattern
    EnvService as any,
    Effect.gen(function* () {
      // Import dotenv dynamically to avoid bundling if not used
      const dotenv = require("dotenv") as typeof import("dotenv");
      const config = dotenv.config(opts);
      if (config.error) {
        return yield* Effect.fail(
          new EnvError(`Dotenv config error: ${config.error.message}`),
        );
      }
      const parsed = yield* S.decodeUnknown(schema)(process.env).pipe(
        Effect.mapError(
          (error) =>
            new EnvError(
              `Schema validation failed: ${ParseResult.TreeFormatter.formatErrorSync(error)}`,
            ),
        ),
      );
      return makeEnv(parsed, process.env);
    }),
  );

/**
 * @deprecated Use createEnv or createSimpleEnv instead
 *
 * Layer that parses a provided record with the schema (useful for tests).
 */
export const fromRecord = <E>(
  schema: S.Schema<E>,
  record: Record<string, string | undefined>,
) =>

  Layer.effect(
    // biome-ignore lint: any type necessary for generic service pattern
    EnvService as any,
    Effect.gen(function* () {
      const parsed = yield* S.decodeUnknown(schema)(record).pipe(
        Effect.mapError(
          (error) =>
            new EnvError(
              `Schema validation failed: ${ParseResult.TreeFormatter.formatErrorSync(error)}`,
            ),
        ),
      );
      return makeEnv(parsed, record);
    }),
  );
