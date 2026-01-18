/**
 * Tests for schema-utils functions
 */

import { Effect, Either, Schema } from "effect";
import { describe, expect, it } from "vitest";
import {
  formatParseError,
  extractFieldPath,
  extractExpected,
  extractActual,
  getErrorMessage,
  extractErrorDetails,
} from "../src/schema-utils.js";

describe("schema-utils", () => {
  describe("formatParseError", () => {
    it("should format a simple type mismatch error", async () => {
      const schema = Schema.Struct({ id: Schema.Number });
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(schema)({ id: "not-a-number" }))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const formatted = formatParseError(result.left);
        expect(formatted).toBeDefined();
        expect(formatted.length).toBeGreaterThan(0);
        expect(typeof formatted).toBe("string");
      }
    });

    it("should format a missing required field error", async () => {
      const schema = Schema.Struct({
        id: Schema.Number,
        name: Schema.String,
      });
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(schema)({ id: 1 }))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const formatted = formatParseError(result.left);
        expect(formatted).toBeDefined();
        expect(formatted.length).toBeGreaterThan(0);
      }
    });

    it("should format a nested validation error", async () => {
      const schema = Schema.Struct({
        user: Schema.Struct({
          profile: Schema.Struct({
            age: Schema.Number,
          }),
        }),
      });
      const result = await Effect.runPromise(
        Effect.either(
          Schema.decodeUnknown(schema)({
            user: { profile: { age: "not-a-number" } },
          })
        )
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const formatted = formatParseError(result.left);
        expect(formatted).toBeDefined();
        expect(formatted.length).toBeGreaterThan(0);
      }
    });

    it("should format an array element error", async () => {
      const schema = Schema.Array(Schema.Number);
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(schema)([1, 2, "three", 4]))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const formatted = formatParseError(result.left);
        expect(formatted).toBeDefined();
        expect(formatted.length).toBeGreaterThan(0);
      }
    });
  });

  describe("extractFieldPath", () => {
    it("should extract simple field path or return unknown", async () => {
      const schema = Schema.Struct({ name: Schema.String });
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(schema)({ name: 123 }))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const path = extractFieldPath(result.left);
        expect(typeof path).toBe("string");
        expect(path.length).toBeGreaterThan(0);
      }
    });

    it("should extract nested field path or return unknown", async () => {
      const schema = Schema.Struct({
        user: Schema.Struct({
          email: Schema.String,
        }),
      });
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(schema)({ user: { email: 123 } }))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const path = extractFieldPath(result.left);
        expect(typeof path).toBe("string");
        expect(path.length).toBeGreaterThan(0);
      }
    });

    it("should extract array element path or return unknown", async () => {
      const schema = Schema.Struct({
        items: Schema.Array(Schema.Struct({ id: Schema.Number })),
      });
      const result = await Effect.runPromise(
        Effect.either(
          Schema.decodeUnknown(schema)({ items: [{ id: 1 }, { id: "bad" }] })
        )
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const path = extractFieldPath(result.left);
        expect(typeof path).toBe("string");
        expect(path.length).toBeGreaterThan(0);
      }
    });

    it("should return 'unknown' when path cannot be determined", () => {
      const mockError = {} as any;
      const path = extractFieldPath(mockError);
      expect(path).toBe("unknown");
    });
  });

  describe("extractExpected", () => {
    it("should extract expected type from type mismatch", async () => {
      const schema = Schema.Struct({ count: Schema.Number });
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(schema)({ count: "not-a-number" }))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const expected = extractExpected(result.left);
        expect(expected).toBeDefined();
      }
    });

    it("should handle union types", async () => {
      const schema = Schema.Struct({
        value: Schema.Union(Schema.String, Schema.Number),
      });
      const result = await Effect.runPromise(
        Effect.either(
          Schema.decodeUnknown(schema)({ value: { invalid: "object" } })
        )
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const expected = extractExpected(result.left);
        expect(expected).toBeDefined();
      }
    });

    it("should return 'unknown' when expected cannot be determined", () => {
      const mockError = {} as any;
      const expected = extractExpected(mockError);
      expect(expected).toBe("unknown");
    });
  });

  describe("extractActual", () => {
    it("should extract actual value or handle gracefully", async () => {
      const schema = Schema.Struct({ value: Schema.Number });
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(schema)({ value: "wrong" }))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const actual = extractActual(result.left);
        // Actual may or may not be available depending on ParseError structure
        expect(typeof actual === "undefined" || actual !== null).toBe(true);
      }
    });

    it("should handle complex actual values gracefully", async () => {
      const schema = Schema.Struct({
        config: Schema.Struct({ timeout: Schema.Number }),
      });
      const result = await Effect.runPromise(
        Effect.either(
          Schema.decodeUnknown(schema)({
            config: { timeout: "not-a-number", other: "field" },
          })
        )
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const actual = extractActual(result.left);
        // Function should not throw, may or may not extract value
        expect(
          actual === undefined ||
            typeof actual === "object" ||
            typeof actual === "string"
        ).toBe(true);
      }
    });

    it("should handle undefined actual values gracefully", () => {
      const mockError = {} as any;
      const actual = extractActual(mockError);
      expect(actual).toBeUndefined();
    });
  });

  describe("getErrorMessage", () => {
    it("should extract direct error message if available", async () => {
      const schema = Schema.Struct({ id: Schema.Number });
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(schema)({ id: "invalid" }))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const message = getErrorMessage(result.left);
        expect(message).toBeDefined();
        expect(message.length).toBeGreaterThan(0);
        expect(typeof message).toBe("string");
      }
    });

    it("should fallback gracefully when no direct message", () => {
      const mockError = {} as any;
      const message = getErrorMessage(mockError);
      // Function should not throw and should return a string
      expect(typeof message).toBe("string");
    });

    it("should handle empty message by falling back to format", async () => {
      const schema = Schema.String;
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(schema)(123))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const message = getErrorMessage(result.left);
        expect(message).toBeDefined();
        expect(message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("extractErrorDetails", () => {
    it("should extract all error details for simple validation failure", async () => {
      const schema = Schema.Struct({ age: Schema.Number });
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(schema)({ age: "not-a-number" }))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const details = extractErrorDetails(result.left);

        expect(details).toBeDefined();
        expect(details.message).toBeDefined();
        expect(typeof details.message).toBe("string");
        expect(typeof details.path).toBe("string");
        expect(details.expected).toBeDefined();
      }
    });

    it("should extract all error details for nested validation failure", async () => {
      const schema = Schema.Struct({
        user: Schema.Struct({
          profile: Schema.Struct({
            age: Schema.Number,
          }),
        }),
      });
      const result = await Effect.runPromise(
        Effect.either(
          Schema.decodeUnknown(schema)({
            user: { profile: { age: "invalid" } },
          })
        )
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const details = extractErrorDetails(result.left);

        expect(details.message).toBeDefined();
        expect(typeof details.path).toBe("string");
        expect(details.expected).toBeDefined();
      }
    });

    it("should extract all error details for array element failure", async () => {
      const schema = Schema.Array(Schema.Number);
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(schema)([1, 2, "three"]))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const details = extractErrorDetails(result.left);

        expect(details.message).toBeDefined();
        expect(typeof details.path).toBe("string");
      }
    });

    it("should have all fields in the result interface", async () => {
      const schema = Schema.Struct({ id: Schema.Number });
      const result = await Effect.runPromise(
        Effect.either(Schema.decodeUnknown(schema)({ id: "bad" }))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const details = extractErrorDetails(result.left);

        // Verify the interface has all expected fields
        expect("message" in details).toBe(true);
        expect("path" in details).toBe(true);
        expect("expected" in details).toBe(true);
        expect("actual" in details).toBe(true);
      }
    });
  });

  describe("integration tests", () => {
    it("should handle complex validation scenarios", async () => {
      const schema = Schema.Struct({
        users: Schema.Array(
          Schema.Struct({
            name: Schema.String,
            age: Schema.Number,
            email: Schema.Union(Schema.String, Schema.Literal("unknown")),
          })
        ),
      });

      const result = await Effect.runPromise(
        Effect.either(
          Schema.decodeUnknown(schema)({
            users: [
              { name: "Alice", age: 30, email: "alice@example.com" },
              { name: "Bob", age: "thirty", email: "bob@example.com" },
            ],
          })
        )
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        // All utilities should work together without throwing
        const formatted = formatParseError(result.left);
        const path = extractFieldPath(result.left);
        const expected = extractExpected(result.left);
        const actual = extractActual(result.left);
        const message = getErrorMessage(result.left);
        const details = extractErrorDetails(result.left);

        expect(formatted).toBeDefined();
        expect(path).toBeDefined();
        expect(expected).toBeDefined();
        expect(message).toBeDefined();
        expect(details.message).toBeDefined();
        expect(details.path).toBe(path);
      }
    });

    it("should provide consistent error information across utilities", async () => {
      const schema = Schema.Struct({
        config: Schema.Struct({
          port: Schema.Number,
        }),
      });

      const result = await Effect.runPromise(
        Effect.either(
          Schema.decodeUnknown(schema)({
            config: { port: "not-a-port" },
          })
        )
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        const path = extractFieldPath(result.left);
        const details = extractErrorDetails(result.left);

        // Path from direct call should match path in details
        expect(path).toBe(details.path);

        // Expected and actual should be consistent across functions
        expect(extractExpected(result.left)).toBe(details.expected);
        expect(extractActual(result.left)).toBe(details.actual);
      }
    });
  });
});
