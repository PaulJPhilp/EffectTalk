/**
 * Tests for effect-json error types
 */

import { describe, expect, it } from "vitest";
import {
  ParseError,
  ValidationError,
  StringifyError,
  JsonLinesParseError,
} from "../errors.js";

describe("ParseError", () => {
  it("should create ParseError with all fields", () => {
    const error = new ParseError({
      message: "Invalid JSON",
      line: 1,
      column: 5,
      snippet: '{"invalid"',
      cause: new Error("Unexpected token"),
    });

    expect(error._tag).toBe("ParseError");
    expect(error.message).toBe("Invalid JSON");
    expect(error.line).toBe(1);
    expect(error.column).toBe(5);
    expect(error.snippet).toBe('{"invalid"');
    expect(error.cause?.message).toBe("Unexpected token");
  });

  it("should create ParseError without cause", () => {
    const error = new ParseError({
      message: "Invalid JSON",
      line: 2,
      column: 10,
      snippet: '"unterminated string',
    });

    expect(error._tag).toBe("ParseError");
    expect(error.cause).toBeUndefined();
  });

  it("should be instance of ParseError", () => {
    const error = new ParseError({
      message: "Error",
      line: 1,
      column: 1,
      snippet: "{}",
    });

    expect(error instanceof ParseError).toBe(true);
  });
});

describe("ValidationError", () => {
  it("should create ValidationError with all fields", () => {
    const error = new ValidationError({
      message: "Schema validation failed",
      schemaPath: "person.age",
      expected: "number",
      actual: "string",
      cause: new Error("Type mismatch"),
    });

    expect(error._tag).toBe("ValidationError");
    expect(error.message).toBe("Schema validation failed");
    expect(error.schemaPath).toBe("person.age");
    expect(error.expected).toBe("number");
    expect(error.actual).toBe("string");
    expect(error.cause?.message).toBe("Type mismatch");
  });

  it("should create ValidationError without cause", () => {
    const error = new ValidationError({
      message: "Invalid",
      schemaPath: "root",
      expected: { type: "object" },
      actual: "null",
    });

    expect(error._tag).toBe("ValidationError");
    expect(error.cause).toBeUndefined();
  });

  it("should support complex expected/actual values", () => {
    const expected = {
      type: "object",
      properties: { name: { type: "string" } },
    };
    const actual = { name: 123 };

    const error = new ValidationError({
      message: "Invalid object",
      schemaPath: "person",
      expected,
      actual,
    });

    expect(error.expected).toEqual(expected);
    expect(error.actual).toEqual(actual);
  });
});

describe("StringifyError", () => {
  it("should create StringifyError with schema_mismatch reason", () => {
    const error = new StringifyError({
      message: "Cannot stringify value",
      reason: "schema_mismatch",
      cause: new Error("Unexpected field"),
    });

    expect(error._tag).toBe("StringifyError");
    expect(error.message).toBe("Cannot stringify value");
    expect(error.reason).toBe("schema_mismatch");
    expect(error.cause?.message).toBe("Unexpected field");
  });

  it("should create StringifyError with type_error reason", () => {
    const error = new StringifyError({
      message: "Type error",
      reason: "type_error",
    });

    expect(error.reason).toBe("type_error");
    expect(error.cause).toBeUndefined();
  });

  it("should create StringifyError with cycle reason", () => {
    const error = new StringifyError({
      message: "Circular reference detected",
      reason: "cycle",
    });

    expect(error.reason).toBe("cycle");
  });

  it("should create StringifyError with unknown reason", () => {
    const error = new StringifyError({
      message: "Unknown error",
      reason: "unknown",
    });

    expect(error.reason).toBe("unknown");
  });

  it("should support all reason types", () => {
    const reasons: Array<
      "schema_mismatch" | "type_error" | "cycle" | "unknown"
    > = ["schema_mismatch", "type_error", "cycle", "unknown"];

    for (const reason of reasons) {
      const error = new StringifyError({
        message: "Error",
        reason,
      });
      expect(error.reason).toBe(reason);
    }
  });
});

describe("JsonLinesParseError", () => {
  it("should create JsonLinesParseError with all fields", () => {
    const error = new JsonLinesParseError({
      message: "Invalid JSON on line 3",
      lineNumber: 3,
      line: 3,
      column: 15,
      snippet: '{"incomplete"',
      cause: new Error("Unexpected EOF"),
    });

    expect(error._tag).toBe("JsonLinesParseError");
    expect(error.message).toBe("Invalid JSON on line 3");
    expect(error.lineNumber).toBe(3);
    expect(error.line).toBe(3);
    expect(error.column).toBe(15);
    expect(error.snippet).toBe('{"incomplete"');
    expect(error.cause?.message).toBe("Unexpected EOF");
  });

  it("should create JsonLinesParseError without cause", () => {
    const error = new JsonLinesParseError({
      message: "Parse error",
      lineNumber: 1,
      line: 1,
      column: 1,
      snippet: "invalid",
    });

    expect(error.cause).toBeUndefined();
  });

  it("should support 1-indexed line numbers", () => {
    const error = new JsonLinesParseError({
      message: "Error on first line",
      lineNumber: 1,
      line: 1,
      column: 1,
      snippet: "error",
    });

    expect(error.lineNumber).toBe(1);
    expect(error.line).toBe(1);
  });

  it("should track large line numbers", () => {
    const error = new JsonLinesParseError({
      message: "Error on line 1000",
      lineNumber: 1000,
      line: 1000,
      column: 50,
      snippet: "large file error",
    });

    expect(error.lineNumber).toBe(1000);
  });
});

describe("Error pattern matching", () => {
  it("should distinguish between error types", () => {
    const parseErr = new ParseError({
      message: "Parse error",
      line: 1,
      column: 1,
      snippet: "",
    });
    const validationErr = new ValidationError({
      message: "Validation error",
      schemaPath: "root",
      expected: "string",
      actual: 123,
    });
    const stringifyErr = new StringifyError({
      message: "Stringify error",
      reason: "cycle",
    });

    expect(parseErr._tag).toBe("ParseError");
    expect(validationErr._tag).toBe("ValidationError");
    expect(stringifyErr._tag).toBe("StringifyError");
  });

  it("should support instanceof checks", () => {
    const error = new ParseError({
      message: "Error",
      line: 1,
      column: 1,
      snippet: "",
    });

    expect(error instanceof ParseError).toBe(true);
    expect(error instanceof ValidationError).toBe(false);
  });
});

describe("Error cause chaining", () => {
  it("should support nested error causes", () => {
    const originalError = new Error("Original cause");
    const parseError = new ParseError({
      message: "Parse failed",
      line: 1,
      column: 1,
      snippet: "",
      cause: originalError,
    });

    expect(parseError.cause).toBe(originalError);
    expect(parseError.cause?.message).toBe("Original cause");
  });

  it("should chain multiple errors", () => {
    const level1 = new Error("Level 1");
    const level2 = new ParseError({
      message: "Level 2",
      line: 1,
      column: 1,
      snippet: "",
      cause: level1,
    });
    const level3 = new ValidationError({
      message: "Level 3",
      schemaPath: "root",
      expected: "string",
      actual: "number",
      cause: level2 as any,
    });

    expect(level3.cause).toBe(level2);
    expect(level2.cause).toBe(level1);
  });
});
