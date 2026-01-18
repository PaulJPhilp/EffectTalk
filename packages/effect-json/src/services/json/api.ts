import type { Effect } from "effect";
import type { JsonFormat, StringifyOptions } from "./types.js";

export interface JsonServiceInterface {
  readonly parse: (
    format: JsonFormat,
    input: string | Buffer
  ) => Effect.Effect<unknown, any>;
  readonly stringify: (
    format: JsonFormat,
    value: unknown,
    options?: StringifyOptions
  ) => Effect.Effect<string, any>;
}
