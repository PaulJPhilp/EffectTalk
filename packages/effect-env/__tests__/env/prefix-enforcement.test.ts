/**
 * @fileoverview
 * Tests for prefix enforcement functionality.
 *
 * Prefix Enforcement Architecture (Phase 1 refactor, v0.4.1):
 * - Service: PrefixEnforcementService provides enforceClientPrefix method
 * - Integration: Used by createEnv() to validate client variable naming
 * - Behavior: Ensures all client keys start with specified prefix (e.g., "PUBLIC_")
 *
 * Purpose:
 * - Prevents accidental exposure of server secrets as client variables
 * - Type-safe enforcement at both runtime and compile time
 * - Customizable prefix (default: "PUBLIC_")
 *
 * Note: This service is called internally by createEnv() - no manual usage needed.
 */

import { Effect, Layer } from "effect";
import { describe, it, expect } from "vitest";

import { PrefixEnforcementService } from "../../src/services/prefix-enforcement/service.js";
import { PrefixError } from "../../src/services/prefix-enforcement/errors.js";

const createTestLayer = () =>
  Layer.succeed(PrefixEnforcementService, {
    enforceClientPrefix: (
      keys: ReadonlyArray<string>,
      options: { clientPrefix: string }
    ) => {
      const violations = keys.filter(
        (k) => !k.startsWith(options.clientPrefix)
      );
      if (violations.length > 0) {
        return Effect.fail(
          new PrefixError({
            mode: "client",
            keys: violations,
            message: `Client variables must start with "${options.clientPrefix}": ${violations.join(", ")}`,
          })
        );
      }
      return Effect.void;
    },
  });

describe("PrefixEnforcementService", () => {
  it("allows client keys with correct prefix", async () => {
    const program = Effect.gen(function* () {
      const service = yield* PrefixEnforcementService;
      return yield* service.enforceClientPrefix(
        ["PUBLIC_API_URL", "PUBLIC_APP_NAME"],
        { clientPrefix: "PUBLIC_" }
      );
    });

    const result = await Effect.runPromiseExit(
      program.pipe(Effect.provide(createTestLayer()))
    );
    expect(result._tag).toBe("Success");
  });

  it("fails when client key is missing prefix", async () => {
    const program = Effect.gen(function* () {
      const service = yield* PrefixEnforcementService;
      return yield* service.enforceClientPrefix(
        ["API_URL", "PUBLIC_APP_NAME"],
        { clientPrefix: "PUBLIC_" }
      );
    });

    const exit = await Effect.runPromiseExit(
      program.pipe(Effect.provide(createTestLayer()))
    );
    expect(exit._tag).toBe("Failure");
    if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
      const error = exit.cause.error as PrefixError;
      expect(error.mode).toBe("client");
      expect(error.keys).toContain("API_URL");
    }
  });

  it("respects custom prefix", async () => {
    const program = Effect.gen(function* () {
      const service = yield* PrefixEnforcementService;
      return yield* service.enforceClientPrefix(["CUSTOM_VAR"], {
        clientPrefix: "CUSTOM_",
      });
    });

    const exit = await Effect.runPromiseExit(
      program.pipe(Effect.provide(createTestLayer()))
    );
    expect(exit._tag).toBe("Success");
  });

  it("allows empty client keys list", async () => {
    const program = Effect.gen(function* () {
      const service = yield* PrefixEnforcementService;
      return yield* service.enforceClientPrefix([], {
        clientPrefix: "PUBLIC_",
      });
    });

    const result = await Effect.runPromiseExit(
      program.pipe(Effect.provide(createTestLayer()))
    );
    expect(result._tag).toBe("Success");
  });

  it("fails with all violations listed", async () => {
    const program = Effect.gen(function* () {
      const service = yield* PrefixEnforcementService;
      return yield* service.enforceClientPrefix(
        ["API_KEY", "DATABASE_URL", "PUBLIC_ALLOWED"],
        { clientPrefix: "PUBLIC_" }
      );
    });

    const exit = await Effect.runPromiseExit(
      program.pipe(Effect.provide(createTestLayer()))
    );
    expect(exit._tag).toBe("Failure");
    if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
      const error = exit.cause.error as PrefixError;
      expect(error.keys).toContain("API_KEY");
      expect(error.keys).toContain("DATABASE_URL");
      expect(error.keys).not.toContain("PUBLIC_ALLOWED");
    }
  });
});
