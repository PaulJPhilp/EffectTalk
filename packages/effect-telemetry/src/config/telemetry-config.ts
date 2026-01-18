import { Effect } from "effect";
import { EnvService } from "effect-env";

export type TelemetryConfigSchema = {
  readonly isEnabled: () => Effect.Effect<boolean>;
  readonly getServiceName: () => Effect.Effect<string>;
  readonly getEndpoint: () => Effect.Effect<string>;
  readonly getExporterType: () => Effect.Effect<"otlp" | "console">;
};

export class TelemetryConfig extends Effect.Service<TelemetryConfigSchema>()(
  "TelemetryConfig",
  {
    accessors: true,
    dependencies: [],
    // biome-ignore lint/suspicious/noExplicitAny: Effect service dependency injection
    effect: Effect.gen(function* () {
      // biome-ignore lint/suspicious/noExplicitAny: EnvService is properly injected
      const env = yield* EnvService as any;

      return {
        isEnabled: () =>
          Effect.gen(function* () {
            const value = yield* env.get("OTEL_ENABLED");
            return value === "true" || value === "1";
          }).pipe(Effect.orElse(() => Effect.succeed(true))), // Default: enabled

        getServiceName: () =>
          env
            .get("OTEL_SERVICE_NAME")
            .pipe(Effect.orElse(() => Effect.succeed("hume-service"))),

        getEndpoint: () =>
          env
            .get("OTEL_EXPORTER_OTLP_ENDPOINT")
            .pipe(Effect.orElse(() => Effect.succeed("http://localhost:4318"))),

        getExporterType: () =>
          Effect.gen(function* () {
            const type = yield* env.get("OTEL_EXPORTER_TYPE");
            return type === "otlp" ? "otlp" : "console";
          }).pipe(Effect.orElse(() => Effect.succeed("console" as const))),
      } as TelemetryConfigSchema;
    }),
  }
) {}
