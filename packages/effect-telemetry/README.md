# effect-telemetry

OpenTelemetry-based observability for Effect applications with automatic instrumentation.

## Features

- ✅ Automatic tracing with OpenTelemetry
- ✅ Metrics collection (tokens, latency, errors)
- ✅ Request ID propagation via FiberRef
- ✅ Zero-config defaults (console exporter)
- ✅ Opt-out via environment variable
- ✅ OTLP exporter support (optional peer dependency)
- ✅ Service-level tracing (Effect operations only)

## Installation

```bash
bun add effect-telemetry
```

For OTLP exporter support (optional):

```bash
bun add -D @opentelemetry/exporter-trace-otlp-http
```

## Quick Start

```typescript
import { Effect } from "effect"
import { TelemetryService } from "effect-telemetry"

const program = Effect.gen(function* () {
  const telemetry = yield* TelemetryService

  // Automatic initialization
  yield* telemetry.initialize()

  // Your code here - automatically traced
  const result = yield* myOperation()

  yield* telemetry.shutdown()
  return result
}).pipe(Effect.provide(TelemetryService.Default))

await Effect.runPromise(program)
```

## Environment Variables

Configure observability behavior with environment variables:

| Variable | Values | Default | Purpose |
|----------|--------|---------|---------|
| `OTEL_ENABLED` | `"true"`/`"false"` | `"true"` | Enable/disable telemetry |
| `OTEL_SERVICE_NAME` | string | `"hume-service"` | Service identifier in spans |
| `OTEL_EXPORTER_TYPE` | `"console"`/`"otlp"` | `"console"` | Exporter backend |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | URL | `"http://localhost:4318"` | OTLP collector endpoint |

## Disabling Telemetry

Disable telemetry for development or testing:

```bash
export OTEL_ENABLED=false
```

All telemetry becomes a no-op when disabled (zero overhead).

## Production Setup

Configure for production with OTLP exporter:

```bash
export OTEL_ENABLED=true
export OTEL_SERVICE_NAME=my-app
export OTEL_EXPORTER_TYPE=otlp
export OTEL_EXPORTER_OTLP_ENDPOINT=https://otel-collector.example.com
```

## Metrics

Automatic metrics collection includes:

| Metric | Type | Description |
|--------|------|-------------|
| `llm.tokens` | Counter | Token usage by provider, model, and type (prompt/completion/total) |
| `operation.duration_ms` | Histogram | Operation latency in milliseconds |
| `errors.total` | Counter | Error counts by operation and error type |

## Request ID Propagation

Request IDs are automatically generated and propagated via FiberRef:

```typescript
import { ContextService } from "effect-telemetry"

const program = Effect.gen(function* () {
  const context = yield* ContextService

  // Get current request ID (auto-generates if not present)
  const requestId = yield* context.getRequestId()

  // Wrap operations with specific request ID
  yield* context.withRequestId("my-request-id")(
    myOperation()
  )

  // Generate new request ID
  const newId = yield* context.generateRequestId()
}).pipe(Effect.provide(ContextService.Default))
```

## Instrumenting Operations

### LLM Calls

Automatically track token usage, latency, and errors:

```typescript
import { instrumentLLMComplete } from "effect-telemetry/instrumentation"
import { OpenRouterService } from "effect-models"

const program = Effect.gen(function* () {
  const llm = yield* OpenRouterService

  const completion = yield* llm.complete({
    model: "openai/gpt-4",
    messages: [{ role: "user", content: "Hello!" }],
  }).pipe(
    instrumentLLMComplete({
      provider: "openai",
      model: "gpt-4",
    })
  )

  // Automatically tracks:
  // - Token counts (prompt, completion, total)
  // - Latency
  // - Errors
  // - Request ID in span attributes
  return completion
})
```

### Manual Spans

Create custom spans with automatic request ID propagation:

```typescript
import { TelemetryService } from "effect-telemetry"

const program = Effect.gen(function* () {
  const telemetry = yield* TelemetryService

  yield* telemetry.initialize()

  const result = yield* Effect.gen(function* () {
    // Your operation here
    return "processed"
  }).pipe(
    telemetry.withSpan("my.operation", {
      "custom.attribute": "value",
    })
  )

  yield* telemetry.shutdown()
  return result
})
```

### Custom Metrics

Record custom metrics:

