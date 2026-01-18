// Services
export {
  TelemetryService,
  ContextService,
  RequestIdRef,
  MetricsService,
} from "./services/index.js";
export type {
  TelemetryServiceSchema,
  ContextServiceSchema,
  MetricsServiceSchema,
} from "./services/index.js";

// Errors
export {
  TelemetryError,
  InitializationError,
  ExportError,
} from "./errors.js";

// Constants
export { SPANS, ATTRIBUTES } from "./constants.js";

// Config
export { TelemetryConfig } from "./config/telemetry-config.js";
export type { TelemetryConfigSchema } from "./config/telemetry-config.js";

// Instrumentation
export {
  instrumentLLMComplete,
  instrumentLLMStream,
  type LLMInstrumentationOptions,
} from "./instrumentation/index.js";
