import { Data } from "effect";

/**
 * Represents an error that occurs when parsing a TOML string.
 */
export class TomlParseError extends Data.TaggedError("TomlParseError")<{
  readonly message: string;
}> {}

/**
 * Represents an error that occurs when stringifying a value to a TOML string.
 */
export class TomlStringifyError extends Data.TaggedError("TomlStringifyError")<{
  readonly message: string;
}> {}
