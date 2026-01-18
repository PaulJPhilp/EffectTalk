/**
 * Extended prefix enforcement tests for effect-env
 *
 * Additional test cases for prefix validation with different patterns
 */

import { Effect, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { PrefixEnforcementService } from "../../src/services/prefix-enforcement/service.js";
import { PrefixError } from "../../src/services/prefix-enforcement/errors.js";

const createTestLayer = (mode: "strict" | "warning" | "disabled" = "strict") =>
  Layer.succeed(PrefixEnforcementService, {
    enforceClientPrefix: (
      keys: ReadonlyArray<string>,
      options: { clientPrefix: string }
    ) => {
      const violations = keys.filter(
        (k) => !k.startsWith(options.clientPrefix)
      );
      if (mode === "strict" && violations.length > 0) {
        return Effect.fail(
          new PrefixError({
            mode: "client",
            keys: violations,
            message: `Client variables must start with "${options.clientPrefix}": ${violations.join(", ")}`,
          })
        );
      }
      if (mode === "warning" && violations.length > 0) {
        // In warning mode, just log and continue
        return Effect.void;
      }
      return Effect.void;
    },
  });

describe("Prefix Enforcement Extended", () => {
  describe("multiple prefix patterns", () => {
    it("should handle NEXT_ prefix (common Next.js pattern)", async () => {
      const program = Effect.gen(function* () {
        const service = yield* PrefixEnforcementService;
        return yield* service.enforceClientPrefix(
          ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_APP_NAME"],
          {
            clientPrefix: "NEXT_PUBLIC_",
          }
        );
      });

      const result = await Effect.runPromiseExit(
        program.pipe(Effect.provide(createTestLayer()))
      );
      expect(result._tag).toBe("Success");
    });

    it("should handle VITE_ prefix (Vite pattern)", async () => {
      const program = Effect.gen(function* () {
        const service = yield* PrefixEnforcementService;
        return yield* service.enforceClientPrefix(["VITE_API_URL"], {
          clientPrefix: "VITE_",
        });
      });

      const result = await Effect.runPromiseExit(
        program.pipe(Effect.provide(createTestLayer()))
      );
      expect(result._tag).toBe("Success");
    });

    it("should handle REACT_APP prefix", async () => {
      const program = Effect.gen(function* () {
        const service = yield* PrefixEnforcementService;
        return yield* service.enforceClientPrefix(["REACT_APP_KEY"], {
          clientPrefix: "REACT_APP_",
        });
      });

      const result = await Effect.runPromiseExit(
        program.pipe(Effect.provide(createTestLayer()))
      );
      expect(result._tag).toBe("Success");
    });
  });

  describe("mixed compliance cases", () => {
    it("should detect partial non-compliance", async () => {
      const program = Effect.gen(function* () {
        const service = yield* PrefixEnforcementService;
        return yield* service.enforceClientPrefix(
          ["PUBLIC_VALID", "INVALID_VAR", "PUBLIC_ANOTHER"],
          { clientPrefix: "PUBLIC_" }
        );
      });

      const result = await Effect.runPromiseExit(
        program.pipe(Effect.provide(createTestLayer()))
      );
      expect(result._tag).toBe("Failure");
    });

    it("should handle warning mode with non-compliance", async () => {
      const program = Effect.gen(function* () {
        const service = yield* PrefixEnforcementService;
        return yield* service.enforceClientPrefix(
          ["PUBLIC_OK", "MISSING_PREFIX"],
          {
            clientPrefix: "PUBLIC_",
          }
        );
      });

      const result = await Effect.runPromiseExit(
        program.pipe(Effect.provide(createTestLayer("warning")))
      );
      // Warning mode should succeed even with violations
      expect(result._tag).toBe("Success");
    });
  });

  describe("large key sets", () => {
    it("should handle 50 compliant keys", async () => {
      const keys = Array.from({ length: 50 }, (_, i) => `PUBLIC_VAR_${i}`);

      const program = Effect.gen(function* () {
        const service = yield* PrefixEnforcementService;
        return yield* service.enforceClientPrefix(keys, {
          clientPrefix: "PUBLIC_",
        });
      });

      const result = await Effect.runPromiseExit(
        program.pipe(Effect.provide(createTestLayer()))
      );
      expect(result._tag).toBe("Success");
    });

    it("should identify all violations in large set", async () => {
      const keys = [
        ...Array.from({ length: 25 }, (_, i) => `PUBLIC_VAR_${i}`),
        ...Array.from({ length: 25 }, (_, i) => `PRIVATE_${i}`),
      ];

      const program = Effect.gen(function* () {
        const service = yield* PrefixEnforcementService;
        return yield* service.enforceClientPrefix(keys, {
          clientPrefix: "PUBLIC_",
        });
      });

      const exit = await Effect.runPromiseExit(
        program.pipe(Effect.provide(createTestLayer()))
      );
      expect(exit._tag).toBe("Failure");
      if (exit._tag === "Failure" && exit.cause._tag === "Fail") {
        const error = exit.cause.error as PrefixError;
        expect(error.keys.length).toBe(25);
      }
    });
  });

  describe("edge case prefixes", () => {
    it("should handle single character prefix", async () => {
      const program = Effect.gen(function* () {
        const service = yield* PrefixEnforcementService;
        return yield* service.enforceClientPrefix(["P_VAR"], {
          clientPrefix: "P_",
        });
      });

      const result = await Effect.runPromiseExit(
        program.pipe(Effect.provide(createTestLayer()))
      );
      expect(result._tag).toBe("Success");
    });

    it("should handle underscore-only prefix", async () => {
      const program = Effect.gen(function* () {
        const service = yield* PrefixEnforcementService;
        return yield* service.enforceClientPrefix(["_VAR"], {
          clientPrefix: "_",
        });
      });

      const result = await Effect.runPromiseExit(
        program.pipe(Effect.provide(createTestLayer()))
      );
      expect(result._tag).toBe("Success");
    });

    it("should be case-sensitive", async () => {
      const program = Effect.gen(function* () {
        const service = yield* PrefixEnforcementService;
        return yield* service.enforceClientPrefix(["public_VAR"], {
          clientPrefix: "PUBLIC_",
        });
      });

      const exit = await Effect.runPromiseExit(
        program.pipe(Effect.provide(createTestLayer()))
      );
      expect(exit._tag).toBe("Failure");
    });
  });
});
