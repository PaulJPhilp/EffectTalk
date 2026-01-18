import { Effect } from "effect";
import type { LiquidContext } from "../types.js";
import { LiquidContextError } from "../errors.js";

/**
 * Resolves a variable path from the context.
 * Supports dot notation (e.g., "user.name") and array indexing.
 */
export function resolveVariable(
  context: LiquidContext,
  path: string
): Effect.Effect<unknown, LiquidContextError> {
  return Effect.try({
    try: () => {
      const parts = path.split(".");
      let current: unknown = context;

      for (const part of parts) {
        if (current === null || current === undefined) {
          return null;
        }

        if (typeof current === "object" && current !== null) {
          if (Array.isArray(current)) {
            const index = Number.parseInt(part, 10);
            if (Number.isNaN(index)) {
              throw new Error(`Invalid array index: ${part}`);
            }
            current = current[index];
          } else {
            current = (current as Record<string, unknown>)[part];
          }
        } else {
          throw new Error(`Cannot access property '${part}' on non-object`);
        }
      }

      return current;
    },
    catch: (error) =>
      new LiquidContextError({
        message: `Failed to resolve variable '${path}': ${error instanceof Error ? error.message : String(error)}`,
        path,
        cause: error,
      }),
  });
}

/**
 * Coerces a value to a boolean for Liquid comparisons.
 */
export function toBoolean(value: unknown): boolean {
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
 * Coerces a value to a number for Liquid comparisons.
 */
export function toNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isNaN(value) ? null : value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "boolean") {
    return value ? 1 : 0;
  }
  return null;
}

/**
 * Coerces a value to a string for Liquid output.
 */
export function toString(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  if (Array.isArray(value)) {
    return value.map(toString).join("");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

/**
 * Compares two values using Liquid's comparison rules.
 */
export function compareValues(
  left: unknown,
  operator: "==" | "!=" | "<" | ">" | "<=" | ">=" | "contains",
  right: unknown
): boolean {
  switch (operator) {
    case "==":
      return left === right;
    case "!=":
      return left !== right;
    case "<": {
      const leftNum = toNumber(left);
      const rightNum = toNumber(right);
      if (leftNum !== null && rightNum !== null) {
        return leftNum < rightNum;
      }
      return toString(left) < toString(right);
    }
    case ">": {
      const leftNum = toNumber(left);
      const rightNum = toNumber(right);
      if (leftNum !== null && rightNum !== null) {
        return leftNum > rightNum;
      }
      return toString(left) > toString(right);
    }
    case "<=": {
      const leftNum = toNumber(left);
      const rightNum = toNumber(right);
      if (leftNum !== null && rightNum !== null) {
        return leftNum <= rightNum;
      }
      return toString(left) <= toString(right);
    }
    case ">=": {
      const leftNum = toNumber(left);
      const rightNum = toNumber(right);
      if (leftNum !== null && rightNum !== null) {
        return leftNum >= rightNum;
      }
      return toString(left) >= toString(right);
    }
    case "contains": {
      const leftStr = toString(left);
      const rightStr = toString(right);
      return leftStr.includes(rightStr);
    }
    default:
      return false;
  }
}
