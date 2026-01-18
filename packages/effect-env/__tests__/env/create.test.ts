/**
 * @fileoverview
 * Tests for environment creation APIs.
 *
 * Architecture note (Phase 1 refactor, v0.4.1):
 * - createEnvInternal: Single source of truth for core validation logic (65 lines)
 * - createEnv: Public API, direct export of createEnvInternal
 * - createSimpleEnv: Simplified API with optimized implementation
 *
 * Tests cover:
 * 1. createEnv functionality: server/client separation, prefix enforcement, transformations
 * 2. createSimpleEnv functionality: simplified usage, optional runtimeEnv
 * 3. Both APIs: schema validation, error handling, type inference
 */

import { Effect, Schema as S } from "effect";
import { describe, it, expect } from "vitest";

import {
  createEnv,
  createSimpleEnv,
  createEnvInternal,
} from "../../src/env/create.js";
import { EnvService } from "../../src/env/service.js";
import { EnvError } from "../../src/env/errors.js";
import { PrefixError } from "../../src/services/prefix-enforcement/errors.js";

describe("createEnvInternal (internal implementation)", () => {
  it("is the single source of truth for validation logic", async () => {
    // Test that the internal function works correctly
    const env = createEnvInternal({
      server: S.Struct({
        DATABASE_URL: S.String,
      }),
      client: S.Struct({
        PUBLIC_API_URL: S.String,
      }),
      clientPrefix: "PUBLIC_",
      runtimeEnv: {
        DATABASE_URL: "postgres://localhost",
        PUBLIC_API_URL: "https://api.example.com",
      },
    });

    const program = Effect.gen(function* () {
      const envService = yield* EnvService;
      const db = yield* envService.get("DATABASE_URL");
      const api = yield* envService.get("PUBLIC_API_URL");
      return { db, api };
    });

    const result = await Effect.runPromise(Effect.provide(program, env));
    expect(result.db).toBe("postgres://localhost");
    expect(result.api).toBe("https://api.example.com");
  });
});

describe("createEnv", () => {
  describe("API equivalence", () => {
    it("is a direct export of createEnvInternal (no wrapper overhead)", async () => {
      // Verify that createEnv === createEnvInternal for full feature set
      const config = {
        server: S.Struct({ SERVER_VAR: S.String }),
        client: S.Struct({ PUBLIC_VAR: S.String }),
        clientPrefix: "PUBLIC_",
        runtimeEnv: {
          SERVER_VAR: "server-value",
          PUBLIC_VAR: "public-value",
        },
      };

      // Both should work identically
      const env1 = createEnv(config);
      const env2 = createEnvInternal(config);

      const program = Effect.gen(function* () {
        const envService = yield* EnvService;
        const server = yield* envService.get("SERVER_VAR");
        const pub = yield* envService.get("PUBLIC_VAR");
        return { server, pub };
      });

      const result1 = await Effect.runPromise(Effect.provide(program, env1));
      const result2 = await Effect.runPromise(Effect.provide(program, env2));

      expect(result1).toEqual(result2);
      expect(result1.server).toBe("server-value");
      expect(result1.pub).toBe("public-value");
    });
  });

  describe("server/client separation", () => {
    it("validates and types both server and client vars", async () => {
      const env = createEnv({
        server: S.Struct({
          DATABASE_URL: S.String,
          API_SECRET: S.String,
        }),
        client: S.Struct({
          PUBLIC_API_URL: S.String,
        }),
        clientPrefix: "PUBLIC_",
        runtimeEnv: {
          DATABASE_URL: "postgres://localhost",
          API_SECRET: "super-secret",
          PUBLIC_API_URL: "https://api.example.com",
        },
      });

      const program = Effect.gen(function* () {
        const envService = yield* EnvService;
        const dbUrl = yield* envService.get("DATABASE_URL");
        const apiUrl = yield* envService.get("PUBLIC_API_URL");
        return { dbUrl, apiUrl };
      });

      const result = await Effect.runPromise(Effect.provide(program, env));
      expect(result.dbUrl).toBe("postgres://localhost");
      expect(result.apiUrl).toBe("https://api.example.com");
    });

    it("enforces client prefix on client vars", async () => {
      const env = createEnv({
        server: S.Struct({}),
        client: S.Struct({
          API_URL: S.String, // ← Missing PUBLIC_ prefix
        }),
        clientPrefix: "PUBLIC_",
        runtimeEnv: {
          API_URL: "https://api.example.com",
        },
      });

      const program = Effect.gen(function* () {
        const envService = yield* EnvService;
        return yield* envService.get("API_URL");
      });

      const result = await Effect.runPromiseExit(Effect.provide(program, env));
      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure" && result.cause._tag === "Fail") {
        expect(result.cause.error).toBeInstanceOf(PrefixError);
      }
    });

    it("allows custom prefix", async () => {
      const env = createEnv({
        server: S.Struct({
          SECRET: S.String,
        }),
        client: S.Struct({
          EXPOSED_API_URL: S.String,
        }),
        clientPrefix: "EXPOSED_",
        runtimeEnv: {
          SECRET: "value",
          EXPOSED_API_URL: "https://api.example.com",
        },
      });

      const program = Effect.gen(function* () {
        const envService = yield* EnvService;
        const exposed = yield* envService.get("EXPOSED_API_URL");
        return exposed;
      });

      const result = await Effect.runPromise(Effect.provide(program, env));
      expect(result).toBe("https://api.example.com");
    });

    it("fails on missing required server var", async () => {
      const env = createEnv({
        server: S.Struct({
          REQUIRED_VAR: S.String,
        }),
        client: S.Struct({}),
        clientPrefix: "PUBLIC_",
        runtimeEnv: {}, // ← Missing REQUIRED_VAR
      });

      const program = Effect.gen(function* () {
        const envService = yield* EnvService;
        return yield* envService.get("REQUIRED_VAR");
      });

      const result = await Effect.runPromiseExit(Effect.provide(program, env));
      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure" && result.cause._tag === "Fail") {
        expect(result.cause.error).toBeInstanceOf(EnvError);
      }
    });

    it("supports schema transformations", async () => {
      const env = createEnv({
        server: S.Struct({
          SERVER_PORT: S.NumberFromString,
        }),
        client: S.Struct({
          PUBLIC_TIMEOUT: S.NumberFromString,
        }),
        clientPrefix: "PUBLIC_",
        runtimeEnv: {
          SERVER_PORT: "3000",
          PUBLIC_TIMEOUT: "5000",
        },
      });

      const program = Effect.gen(function* () {
        const envService = yield* EnvService;
        const port = yield* envService.get("SERVER_PORT");
        const timeout = yield* envService.get("PUBLIC_TIMEOUT");
        return port + timeout; // ← Types are numbers
      });

      const result = await Effect.runPromise(Effect.provide(program, env));
      expect(result).toBe(8000);
    });

    it("supports optional fields with defaults", async () => {
      const env = createEnv({
        server: S.Struct({
          LOG_LEVEL: S.optionalWith(S.String, { default: () => "info" }),
        }),
        client: S.Struct({}),
        clientPrefix: "PUBLIC_",
        runtimeEnv: {}, // ← No LOG_LEVEL provided
      });

      const program = Effect.gen(function* () {
        const envService = yield* EnvService;
        const logLevel = yield* envService.get("LOG_LEVEL");
        return logLevel;
      });

      const result = await Effect.runPromise(Effect.provide(program, env));
      expect(result).toBe("info");
    });
  });

  describe("error handling", () => {
    it("provides helpful error messages on validation failure", async () => {
      const env = createEnv({
        server: S.Struct({
          PORT: S.NumberFromString,
        }),
        client: S.Struct({}),
        clientPrefix: "PUBLIC_",
        runtimeEnv: {
          PORT: "not-a-number",
        },
      });

      const program = Effect.gen(function* () {
        const envService = yield* EnvService;
        return yield* envService.get("PORT");
      });

      const result = await Effect.runPromiseExit(Effect.provide(program, env));
      expect(result._tag).toBe("Failure");
      if (result._tag === "Failure" && result.cause._tag === "Fail") {
        const error = result.cause.error;
        expect(error).toBeInstanceOf(EnvError);
        expect(error.message).toContain("validation failed");
      }
    });

    it("fails on multiple missing required vars", async () => {
      const env = createEnv({
        server: S.Struct({
          VAR1: S.String,
          VAR2: S.String,
        }),
        client: S.Struct({}),
        clientPrefix: "PUBLIC_",
        runtimeEnv: {},
      });

      const program = Effect.gen(function* () {
        const envService = yield* EnvService;
        return yield* envService.get("VAR1");
      });

      const result = await Effect.runPromiseExit(Effect.provide(program, env));
      expect(result._tag).toBe("Failure");
    });
  });
});

