import { Effect } from "effect";
import {
  TelemetryService,
  type TelemetryServiceSchema,
} from "../services/telemetry-service.js";
import {
  MetricsService,
  type MetricsServiceSchema,
} from "../services/metrics-service.js";
import { SPANS, ATTRIBUTES } from "../constants.js";

export interface LLMInstrumentationOptions {
  readonly provider: string;
  readonly model: string;
}

interface LLMResponse {
  readonly usage?: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
}

/**
 * Instruments an LLM completion operation with automatic tracing and metrics collection.
 *
 * Automatically tracks:
 * - Span creation with provider and model attributes
 * - Latency measurement
 * - Token usage (if available in response)
 * - Errors with error type tracking
 * - Request ID propagation via context
 */
// biome-ignore lint/suspicious/noExplicitAny: Effect service dependency injection requires any
export const instrumentLLMComplete =
  <A extends LLMResponse, E, R>(
    options: LLMInstrumentationOptions
    // biome-ignore lint/suspicious/noExplicitAny: Service requirements for flexible composition
  ) =>
  (effect: Effect.Effect<A, E, R>): Effect.Effect<A, E | any, R | any> =>
    Effect.gen(function* () {
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic service resolution
      const telemetry =
        (yield* TelemetryService) as any as TelemetryServiceSchema;
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic service resolution
      const metrics = (yield* MetricsService) as any as MetricsServiceSchema;

      const startTime = Date.now();

      const result = yield* effect.pipe(
        telemetry.withSpan(SPANS.LLM_COMPLETE, {
          [ATTRIBUTES.LLM_PROVIDER]: options.provider,
          [ATTRIBUTES.LLM_MODEL]: options.model,
        }),
        Effect.tap((response: any) => {
          const duration = Date.now() - startTime;

          return Effect.gen(function* () {
            // Record latency
            yield* metrics.recordLatency({
              operation: SPANS.LLM_COMPLETE,
              durationMs: duration,
            });

            // Record tokens if available
            if (response?.usage) {
              yield* metrics.recordLLMTokens({
                provider: options.provider,
                model: options.model,
                promptTokens: response.usage.promptTokens,
                completionTokens: response.usage.completionTokens,
                totalTokens: response.usage.totalTokens,
              });
            }
          });
        }),
        Effect.tapError((error: any) => {
          return metrics.recordError({
            operation: SPANS.LLM_COMPLETE,
            errorType: error?._tag ?? "UnknownError",
          });
        })
      );

      return result;
    });

/**
 * Instruments an LLM streaming operation with automatic tracing and metrics collection.
 *
 * Automatically tracks:
 * - Span creation for streaming operations
 * - Stream initiation and completion
 * - Error handling for streaming failures
 * - Request ID propagation via context
 */
export const instrumentLLMStream =
  <E, R>(options: LLMInstrumentationOptions) =>
  <A>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E | any, R | any> =>
    Effect.gen(function* () {
      // biome-ignore lint/suspicious/noExplicitAny: Dynamic service resolution
      const telemetry =
        (yield* TelemetryService) as any as TelemetryServiceSchema;

      return yield* effect.pipe(
        telemetry.withSpan(SPANS.LLM_STREAM, {
          [ATTRIBUTES.LLM_PROVIDER]: options.provider,
          [ATTRIBUTES.LLM_MODEL]: options.model,
        } as any)
      );
    });