```typescript
import { MetricsService } from "effect-telemetry"

const program = Effect.gen(function* () {
  const metrics = yield* MetricsService

  // Record latency
  yield* metrics.recordLatency({
    operation: "my.operation",
    durationMs: 1234,
  })

  // Record errors
  yield* metrics.recordError({
    operation: "my.operation",
    errorType: "ValidationError",
  })

  // Record token usage
  yield* metrics.recordLLMTokens({
    provider: "openai",
    model: "gpt-4",
    promptTokens: 100,
    completionTokens: 50,
    totalTokens: 150,
  })
})
```

## Span Naming Conventions

Spans follow a consistent naming convention: `{package}.{operation}` or `{package}.{layer}.{operation}`

**Built-in Spans:**

| Span | Usage | Attributes |
|------|-------|-----------|
| `llm.complete` | LLM completion calls | provider, model, finish_reason |
| `llm.stream` | LLM streaming calls | provider, model |
| `llm.embed` | LLM embedding calls | provider, model |
| `prompt.render` | Prompt template rendering | template_name |
| `json.parse` | JSON parsing | - |
| `yaml.parse` | YAML parsing | - |

**Automatic Attributes:**

All spans automatically include:
- `request.id` - Unique request identifier (UUID v4)

## Testing

### Disable Telemetry in Tests

Set `OTEL_ENABLED=false` for test runs to avoid console output and test isolation:

```bash
OTEL_ENABLED=false bun test
```

### Test Fixtures

Override telemetry services in test layers:

```typescript
import { Effect, Layer } from "effect"
import { TelemetryService } from "effect-telemetry"

const NoOpTelemetry = Layer.succeed(TelemetryService, {
  initialize: () => Effect.void,
  shutdown: () => Effect.void,
  getTracer: () => Effect.succeed(opentelemetry.trace.getTracer("test")),
  getMeter: () => Effect.succeed(opentelemetry.metrics.getMeter("test")),
  withSpan: (name, attrs) => (effect) => effect,
})

const program = effect.pipe(Effect.provide(NoOpTelemetry))
```

## Architecture

### Services

**TelemetryService**
- Manages OpenTelemetry SDK initialization
- Creates spans with automatic request ID injection
- Handles initialization/shutdown lifecycle

**ContextService**
- Manages request ID via FiberRef
- Auto-generates UUIDs if needed
- Propagates request ID across Effect operations

**MetricsService**
- Records counters (tokens, errors)
- Records histograms (latency)
- Aggregates metrics for export

**TelemetryConfig**
- Loads configuration from environment variables
- Provides defaults for all settings
- Can be overridden in tests

### Layering

All services follow Effect's layer-based dependency injection:

```typescript
Effect.provide(TelemetryService.Default)
Effect.provide(MetricsService.Default)
Effect.provide(ContextService.Default)
```

## Error Handling

Telemetry errors don't crash your application:

- **InitializationError**: SDK setup failure (logged, gracefully degraded)
- **TelemetryError**: Exporter failure (logged, spans still created locally)
- **ExportError**: Optional peer dependency issues (clear error message)

## Performance

- **Zero overhead when disabled** (`OTEL_ENABLED=false`)
- **Minimal overhead when enabled** (async exporting, configurable sampling)
- **No blocking calls** (async SDK operations, Effect-based composition)
- **Efficient span creation** (lazy initialized, cached tracers/meters)

## Troubleshooting

### No spans appearing

1. Check `OTEL_ENABLED` is not `"false"`
2. Verify `OTEL_EXPORTER_TYPE` is `"console"` for local testing
3. Ensure telemetry is initialized: `yield* telemetry.initialize()`
4. Check console/logs for initialization errors

### OTLP exporter not found

Install the optional peer dependency:

```bash
bun add -D @opentelemetry/exporter-trace-otlp-http
```

### Request ID not appearing in spans

1. Create ContextService: `const context = yield* ContextService`
2. Get request ID before using telemetry: `yield* context.getRequestId()`
3. Verify services are properly provided as layers

## Future Enhancements

Planned features (Phase 3):

- Streaming token estimation (tiktoken integration)
- Cost calculation (tokens × pricing)
- Custom span processors
- Baggage propagation for distributed tracing
- Prometheus metrics exporter
- Jaeger exporter
- Dashboard templates (Grafana)

## License

MIT
