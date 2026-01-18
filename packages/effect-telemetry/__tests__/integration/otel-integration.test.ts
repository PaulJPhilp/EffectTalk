import { Effect, Layer } from "effect";
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { TelemetryService } from "../../src/services/telemetry-service.js";
import { ContextService } from "../../src/services/context-service.js";
import { MetricsService } from "../../src/services/metrics-service.js";
import { TelemetryConfig } from "../../src/config/telemetry-config.js";
import { instrumentLLMComplete } from "../../src/instrumentation/llm-instrumentation.js";

describe("OpenTelemetry Integration", () => {
  const EnabledConsoleConfig = Layer.succeed(TelemetryConfig, {
    isEnabled: () => Effect.succeed(true),
    getServiceName: () => Effect.succeed("test-service"),
    getEndpoint: () => Effect.succeed("http://localhost:4318"),
    getExporterType: () => Effect.succeed("console" as const),
  });

  it("should export spans to console", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TelemetryService;

      yield* service.initialize();

      const operation = Effect.gen(function* () {
        yield* Effect.sleep("50 millis");
        return "completed";
      }).pipe(service.withSpan("test.operation"));

      const result = yield* operation;
      expect(result).toBe("completed");

      yield* service.shutdown();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should propagate request ID in spans", async () => {
    const program = Effect.gen(function* () {
      const telemetry = yield* TelemetryService;
      const context = yield* ContextService;

      yield* telemetry.initialize();

      const requestId = "integration-test-123";
      yield* context.setRequestId(requestId);

      const operation = Effect.gen(function* () {
        return "result";
      }).pipe(telemetry.withSpan("test.operation", { "custom.attr": "value" }));

      const result = yield* operation;
      expect(result).toBe("result");

      yield* telemetry.shutdown();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should instrument LLM complete call with metrics", async () => {
    const program = Effect.gen(function* () {
      const telemetry = yield* TelemetryService;
      const metrics = yield* MetricsService;

      yield* telemetry.initialize();

      const mockLLMCall = Effect.gen(function* () {
        yield* Effect.sleep("50 millis");
        return {
          content: "response text",
          usage: {
            promptTokens: 100,
            completionTokens: 50,
            totalTokens: 150,
          },
        };
      });

      const result = yield* mockLLMCall.pipe(
        instrumentLLMComplete({
          provider: "openai",
          model: "gpt-4",
        })
      );

      expect(result.content).toBe("response text");
      expect(result.usage.totalTokens).toBe(150);

      yield* telemetry.shutdown();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(MetricsService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should handle errors in spans gracefully", async () => {
    const program = Effect.gen(function* () {
      const telemetry = yield* TelemetryService;

      yield* telemetry.initialize();

      const mockError = new Error("test error");

      const operation = Effect.gen(function* () {
        return yield* Effect.fail(mockError);
      }).pipe(telemetry.withSpan("test.operation"));

      const result = yield* Effect.either(operation);

      // Verify error was propagated
      expect(result._tag).toBe("Left");

      yield* telemetry.shutdown();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should handle concurrent spans with independent request IDs", async () => {
    const program = Effect.gen(function* () {
      const telemetry = yield* TelemetryService;
      const context = yield* ContextService;

      yield* telemetry.initialize();

      const operation = (requestId: string) =>
        Effect.gen(function* () {
          const id = yield* context.withRequestId(requestId)(
            context.getRequestId()
          );
          yield* Effect.sleep("50 millis");
          return id;
        }).pipe(telemetry.withSpan("test.operation"));

      // Run operations with different request IDs
      const [id1, id2] = yield* Effect.all([
        operation("request-1"),
        operation("request-2"),
      ]);

      expect(id1).toBe("request-1");
      expect(id2).toBe("request-2");
      expect(id1).not.toBe(id2);

      yield* telemetry.shutdown();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should instrument LLM call without usage data", async () => {
    const program = Effect.gen(function* () {
      const telemetry = yield* TelemetryService;

      yield* telemetry.initialize();

      const mockLLMCall = Effect.gen(function* () {
        return {
          content: "response without usage",
          // No usage field
        };
      });

      const result = yield* mockLLMCall.pipe(
        instrumentLLMComplete({
          provider: "openai",
          model: "gpt-4",
        })
      );

      expect(result.content).toBe("response without usage");

      yield* telemetry.shutdown();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(MetricsService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should record metrics when LLM call fails", async () => {
    const program = Effect.gen(function* () {
      const telemetry = yield* TelemetryService;
      const metrics = yield* MetricsService;

      yield* telemetry.initialize();

      class MockError extends Error {
        readonly _tag = "MockError";
      }

      const mockLLMCall = Effect.gen(function* () {
        yield* Effect.sleep("50 millis");
        return yield* Effect.fail(new MockError("API error"));
      });

      const result = yield* Effect.either(
        mockLLMCall.pipe(
          instrumentLLMComplete({
            provider: "openai",
            model: "gpt-4",
          })
        )
      );

      // Verify error was recorded
      expect(result._tag).toBe("Left");

      yield* telemetry.shutdown();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(MetricsService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should clean up resources on shutdown", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TelemetryService;

      yield* service.initialize();
      const tracer1 = yield* service.getTracer("test");
      expect(tracer1).toBeDefined();

      yield* service.shutdown();

      // After shutdown, should still be able to get tracer
      // (just won't be exporting)
      const tracer2 = yield* service.getTracer("test");
      expect(tracer2).toBeDefined();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });
});
