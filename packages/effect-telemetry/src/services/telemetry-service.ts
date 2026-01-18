import { Effect, Ref } from "effect"
import type * as opentelemetry from "@opentelemetry/api"
import { TelemetryConfig } from "../config/telemetry-config.js"
import { ContextService } from "./context-service.js"
import { InitializationError, TelemetryError, ExportError } from "../errors.js"

/**
 * Dynamic import for OTLPTraceExporter to keep it optional
 */
async function getOTLPExporter(endpoint: string) {
  try {
    const { OTLPTraceExporter } = await import(
      "@opentelemetry/exporter-trace-otlp-http"
    )
    return new OTLPTraceExporter({ url: endpoint })
  } catch (err) {
    throw new ExportError({
      message: `Failed to load OTLP exporter. Make sure @opentelemetry/exporter-trace-otlp-http is installed.`,
      exporterType: "otlp",
      endpoint,
      cause: err instanceof Error ? err : undefined,
    })
  }
}

export type TelemetryServiceSchema = {
  readonly initialize: () => Effect.Effect<void, InitializationError>
  readonly shutdown: () => Effect.Effect<void, TelemetryError>
  readonly getTracer: (
    name: string
  ) => Effect.Effect<opentelemetry.Tracer, never>
  readonly getMeter: (
    name: string
  ) => Effect.Effect<opentelemetry.Meter, never>
  // biome-ignore lint/suspicious/noExplicitAny: withSpan is a transparent wrapper
  readonly withSpan: <A, E, R>(
    name: string,
    attributes?: Record<string, string | number | boolean>
  ) => (effect: Effect.Effect<A, E, R>) => Effect.Effect<A, any, R>
}

export class TelemetryService extends Effect.Service<TelemetryServiceSchema>()(
  "TelemetryService",
  {
    accessors: true,
    dependencies: [],
    effect: Effect.gen(function* () {
      const config = yield* TelemetryConfig
      const context = yield* ContextService
      // biome-ignore lint/suspicious/noExplicitAny: NodeSDK is dynamic peer dependency
      const sdkRef = yield* Ref.make<any | null>(null)
      const isInitialized = yield* Ref.make(false)

      const initialize = (): Effect.Effect<void, InitializationError> =>
        Effect.gen(function* () {
          const initialized = yield* Ref.get(isInitialized)
          if (initialized) return

          const enabled = yield* config.isEnabled()
          if (!enabled) {
            yield* Effect.logDebug(
              "Telemetry disabled via OTEL_ENABLED=false"
            )
            return
          }

          const serviceName = yield* config.getServiceName()
          const exporterType = yield* config.getExporterType()
          const endpoint = yield* config.getEndpoint()

          try {
            // Create exporter
            const exporter = exporterType === "otlp"
              ? yield* Effect.promise(() => getOTLPExporter(endpoint))
              : yield* Effect.sync(() => {
                  const { ConsoleSpanExporter: CE } = require("@opentelemetry/sdk-trace-node")
                  return new CE()
                })

            // Create SDK
            const sdk = yield* Effect.sync(() => {
              const { NodeSDK: NS } = require("@opentelemetry/sdk-node")
              const { Resource: R } = require("@opentelemetry/resources")
              const { ATTR_SERVICE_NAME: ASN } = require("@opentelemetry/semantic-conventions")
              return new NS({
                resource: new R({
                  [ASN]: serviceName,
                }),
                traceExporter: exporter,
              })
            })

            yield* Effect.sync(() => sdk.start())
            yield* Ref.set(sdkRef, sdk)
            yield* Ref.set(isInitialized, true)
            yield* Effect.logInfo(
              `Telemetry initialized: ${serviceName} → ${exporterType}`
            )
          } catch (err) {
            yield* Effect.fail(
              new InitializationError({
                message: `Failed to initialize: ${err instanceof Error ? err.message : String(err)}`,
                serviceName,
                cause: err instanceof Error ? err : undefined,
              })
            )
          }
        })

      const shutdown = (): Effect.Effect<void, TelemetryError> =>
        Effect.gen(function* () {
          const sdk = yield* Ref.get(sdkRef)
          if (!sdk) return

          try {
            yield* Effect.promise(() => sdk.shutdown())
            yield* Ref.set(sdkRef, null)
            yield* Ref.set(isInitialized, false)
            yield* Effect.logInfo("Telemetry shutdown complete")
          } catch (err) {
            yield* Effect.fail(
              new TelemetryError({
                message: `Shutdown failed: ${err instanceof Error ? err.message : String(err)}`,
                operation: "shutdown",
                cause: err instanceof Error ? err : undefined,
              })
            )
          }
        })

      const getTracer = (
        name: string
      ): Effect.Effect<opentelemetry.Tracer, never> =>
        Effect.sync(() => {
          const otel = require("@opentelemetry/api") as typeof opentelemetry
          return otel.trace.getTracer(name)
        })

      const getMeter = (
        name: string
      ): Effect.Effect<opentelemetry.Meter, never> =>
        Effect.sync(() => {
          const otel = require("@opentelemetry/api") as typeof opentelemetry
          return otel.metrics.getMeter(name)
        })

      const withSpan =
        <A, E, R>(
          name: string,
          attributes?: Record<string, string | number | boolean>
        ) =>
        (
          effect: Effect.Effect<A, E, R>
        ): Effect.Effect<A, E | TelemetryError, R> =>
          Effect.gen(function* () {
            const enabled = yield* config.isEnabled()
            if (!enabled) return yield* effect

            // Get request ID from context
            const requestId = yield* context.getRequestId()

            // Merge request ID into attributes
            const spanAttributes = {
              ...attributes,
              "request.id": requestId,
            }

            return yield* effect.pipe(
              Effect.withSpan(name, { attributes: spanAttributes })
            )
          })

      return {
        initialize,
        shutdown,
        getTracer,
        getMeter,
        withSpan,
      } satisfies TelemetryServiceSchema
    }),
  }
) {}
