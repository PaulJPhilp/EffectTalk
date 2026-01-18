import { Effect } from "effect"
import { TelemetryService } from "./telemetry-service.js"

export type MetricsServiceSchema = {
  readonly recordLLMTokens: (data: {
    readonly provider: string
    readonly model: string
    readonly promptTokens: number
    readonly completionTokens: number
    readonly totalTokens: number
  }) => Effect.Effect<void>

  readonly recordLatency: (data: {
    readonly operation: string
    readonly durationMs: number
  }) => Effect.Effect<void>

  readonly recordError: (data: {
    readonly operation: string
    readonly errorType: string
  }) => Effect.Effect<void>
}

export class MetricsService extends Effect.Service<MetricsServiceSchema>()(
  "MetricsService",
  {
    accessors: true,
    dependencies: [TelemetryService.Default],
    effect: Effect.gen(function* () {
      const telemetry = yield* TelemetryService
      const meter = yield* telemetry.getMeter("effect-telemetry")

      // Counters
      const tokenCounter = meter.createCounter("llm.tokens", {
        description: "Total tokens consumed by LLM calls",
      })

      const errorCounter = meter.createCounter("errors.total", {
        description: "Total errors by type and operation",
      })

      // Histograms
      const latencyHistogram = meter.createHistogram("operation.duration_ms", {
        description: "Operation latency in milliseconds",
      })

      return {
        recordLLMTokens: (data) =>
          Effect.sync(() => {
            tokenCounter.add(data.promptTokens, {
              provider: data.provider,
              model: data.model,
              token_type: "prompt",
            })
            tokenCounter.add(data.completionTokens, {
              provider: data.provider,
              model: data.model,
              token_type: "completion",
            })
            tokenCounter.add(data.totalTokens, {
              provider: data.provider,
              model: data.model,
              token_type: "total",
            })
          }),

        recordLatency: (data) =>
          Effect.sync(() => {
            latencyHistogram.record(data.durationMs, {
              operation: data.operation,
            })
          }),

        recordError: (data) =>
          Effect.sync(() => {
            errorCounter.add(1, {
              operation: data.operation,
              error_type: data.errorType,
            })
          }),
      } satisfies MetricsServiceSchema
    }),
  }
) {}
