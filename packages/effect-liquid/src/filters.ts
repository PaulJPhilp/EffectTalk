import { Effect } from "effect";
import { LiquidFilterError } from "./errors.js";
import { toString, toNumber } from "./utils/context.js";

/**
 * String filters
 */

export function upcase(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  return Effect.succeed(toString(input).toUpperCase());
}

export function downcase(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  return Effect.succeed(toString(input).toLowerCase());
}

export function capitalize(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  const str = toString(input);
  if (str.length === 0) {
    return Effect.succeed("");
  }
  return Effect.succeed(str[0]?.toUpperCase() + str.slice(1).toLowerCase());
}

export function strip(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  return Effect.succeed(toString(input).trim());
}

export function stripHtml(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  const str = toString(input);
  return Effect.succeed(str.replace(/<[^>]*>/g, ""));
}

export function stripNewlines(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  return Effect.succeed(toString(input).replace(/\n/g, ""));
}

export function newlineToBr(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  return Effect.succeed(toString(input).replace(/\n/g, "<br>"));
}

export function escape(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  const str = toString(input);
  return Effect.succeed(
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  );
}

export function escapeOnce(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  const str = toString(input);
  // Only escape if not already escaped
  return Effect.succeed(
    str
      .replace(/&(?!amp;|lt;|gt;|quot;|#39;)/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  );
}

export function urlEncode(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  return Effect.succeed(encodeURIComponent(toString(input)));
}

export function urlDecode(
  input: unknown
): Effect.Effect<string, LiquidFilterError> {
  return Effect.try({
    try: () => decodeURIComponent(toString(input)),
    catch: (error) =>
      new LiquidFilterError({
        message: `Failed to decode URL: ${error instanceof Error ? error.message : String(error)}`,
        filterName: "url_decode",
        cause: error,
      }),
  });
}

export function truncate(
  input: unknown,
  length: unknown = 50,
  ellipsis: unknown = "..."
): Effect.Effect<string, LiquidFilterError> {
  const str = toString(input);
  const len = toNumber(length);
  const actualLen = len !== null ? len : 50;
  const ell = toString(ellipsis);

  if (str.length <= actualLen) {
    return Effect.succeed(str);
  }

  const maxLen = Math.max(0, Math.floor(actualLen) - ell.length);
  return Effect.succeed(str.slice(0, maxLen) + ell);
}

export function truncateWords(
  input: unknown,
  words: unknown = 15,
  ellipsis: unknown = "..."
): Effect.Effect<string, LiquidFilterError> {
  const str = toString(input);
  const wordCount = toNumber(words) ?? 15;
  const ell = toString(ellipsis);
  const wordArray = str.split(/\s+/);

  if (wordArray.length <= wordCount) {
    return Effect.succeed(str);
  }

  return Effect.succeed(wordArray.slice(0, wordCount).join(" ") + ell);
}

export function prepend(
  input: unknown,
  prefix: unknown
): Effect.Effect<string, LiquidFilterError> {
  return Effect.succeed(toString(prefix) + toString(input));
}

export function append(
  input: unknown,
  suffix: unknown
): Effect.Effect<string, LiquidFilterError> {
  return Effect.succeed(toString(input) + toString(suffix));
}

export function replace(
  input: unknown,
  search: unknown,
  replace: unknown
): Effect.Effect<string, LiquidFilterError> {
  const str = toString(input);
  const searchStr = toString(search);
  const replaceStr = toString(replace);
  return Effect.succeed(
    str.replace(
      new RegExp(searchStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      replaceStr
    )
  );
}

export function replaceFirst(
  input: unknown,
  search: unknown,
  replace: unknown
): Effect.Effect<string, LiquidFilterError> {
  const str = toString(input);
  const searchStr = toString(search);
  const replaceStr = toString(replace);
  return Effect.succeed(str.replace(searchStr, replaceStr));
}

export function remove(
  input: unknown,
  remove: unknown
): Effect.Effect<string, LiquidFilterError> {
  const str = toString(input);
  const removeStr = toString(remove);
  return Effect.succeed(
    str.replace(
      new RegExp(removeStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "g"),
      ""
    )
  );
}

export function removeFirst(
  input: unknown,
  remove: unknown
): Effect.Effect<string, LiquidFilterError> {
  const str = toString(input);
  const removeStr = toString(remove);
  return Effect.succeed(str.replace(removeStr, ""));
}

export function slice(
  input: unknown,
  offset: unknown,
  length?: unknown
): Effect.Effect<string, LiquidFilterError> {
  const str = toString(input);
  const off = toNumber(offset) ?? 0;
  const len = length !== undefined ? toNumber(length) : null;

  if (len !== null) {
    return Effect.succeed(str.slice(off, off + len));
  }
  return Effect.succeed(str.slice(off));
}

/**
 * Array filters
 */

export function first(
  input: unknown
): Effect.Effect<unknown, LiquidFilterError> {
  if (Array.isArray(input) && input.length > 0) {
    return Effect.succeed(input[0]);
  }
  return Effect.succeed(null);
}

export function last(
  input: unknown
): Effect.Effect<unknown, LiquidFilterError> {
  if (Array.isArray(input) && input.length > 0) {
    return Effect.succeed(input[input.length - 1]);
  }
  return Effect.succeed(null);
}

export function join(
  input: unknown,
  separator: unknown = ","
): Effect.Effect<string, LiquidFilterError> {
  if (!Array.isArray(input)) {
    return Effect.succeed(toString(input));
  }
  const sep = toString(separator);
  return Effect.succeed(input.map(toString).join(sep));
}

export function size(input: unknown): Effect.Effect<number, LiquidFilterError> {
  if (Array.isArray(input)) {
    return Effect.succeed(input.length);
  }
  if (typeof input === "string") {
    return Effect.succeed(input.length);
  }
  if (typeof input === "object" && input !== null) {
    return Effect.succeed(Object.keys(input).length);
  }
  return Effect.succeed(0);
}

export function sort(
  input: unknown
): Effect.Effect<readonly unknown[], LiquidFilterError> {
  if (!Array.isArray(input)) {
    return Effect.succeed([input]);
  }
  return Effect.succeed(
    [...input].sort((a, b) => {
      const aStr = toString(a);
      const bStr = toString(b);
      return aStr.localeCompare(bStr);
    })
  );
}

export function reverse(
  input: unknown
): Effect.Effect<readonly unknown[], LiquidFilterError> {
  if (!Array.isArray(input)) {
    return Effect.succeed([input]);
  }
  return Effect.succeed([...input].reverse());
}

export function uniq(
  input: unknown
): Effect.Effect<readonly unknown[], LiquidFilterError> {
  if (!Array.isArray(input)) {
    return Effect.succeed([input]);
  }
  const seen = new Set<string>();
  const result: unknown[] = [];
  for (const item of input) {
    const key = JSON.stringify(item);
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return Effect.succeed(result);
}

export function map(
  input: unknown,
  property: unknown
): Effect.Effect<readonly unknown[], LiquidFilterError> {
  if (!Array.isArray(input)) {
    return Effect.succeed([]);
  }
  const prop = toString(property);
  return Effect.succeed(
    input.map((item) => {
      if (typeof item === "object" && item !== null && prop in item) {
        return (item as Record<string, unknown>)[prop];
      }
      return null;
    })
  );
}

export function where(
  input: unknown,
  property: unknown,
  value: unknown
): Effect.Effect<readonly unknown[], LiquidFilterError> {
  if (!Array.isArray(input)) {
    return Effect.succeed([]);
  }
  const prop = toString(property);
  return Effect.succeed(
    input.filter((item) => {
      if (typeof item === "object" && item !== null && prop in item) {
        return (item as Record<string, unknown>)[prop] === value;
      }
      return false;
    })
  );
}

/**
 * Math filters
 */

export function plus(
  input: unknown,
  operand: unknown
): Effect.Effect<number, LiquidFilterError> {
  const inputNum = toNumber(input) ?? 0;
  const operandNum = toNumber(operand) ?? 0;
  return Effect.succeed(inputNum + operandNum);
}

export function minus(
  input: unknown,
  operand: unknown
): Effect.Effect<number, LiquidFilterError> {
  const inputNum = toNumber(input) ?? 0;
  const operandNum = toNumber(operand) ?? 0;
  return Effect.succeed(inputNum - operandNum);
}

export function times(
  input: unknown,
  operand: unknown
): Effect.Effect<number, LiquidFilterError> {
  const inputNum = toNumber(input) ?? 0;
  const operandNum = toNumber(operand) ?? 0;
  return Effect.succeed(inputNum * operandNum);
}

export function dividedBy(
  input: unknown,
  operand: unknown
): Effect.Effect<number, LiquidFilterError> {
  const inputNum = toNumber(input) ?? 0;
  const operandNum = toNumber(operand) ?? 0;

  if (operandNum === 0) {
    return Effect.fail(
      new LiquidFilterError({
        message: "Division by zero",
        filterName: "divided_by",
      })
    );
  }

  return Effect.succeed(Math.floor(inputNum / operandNum));
}

export function modulo(
  input: unknown,
  operand: unknown
): Effect.Effect<number, LiquidFilterError> {
  const inputNum = toNumber(input) ?? 0;
  const operandNum = toNumber(operand) ?? 0;

  if (operandNum === 0) {
    return Effect.fail(
      new LiquidFilterError({
        message: "Modulo by zero",
        filterName: "modulo",
      })
    );
  }

  return Effect.succeed(inputNum % operandNum);
}

export function round(
  input: unknown,
  precision: unknown = 0
): Effect.Effect<number, LiquidFilterError> {
  const inputNum = toNumber(input) ?? 0;
  const prec = toNumber(precision) ?? 0;
  const factor = 10 ** prec;
  return Effect.succeed(Math.round(inputNum * factor) / factor);
}

export function ceil(input: unknown): Effect.Effect<number, LiquidFilterError> {
  const inputNum = toNumber(input) ?? 0;
  return Effect.succeed(Math.ceil(inputNum));
}

export function floor(
  input: unknown
): Effect.Effect<number, LiquidFilterError> {
  const inputNum = toNumber(input) ?? 0;
  return Effect.succeed(Math.floor(inputNum));
}

/**
 * Date filters
 */

export function date(
  input: unknown,
  format: unknown = "%Y-%m-%d"
): Effect.Effect<string, LiquidFilterError> {
  const dateValue = input instanceof Date ? input : new Date(toString(input));
  if (Number.isNaN(dateValue.getTime())) {
    return Effect.succeed("");
  }

  const formatStr = toString(format);
  let result = formatStr;

  // Basic date formatting (simplified version)
  const year = dateValue.getFullYear();
  const month = String(dateValue.getMonth() + 1).padStart(2, "0");
  const day = String(dateValue.getDate()).padStart(2, "0");
  const hours = String(dateValue.getHours()).padStart(2, "0");
  const minutes = String(dateValue.getMinutes()).padStart(2, "0");
  const seconds = String(dateValue.getSeconds()).padStart(2, "0");

  result = result.replace(/%Y/g, String(year));
  result = result.replace(/%m/g, month);
  result = result.replace(/%d/g, day);
  result = result.replace(/%H/g, hours);
  result = result.replace(/%M/g, minutes);
  result = result.replace(/%S/g, seconds);

  return Effect.succeed(result);
}

/**
 * Default filter
 */

export function defaultFilter(
  input: unknown,
  defaultValue: unknown
): Effect.Effect<unknown, LiquidFilterError> {
  if (input === null || input === undefined || input === "") {
    return Effect.succeed(defaultValue);
  }
  if (Array.isArray(input) && input.length === 0) {
    return Effect.succeed(defaultValue);
  }
  return Effect.succeed(input);
}

/**
 * Registry of all built-in filters.
 */
export const builtInFilters: Record<
  string,
  (
    input: unknown,
    ...args: readonly unknown[]
  ) => Effect.Effect<unknown, LiquidFilterError>
> = {
  upcase,
  downcase,
  capitalize,
  strip,
  strip_html: stripHtml,
  strip_newlines: stripNewlines,
  newline_to_br: newlineToBr,
  escape,
  escape_once: escapeOnce,
  url_encode: urlEncode,
  url_decode: urlDecode,
  truncate,
  truncatewords: truncateWords,
  prepend,
  append,
  replace,
  replace_first: replaceFirst,
  remove,
  remove_first: removeFirst,
  slice,
  first,
  last,
  join,
  size,
  sort,
  reverse,
  uniq,
  map,
  where,
  plus,
  minus,
  times,
  divided_by: dividedBy,
  modulo,
  round,
  ceil,
  floor,
  date,
  default: defaultFilter,
};
