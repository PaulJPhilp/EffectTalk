import { Data } from "effect";

export class TelemetryError extends Data.TaggedError("TelemetryError")<{
  readonly message: string;
  readonly operation: "initialize" | "shutdown" | "export" | "configure";
  readonly cause?: Error;
}> {}

export class InitializationError extends Data.TaggedError(
  "InitializationError"
)<{
  readonly message: string;
  readonly serviceName?: string;
  readonly cause?: Error;
}> {}

export class ExportError extends Data.TaggedError("ExportError")<{
  readonly message: string;
  readonly exporterType: string;
  readonly endpoint?: string;
  readonly cause?: Error;
}> {}