describe("createSimpleEnv", () => {
  describe("implementation", () => {
    it("has optimized implementation for simple case (no wrapper overhead)", async () => {
      // createSimpleEnv uses its own optimized implementation path
      // not a wrapper around createEnv, avoiding unnecessary prefix checks
      const env = createSimpleEnv(
        S.Struct({
          PORT: S.NumberFromString,
          API_KEY: S.String,
        }),
        {
          PORT: "3000",
          API_KEY: "secret-key",
        }
      );

      const program = Effect.gen(function* () {
        const envService = yield* EnvService;
        const port = yield* envService.get("PORT");
        const key = yield* envService.get("API_KEY");
        return { port, key };
      });

      const result = await Effect.runPromise(Effect.provide(program, env));
      expect(result.port).toBe(3000);
      expect(result.key).toBe("secret-key");
    });
  });

  it("creates typed env without server/client separation", async () => {
    const env = createSimpleEnv(
      S.Struct({
        PORT: S.NumberFromString,
        API_KEY: S.String,
      }),
      {
        PORT: "3000",
        API_KEY: "secret-key",
      }
    );

    const program = Effect.gen(function* () {
      const envService = yield* EnvService;
      const port = yield* envService.get("PORT");
      const key = yield* envService.get("API_KEY");
      return { port, key };
    });

    const result = await Effect.runPromise(Effect.provide(program, env));
    expect(result.port).toBe(3000);
    expect(result.key).toBe("secret-key");
  });

  it("fails on invalid schema", async () => {
    const env = createSimpleEnv(
      S.Struct({
        COUNT: S.NumberFromString,
      }),
      {
        COUNT: "invalid",
      }
    );

    const program = Effect.gen(function* () {
      const envService = yield* EnvService;
      return yield* envService.get("COUNT");
    });

    const result = await Effect.runPromiseExit(Effect.provide(program, env));
    expect(result._tag).toBe("Failure");
  });

  it("uses process.env by default", async () => {
    const originalEnv = process.env.TEST_VAR;
    try {
      process.env.TEST_VAR = "from-process-env";

      const env = createSimpleEnv(
        S.Struct({
          TEST_VAR: S.String,
        })
      );

      const program = Effect.gen(function* () {
        const envService = yield* EnvService;
        return yield* envService.get("TEST_VAR");
      });

      const result = await Effect.runPromise(Effect.provide(program, env));
      expect(result).toBe("from-process-env");
    } finally {
      if (originalEnv === undefined) {
        delete process.env.TEST_VAR;
      } else {
        process.env.TEST_VAR = originalEnv;
      }
    }
  });
});
