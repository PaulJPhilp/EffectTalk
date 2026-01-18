import { Effect, Layer } from "effect";
import { describe, expect, it, beforeEach } from "vitest";
import { TelemetryService } from "../../src/services/telemetry-service.js";
import { TelemetryConfig } from "../../src/config/telemetry-config.js";
import { ContextService } from "../../src/services/context-service.js";

describe("TelemetryService", () => {
  const DisabledConfig = Layer.succeed(TelemetryConfig, {
    isEnabled: () => Effect.succeed(false),
    getServiceName: () => Effect.succeed("test-service"),
    getEndpoint: () => Effect.succeed("http://localhost:4318"),
    getExporterType: () => Effect.succeed("console" as const),
  });

  const EnabledConsoleConfig = Layer.succeed(TelemetryConfig, {
    isEnabled: () => Effect.succeed(true),
    getServiceName: () => Effect.succeed("test-service"),
    getEndpoint: () => Effect.succeed("http://localhost:4318"),
    getExporterType: () => Effect.succeed("console" as const),
  });

  it("should skip initialization when disabled", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TelemetryService;
      yield* service.initialize();

      const tracer = yield* service.getTracer("test");
      expect(tracer).toBeDefined();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(DisabledConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should pass through effects when disabled", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TelemetryService;

      const result = yield* service.withSpan("test.operation")(
        Effect.succeed("test-value")
      );

      expect(result).toBe("test-value");
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(DisabledConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should initialize telemetry when enabled", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TelemetryService;
      yield* service.initialize();

      // Verify we can get a tracer
      const tracer = yield* service.getTracer("test");
      expect(tracer).toBeDefined();

      yield* service.shutdown();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should get meter when enabled", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TelemetryService;
      yield* service.initialize();

      const meter = yield* service.getMeter("test");
      expect(meter).toBeDefined();

      yield* service.shutdown();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should create spans with attributes when enabled", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TelemetryService;
      yield* service.initialize();

      const result = yield* service.withSpan("test.operation", {
        "test.attribute": "test-value",
      })(Effect.succeed("operation-result"));

      expect(result).toBe("operation-result");

      yield* service.shutdown();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should inject request ID into spans", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TelemetryService;
      const context = yield* ContextService;

      yield* service.initialize();

      yield* context.setRequestId("test-request-id-123");

      const result = yield* service.withSpan("test.operation")(
        Effect.succeed("result")
      );

      expect(result).toBe("result");

      yield* service.shutdown();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should handle multiple initializations gracefully", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TelemetryService;

      yield* service.initialize();
      yield* service.initialize(); // Second init should be no-op

      const tracer = yield* service.getTracer("test");
      expect(tracer).toBeDefined();

      yield* service.shutdown();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });

  it("should handle shutdown without initialization", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TelemetryService;
      // Should not throw even without init
      yield* service.shutdown();
    }).pipe(
      Effect.provide(TelemetryService.Default),
      Effect.provide(DisabledConfig),
      Effect.provide(ContextService.Default)
    );

    await Effect.runPromise(program);
  });
});
