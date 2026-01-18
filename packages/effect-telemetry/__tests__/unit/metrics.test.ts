import { Effect, Layer } from "effect"
import { describe, expect, it } from "vitest"
import { MetricsService } from "../../src/services/metrics-service.js"
import { TelemetryService } from "../../src/services/telemetry-service.js"
import { TelemetryConfig } from "../../src/config/telemetry-config.js"
import { ContextService } from "../../src/services/context-service.js"

describe("MetricsService", () => {
  const EnabledConsoleConfig = Layer.succeed(TelemetryConfig, {
    isEnabled: () => Effect.succeed(true),
    getServiceName: () => Effect.succeed("test-service"),
    getEndpoint: () => Effect.succeed("http://localhost:4318"),
    getExporterType: () => Effect.succeed("console" as const),
  })

  it("should record LLM tokens", async () => {
    const program = Effect.gen(function* () {
      const service = yield* MetricsService
      const telemetry = yield* TelemetryService

      yield* telemetry.initialize()

      yield* service.recordLLMTokens({
        provider: "openai",
        model: "gpt-4",
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      })

      yield* telemetry.shutdown()
    }).pipe(
      Effect.provide(MetricsService.Default),
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    )

    await Effect.runPromise(program)
  })

  it("should record operation latency", async () => {
    const program = Effect.gen(function* () {
      const service = yield* MetricsService
      const telemetry = yield* TelemetryService

      yield* telemetry.initialize()

      yield* service.recordLatency({
        operation: "llm.complete",
        durationMs: 1234,
      })

      yield* telemetry.shutdown()
    }).pipe(
      Effect.provide(MetricsService.Default),
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    )

    await Effect.runPromise(program)
  })

  it("should record errors", async () => {
    const program = Effect.gen(function* () {
      const service = yield* MetricsService
      const telemetry = yield* TelemetryService

      yield* telemetry.initialize()

      yield* service.recordError({
        operation: "llm.complete",
        errorType: "RateLimitError",
      })

      yield* telemetry.shutdown()
    }).pipe(
      Effect.provide(MetricsService.Default),
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    )

    await Effect.runPromise(program)
  })

  it("should record multiple token samples", async () => {
    const program = Effect.gen(function* () {
      const service = yield* MetricsService
      const telemetry = yield* TelemetryService

      yield* telemetry.initialize()

      // Record first call
      yield* service.recordLLMTokens({
        provider: "openai",
        model: "gpt-4",
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      })

      // Record second call
      yield* service.recordLLMTokens({
        provider: "anthropic",
        model: "claude-3",
        promptTokens: 200,
        completionTokens: 100,
        totalTokens: 300,
      })

      yield* telemetry.shutdown()
    }).pipe(
      Effect.provide(MetricsService.Default),
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    )

    await Effect.runPromise(program)
  })

  it("should record multiple latency samples", async () => {
    const program = Effect.gen(function* () {
      const service = yield* MetricsService
      const telemetry = yield* TelemetryService

      yield* telemetry.initialize()

      // Record fast operation
      yield* service.recordLatency({
        operation: "llm.complete",
        durationMs: 500,
      })

      // Record slow operation
      yield* service.recordLatency({
        operation: "llm.complete",
        durationMs: 5000,
      })

      yield* telemetry.shutdown()
    }).pipe(
      Effect.provide(MetricsService.Default),
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    )

    await Effect.runPromise(program)
  })

  it("should record errors for different operations", async () => {
    const program = Effect.gen(function* () {
      const service = yield* MetricsService
      const telemetry = yield* TelemetryService

      yield* telemetry.initialize()

      yield* service.recordError({
        operation: "llm.complete",
        errorType: "RateLimitError",
      })

      yield* service.recordError({
        operation: "llm.stream",
        errorType: "ConnectionError",
      })

      yield* telemetry.shutdown()
    }).pipe(
      Effect.provide(MetricsService.Default),
      Effect.provide(TelemetryService.Default),
      Effect.provide(EnabledConsoleConfig),
      Effect.provide(ContextService.Default)
    )

    await Effect.runPromise(program)
  })
})
