import { Effect, Data } from "effect";

import { jsonBackend } from "effect-json";

import type { EffectType } from "../types.js";
import type { Env } from "./api.js";
import { EnvError, MissingVarError } from "./errors.js";

/**
 * Create an Env instance from parsed and raw values.
 *
 * @param parsed - The parsed and validated environment values (typed)
 * @param raw - The raw string values from the source (for reference/debugging)
 * @returns An Env instance implementing all access methods
 */
export const makeEnv = <E>(
  parsed: E,
  raw: Record<string, string | undefined>
): Env<E> => ({
  get: <K extends keyof E>(key: K) => Effect.succeed(parsed[key]),

  require: <K extends keyof E>(key: K) => {
    const value = parsed[key];
    if (value === undefined || value === null) {
      return Effect.fail(new MissingVarError({ key: String(key) }));
    }
    return Effect.succeed(value);
  },

  /**
   * @deprecated Use Schema with NumberFromString instead
   */
  getNumber: (key: string) => {
    const value = raw[key];
    if (value === undefined) {
      return Effect.fail(
        new EnvError({
          message: `Environment variable ${key} not found`,
          key,
        })
      );
    }
    const trimmed = value.trim();
    const num = Number(trimmed);
    if (Number.isNaN(num) || !Number.isFinite(num)) {
      const snippet = trimmed.slice(0, 60);
      return Effect.fail(
        new EnvError({
          message: `Invalid number for ${key}: ${snippet}${trimmed.length > 60 ? "..." : ""}`,
          key,
        })
      );
    }
    return Effect.succeed(num);
  },

  /**
   * @deprecated Use Schema with BooleanFromString instead
   */
  getBoolean: (key: string) => {
    const value = raw[key];
    if (value === undefined) {
      return Effect.fail(
        new EnvError({
          message: `Environment variable ${key} not found`,
          key,
        })
      );
    }
    const normalized = value.toLowerCase().trim();
    if (["true", "1", "yes", "on"].includes(normalized)) {
      return Effect.succeed(true);
    }
    if (["false", "0", "no", "off"].includes(normalized)) {
      return Effect.succeed(false);
    }
    return Effect.fail(
      new EnvError({
        message: `Expected boolean (true|false|1|0|yes|no|on|off), got '${normalized}' for ${key}`,
        key,
      })
    );
  },

  /**
   * @deprecated Use Schema with appropriate parsing instead
   */
  getJson: <T>(key: string): EffectType<T, EnvError> => {
    const value = raw[key];
    if (value === undefined) {
      return Effect.fail(
        new EnvError({
          message: `Environment variable ${key} not found`,
          key,
        })
      );
    }

    return (jsonBackend.parse(value) as any).pipe(
      Effect.map((json: unknown) => json as T),
      Effect.mapError((error: unknown) => {
        const snippet = value.length > 60 ? value.slice(0, 60) + "..." : value;
        const message =
          error instanceof Error ? error.message : `Invalid JSON for ${key}`;
        return new EnvError({
          message: `${message}: ${snippet}`,
          key,
          ...(error instanceof Error ? { cause: error } : {}),
        });
      })
    );
  },

  all: () =>
    Effect.succeed(
      Object.fromEntries(
        Object.entries(raw).filter(([, value]) => value !== undefined)
      ) as Record<string, string>
    ),

  withOverride:
    <K extends string, A, E2, R>(key: K, value: string) =>
    (fa: EffectType<A, E2, R>): EffectType<A, EnvError | E2, R> => {
      if (process.env.NODE_ENV === "production") {
        return Effect.fail(
          new EnvError({
            message: "withOverride is not allowed in production",
          })
        );
      }
      const newRaw = { ...raw, [key]: value };
      const nextEnv = makeEnv(parsed, newRaw);
      return Effect.provideService(fa, EnvService as any, nextEnv);
    },
});

/**
 * EnvService is the Effect Service tag for accessing environment variables.
 *
 * Usage in Effect programs:
 *
 * ```typescript
 * const program = Effect.gen(function* () {
 *   const env = yield* EnvService
 *   const value = yield* env.get("MY_VAR")
 * })
 * ```
 *
 * Note: This service is a placeholder that must be provided by a layer from
 * createEnv or createSimpleEnv. The 'as any' cast is necessary because
 * the service type is determined at layer creation time (Env<T> for various T).
 */
export class EnvService extends (Effect.Service<Env<any>>()("EnvService", {
  effect: Effect.gen(function* () {
    return yield* Effect.fail(
      new Error(
        "EnvService not provided - must be created with createEnv or createSimpleEnv"
      )
    );
  }),
}) as any) {}
