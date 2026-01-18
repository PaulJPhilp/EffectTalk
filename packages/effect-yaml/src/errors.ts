import { Data } from "effect";

/**
 * Represents an error that occurs when parsing a YAML string.
 */
export class YamlParseError extends Data.TaggedError("YamlParseError")<{
  readonly message: string;
}> {}

/**
 * Represents an error that occurs when stringifying a value to a YAML string.
 */
export class YamlStringifyError extends Data.TaggedError("YamlStringifyError")<{
  readonly message: string;
}> {}
