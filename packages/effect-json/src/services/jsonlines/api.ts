import type { Effect, Stream } from "effect";
import type { JsonLinesStringifyOptions } from "./types.js";

export interface JsonLinesServiceInterface {
  readonly parseBatch: (
    input: string | Buffer
  ) => Effect.Effect<readonly unknown[], any>;
  readonly stringifyBatch: (
    values: unknown[],
    options?: JsonLinesStringifyOptions
  ) => Effect.Effect<string, any>;
  readonly parseStream: (
    input: Stream.Stream<string>
  ) => Stream.Stream<unknown, any>;
  readonly stringifyStream: (
    input: Stream.Stream<unknown>,
    options?: JsonLinesStringifyOptions
  ) => Stream.Stream<string, any>;
}
