/**
 * Tests for TOON (experimental) module
 *
 * TOON is a compact, human-readable encoding format for JSON-like data
 */

import { Effect, Schema } from "effect";
import { Either } from "effect";
import { describe, expect, it } from "vitest";
import { parseToon, stringifyToon } from "../Toon.js";

describe("TOON Module", () => {
  describe("parseToon - Basic operations", () => {
    it("should handle valid TOON input", async () => {
      const schema = Schema.Null;
      const result = await Effect.runPromise(parseToon(schema, "null"));
      expect(result).toBeNull();
    });

    it("should parse numbers", async () => {
      const schema = Schema.Number;
      const result = await Effect.runPromise(parseToon(schema, "42"));
      expect(result).toBe(42);
    });

    it("should parse booleans", async () => {
      const schema = Schema.Boolean;
      const result = await Effect.runPromise(parseToon(schema, "true"));
      expect(result).toBe(true);
    });

    it("should parse strings", async () => {
      const schema = Schema.String;
      const result = await Effect.runPromise(parseToon(schema, '"hello"'));
      expect(result).toBe("hello");
    });
  });

  describe("parseToon - Error Handling", () => {
    it("should fail on invalid input", async () => {
      const schema = Schema.Number;
      const result = await Effect.runPromise(
        Effect.either(parseToon(schema, "invalid"))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on type mismatch", async () => {
      const schema = Schema.Number;
      const result = await Effect.runPromise(
        Effect.either(parseToon(schema, '"string"'))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on empty input", async () => {
      const schema = Schema.String;
      const result = await Effect.runPromise(
        Effect.either(parseToon(schema, ""))
      );
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  describe("stringifyToon - Basic operations", () => {
    it("should stringify null", async () => {
      const schema = Schema.Null;
      const result = await Effect.runPromise(stringifyToon(schema, null));
      expect(result).toBe("null");
    });

    it("should stringify booleans", async () => {
      const schema = Schema.Boolean;
      const resultTrue = await Effect.runPromise(stringifyToon(schema, true));
      expect(resultTrue).toBe("true");

      const resultFalse = await Effect.runPromise(stringifyToon(schema, false));
      expect(resultFalse).toBe("false");
    });

    it("should stringify numbers", async () => {
      const schema = Schema.Number;
      const result = await Effect.runPromise(stringifyToon(schema, 42));
      expect(result).toBe("42");
    });

    it("should handle string stringify", async () => {
      const schema = Schema.String;
      const result = await Effect.runPromise(stringifyToon(schema, "test"));
      expect(result).toBeTruthy();
    });

    it("should handle negative numbers", async () => {
      const schema = Schema.Number;
      const result = await Effect.runPromise(stringifyToon(schema, -17));
      expect(result).toBe("-17");
    });
  });

  describe("stringifyToon - Collections", () => {
    it("should handle array stringify", async () => {
      const schema = Schema.Array(Schema.Number);
      const result = await Effect.runPromise(stringifyToon(schema, [1, 2, 3]));
      expect(result).toBeTruthy();
    });

    it("should handle empty array", async () => {
      const schema = Schema.Array(Schema.Number);
      const result = await Effect.runPromise(stringifyToon(schema, []));
      expect(result).toBeTruthy();
    });

    it("should handle object stringify", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
        age: Schema.Number,
      });
      const result = await Effect.runPromise(
        stringifyToon(schema, { name: "Alice", age: 30 })
      );
      expect(result).toBeTruthy();
      expect(result).toContain("Alice");
    });

    it("should handle empty object", async () => {
      const schema = Schema.Struct({});
      const result = await Effect.runPromise(stringifyToon(schema, {}));
      // TOON stringify of empty object returns empty string or minimal representation
      expect(result !== undefined && result !== null).toBe(true);
    });
  });

  describe("stringifyToon - Options", () => {
    it("should support indent option", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
      });
      const result = await Effect.runPromise(
        stringifyToon(schema, { name: "Test" }, { indent: 2 })
      );
      expect(result).toBeTruthy();
    });

    it("should support zero indent", async () => {
      const schema = Schema.Struct({
        name: Schema.String,
      });
      const result = await Effect.runPromise(
        stringifyToon(schema, { name: "Test" }, { indent: 0 })
      );
      expect(result).toBeTruthy();
    });

    it("should work with default options", async () => {
      const schema = Schema.Struct({
        value: Schema.Number,
      });
      const result = await Effect.runPromise(
        stringifyToon(schema, { value: 42 })
      );
      expect(result).toBeTruthy();
    });
  });

  describe("stringifyToon - Error Handling", () => {
    it("should fail on schema validation error", async () => {
      const schema = Schema.Number;
      const result = await Effect.runPromise(
        Effect.either(stringifyToon(schema, "not a number" as any))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should handle type mismatches", async () => {
      const schema = Schema.Struct({
        count: Schema.Number,
      });
      const result = await Effect.runPromise(
        Effect.either(stringifyToon(schema, { count: "not a number" } as any))
      );
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  describe("Round-trip operations", () => {
    it("should round-trip numbers", async () => {
      const schema = Schema.Number;
      const original = 42;

      const stringified = await Effect.runPromise(
        stringifyToon(schema, original)
      );
      expect(stringified).toBeTruthy();

      const parsed = await Effect.runPromise(parseToon(schema, stringified));
      expect(parsed).toBe(original);
    });

    it("should round-trip booleans", async () => {
      const schema = Schema.Boolean;
      const original = true;

      const stringified = await Effect.runPromise(
        stringifyToon(schema, original)
      );
      expect(stringified).toBeTruthy();

      const parsed = await Effect.runPromise(parseToon(schema, stringified));
      expect(parsed).toBe(original);
    });

    it("should round-trip null", async () => {
      const schema = Schema.Null;
      const original = null;

      const stringified = await Effect.runPromise(
        stringifyToon(schema, original)
      );
      expect(stringified).toBeTruthy();

      const parsed = await Effect.runPromise(parseToon(schema, stringified));
      expect(parsed).toBeNull();
    });
  });

  describe("Complex data structures", () => {
    it("should handle nested objects", async () => {
      const schema = Schema.Struct({
        outer: Schema.Struct({
          inner: Schema.Number,
        }),
      });
      const data = { outer: { inner: 42 } };

      const stringified = await Effect.runPromise(stringifyToon(schema, data));
      expect(stringified).toBeTruthy();

      const parsed = await Effect.runPromise(parseToon(schema, stringified));
      expect(parsed).toEqual(data);
    });

    it("should handle complex structures with arrays", async () => {
      const schema = Schema.Array(
        Schema.Struct({
          id: Schema.Number,
        })
      );
      const data = [{ id: 1 }, { id: 2 }];

      const stringified = await Effect.runPromise(stringifyToon(schema, data));
      expect(stringified).toBeTruthy();

      const parsed = await Effect.runPromise(parseToon(schema, stringified));
      expect(parsed).toEqual(data);
    });
  });
});
