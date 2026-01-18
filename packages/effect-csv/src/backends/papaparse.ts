import { Effect, Stream, Chunk } from "effect";
// biome-ignore lint/suspicious/noExplicitAny: papaparse
import Papa from "papaparse";
import type { CsvBackend, ParseOptions, StringifyOptions } from "./types.js";
import { ParseError, StringifyError } from "../errors.js";

/**
 * PapaParse CSV Backend
 *
 * Feature-rich CSV parser with excellent edge case handling
 */
export const papaParse: CsvBackend = {
  parse: (input, options = {}) =>
    Effect.sync(() => {
      const inputStr = Buffer.isBuffer(input) ? input.toString("utf-8") : input;

      // biome-ignore lint/suspicious/noExplicitAny: papaparse is untyped
      const result: any = (Papa as any).parse(inputStr, {
        delimiter: options.delimiter,
        header: options.header ?? true,
        skipEmptyLines: options.skipEmptyLines ?? true,
        dynamicTyping: options.dynamicTyping ?? false,
        transformHeader: options.trimFields
          ? (h: string) => h.trim()
          : undefined,
        comments: options.comment,
      });

      if (result.errors && result.errors.length > 0) {
        const firstError = result.errors[0];
        throw new ParseError({
          message: (firstError as any)?.message ?? "Parse error",
          row: (firstError as any)?.row ?? 0,
          column: (firstError as any)?.index,
          snippet: inputStr.split("\n")[(firstError as any)?.row ?? 0] ?? "",
        });
      }

      return result.data as ReadonlyArray<unknown>;
    }).pipe(
      Effect.catchAll((error) => {
        // biome-ignore lint/suspicious/noExplicitAny: error handling
        if ((error as any)?._tag === "ParseError") {
          return Effect.fail(error as ParseError);
        }

        return Effect.fail(
          new ParseError({
            message: (error as any)?.message ?? String(error),
            row: 0,
            snippet: "",
          })
        );
      })
    ),

  stringify: (data, options = {}) =>
    Effect.sync(() => {
      // biome-ignore lint/suspicious/noExplicitAny: PapaParse accepts any array
      const result = (Papa as any).unparse(data as any[], {
        delimiter: options.delimiter ?? ",",
        header: options.header ?? true,
        quotes: typeof options.quote === "boolean" ? options.quote : false,
        quoteChar: typeof options.quote === "string" ? options.quote : '"',
        escapeChar: options.escape ?? '"',
        newline: options.lineEnding ?? "\n",
      });

      return result;
    }).pipe(
      Effect.catchAll((error) =>
        Effect.fail(
          new StringifyError({
            message: (error as any)?.message ?? String(error),
            reason: "unknown",
          })
        )
      )
    ),

  parseStream: (inputStream, options = {}) =>
    inputStream.pipe(
      Stream.mapEffect((chunk) =>
        papaParse.parse(chunk, options).pipe(Effect.map((rows) => rows))
      ),
      Stream.flatMap((rows) => Stream.fromIterable(rows))
    ),

  stringifyStream: (dataStream, options = {}) =>
    Stream.chunks(dataStream).pipe(
      Stream.mapEffect((chunk) =>
        papaParse.stringify(Chunk.toReadonlyArray(chunk), options)
      )
    ),
};
