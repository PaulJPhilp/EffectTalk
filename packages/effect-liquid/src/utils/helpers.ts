/**
 * Checks if a value is truthy in Liquid terms.
 */
export function isTruthy(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value.length > 0 && value !== "false" && value !== "0";
  }
  if (typeof value === "number") {
    return value !== 0 && !Number.isNaN(value);
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (typeof value === "object") {
    return Object.keys(value).length > 0;
  }
  return Boolean(value);
}

/**
 * Trims whitespace from the start of a string.
 */
export function trimLeft(str: string): string {
  return str.replace(/^\s+/, "");
}

/**
 * Trims whitespace from the end of a string.
 */
export function trimRight(str: string): string {
  return str.replace(/\s+$/, "");
}

/**
 * Calculates line and column from position in source string.
 */
export function getPosition(
  source: string,
  position: number
): { line: number; column: number } {
  let line = 1;
  let column = 1;

  for (let i = 0; i < position && i < source.length; i++) {
    if (source[i] === "\n") {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return { line, column };
}
