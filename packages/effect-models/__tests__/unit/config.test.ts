/**
 * Unit tests for OpenRouterConfig
 */

import { Effect, Layer, Either } from "effect";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { OpenRouterConfig } from "../../src/config/openrouter-config.js";
import { EnvService } from "effect-env";

describe("OpenRouterConfig", () => {
  describe("configuration loading", () => {
    it("should load API key from environment", async () => {
      const testEnvLayer = Layer.succeed(EnvService, {
        require: (key: string) => {
          if (key === "OPENROUTER_API_KEY") {
            return Effect.succeed("sk-test-key-123");
          }
          return Effect.fail(new Error(`Missing env var: ${key}`));
        },
        get: () => Effect.succeed(undefined),
      });

      const program = Effect.gen(function* () {
        const config = yield* OpenRouterConfig;
        const apiKey = yield* config.getApiKey();

        expect(apiKey).toBe("sk-test-key-123");
      }).pipe(Effect.provide(testEnvLayer));

      await Effect.runPromise(program);
    });

    it("should use default base URL when not provided", async () => {
      const testEnvLayer = Layer.succeed(EnvService, {
        require: (key: string) => {
          if (key === "OPENROUTER_API_KEY") {
            return Effect.succeed("sk-test-key");
          }
          return Effect.fail(new Error(`Missing env var: ${key}`));
        },
        get: () => Effect.succeed(undefined),
      });

      const program = Effect.gen(function* () {
        const config = yield* OpenRouterConfig;
        const baseUrl = yield* config.getBaseUrl();

        expect(baseUrl).toBe("https://openrouter.ai/api/v1");
      }).pipe(Effect.provide(testEnvLayer));

      await Effect.runPromise(program);
    });

    it("should use custom base URL from environment", async () => {
      const testEnvLayer = Layer.succeed(EnvService, {
        require: (key: string) => {
          if (key === "OPENROUTER_API_KEY") {
            return Effect.succeed("sk-test-key");
          }
          return Effect.fail(new Error(`Missing env var: ${key}`));
        },
        get: (key: string) => {
          if (key === "OPENROUTER_BASE_URL") {
            return Effect.succeed("https://custom.example.com/api");
          }
          return Effect.fail(new Error(`Missing env var: ${key}`));
        },
      });

      const program = Effect.gen(function* () {
        const config = yield* OpenRouterConfig;
        const baseUrl = yield* config.getBaseUrl();

        expect(baseUrl).toBe("https://custom.example.com/api");
      }).pipe(Effect.provide(testEnvLayer));

      await Effect.runPromise(program);
    });

    it("should use default timeout when not provided", async () => {
      const testEnvLayer = Layer.succeed(EnvService, {
        require: (key: string) => {
          if (key === "OPENROUTER_API_KEY") {
            return Effect.succeed("sk-test-key");
          }
          return Effect.fail(new Error(`Missing env var: ${key}`));
        },
        get: () => Effect.fail(new Error("Not found")),
      });

      const program = Effect.gen(function* () {
        const config = yield* OpenRouterConfig;
        const timeoutMs = yield* config.getTimeoutMs();

        expect(timeoutMs).toBe(30000);
      }).pipe(Effect.provide(testEnvLayer));

      await Effect.runPromise(program);
    });

    it("should parse custom timeout from environment", async () => {
      const testEnvLayer = Layer.succeed(EnvService, {
        require: (key: string) => {
          if (key === "OPENROUTER_API_KEY") {
            return Effect.succeed("sk-test-key");
          }
          return Effect.fail(new Error(`Missing env var: ${key}`));
        },
        get: (key: string) => {
          if (key === "OPENROUTER_TIMEOUT_MS") {
            return Effect.succeed("60000");
          }
          return Effect.fail(new Error("Not found"));
        },
      });

      const program = Effect.gen(function* () {
        const config = yield* OpenRouterConfig;
        const timeoutMs = yield* config.getTimeoutMs();

        expect(timeoutMs).toBe(60000);
      }).pipe(Effect.provide(testEnvLayer));

      await Effect.runPromise(program);
    });

    it("should use default max retries when not provided", async () => {
      const testEnvLayer = Layer.succeed(EnvService, {
        require: (key: string) => {
          if (key === "OPENROUTER_API_KEY") {
            return Effect.succeed("sk-test-key");
          }
          return Effect.fail(new Error(`Missing env var: ${key}`));
        },
        get: () => Effect.fail(new Error("Not found")),
      });

      const program = Effect.gen(function* () {
        const config = yield* OpenRouterConfig;
        const maxRetries = yield* config.getMaxRetries();

        expect(maxRetries).toBe(3);
      }).pipe(Effect.provide(testEnvLayer));

      await Effect.runPromise(program);
    });

    it("should parse custom max retries from environment", async () => {
      const testEnvLayer = Layer.succeed(EnvService, {
        require: (key: string) => {
          if (key === "OPENROUTER_API_KEY") {
            return Effect.succeed("sk-test-key");
          }
          return Effect.fail(new Error(`Missing env var: ${key}`));
        },
        get: (key: string) => {
          if (key === "OPENROUTER_MAX_RETRIES") {
            return Effect.succeed("5");
          }
          return Effect.fail(new Error("Not found"));
        },
      });

      const program = Effect.gen(function* () {
        const config = yield* OpenRouterConfig;
        const maxRetries = yield* config.getMaxRetries();

        expect(maxRetries).toBe(5);
      }).pipe(Effect.provide(testEnvLayer));

      await Effect.runPromise(program);
    });

    it("should fail when API key is not provided", async () => {
      const testEnvLayer = Layer.succeed(EnvService, {
        require: () => Effect.fail(new Error("Missing OPENROUTER_API_KEY")),
        get: () => Effect.fail(new Error("Not found")),
      });

      const program = Effect.gen(function* () {
        const result = yield* OpenRouterConfig.pipe(Effect.either());

        expect(Either.isLeft(result)).toBe(true);
      }).pipe(Effect.provide(testEnvLayer));

      await Effect.runPromise(program);
    });
  });
});
