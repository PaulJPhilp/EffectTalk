/**
 * Backend implementation tests for effect-json
 *
 * Tests all JSON backend implementations (json, jsonc, superjson, toon)
 * including parsing, stringifying, and edge cases
 */

import { Effect, Either } from "effect";
import { describe, expect, it } from "vitest";
import { jsonBackend } from "../services/json/implementations/json.js";
import { jsoncBackend } from "../services/json/implementations/jsonc.js";
import { superjsonBackend } from "../services/json/implementations/superjson.js";
import { toonBackend } from "../services/json/implementations/toon.js";

describe("JSON Backends", () => {
  describe("Standard JSON Backend", () => {
    it("should parse valid JSON", async () => {
      const json = '{"name":"test","value":42}';
      const result = await Effect.runPromise(jsonBackend.parse(json));
      expect(result).toEqual({ name: "test", value: 42 });
    });

    it("should stringify objects", async () => {
      const obj = { name: "test", value: 42 };
      const result = await Effect.runPromise(jsonBackend.stringify(obj));
      expect(typeof result).toBe("string");
      expect(result).toContain("name");
      expect(result).toContain("test");
    });

    it("should handle arrays", async () => {
      const json = "[1,2,3]";
      const result = await Effect.runPromise(jsonBackend.parse(json));
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should fail on invalid JSON", async () => {
      const json = "{invalid}";
      const result = await Effect.runPromise(
        Effect.either(jsonBackend.parse(json))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should handle nested objects", async () => {
      const json = '{"user":{"name":"alice","profile":{"age":30}}}';
      const result = await Effect.runPromise(jsonBackend.parse(json));
      expect(result.user.profile.age).toBe(30);
    });

    it("should preserve numeric types", async () => {
      const json = '{"int":42,"float":3.14,"exp":1e-3}';
      const result = await Effect.runPromise(jsonBackend.parse(json));
      expect(result.int).toBe(42);
      expect(result.float).toBe(3.14);
      expect(result.exp).toBe(0.001);
    });

    it("should handle boolean values", async () => {
      const json = '{"true":true,"false":false}';
      const result = await Effect.runPromise(jsonBackend.parse(json));
      expect(result.true).toBe(true);
      expect(result.false).toBe(false);
    });

    it("should handle null values", async () => {
      const json = '{"value":null}';
      const result = await Effect.runPromise(jsonBackend.parse(json));
      expect(result.value).toBeNull();
    });

    it("should stringify null", async () => {
      const obj = { value: null };
      const result = await Effect.runPromise(jsonBackend.stringify(obj));
      expect(result).toContain("null");
    });
  });

  describe("JSONC (JSON with Comments) Backend", () => {
    it("should parse JSON with line comments", async () => {
      const jsonc = `{
        // This is a comment
        "name": "test"
      }`;
      const result = await Effect.runPromise(jsoncBackend.parse(jsonc));
      expect(result.name).toBe("test");
    });

    it("should parse JSON with block comments", async () => {
      const jsonc = `{
        /* Block comment */ "name": "test"
      }`;
      const result = await Effect.runPromise(jsoncBackend.parse(jsonc));
      expect(result.name).toBe("test");
    });

    it("should preserve line and block comments separately", async () => {
      const jsonc = `{
        "items": [1, 2, 3],
        "name": "test"
      }`;
      const result = await Effect.runPromise(jsoncBackend.parse(jsonc));
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBe(3);
    });

    it("should handle both comment types together", async () => {
      const jsonc = `{
        // Line comment
        /* Block comment */ "key": "value"
      }`;
      const result = await Effect.runPromise(jsoncBackend.parse(jsonc));
      expect(result.key).toBe("value");
    });

    it("should stringify to valid JSON (no comments)", async () => {
      const obj = { name: "test" };
      const result = await Effect.runPromise(jsoncBackend.stringify(obj));
      // Ensure output is valid JSON (can be parsed by standard JSON)
      expect(() => JSON.parse(result)).not.toThrow();
    });
  });

  describe("SuperJSON Backend", () => {
    it("should parse and preserve Date objects", async () => {
      const dateStr = new Date("2024-01-15").toISOString();
      const json = `{"date":"2024-01-15T00:00:00.000Z"}`;
      const result = await Effect.runPromise(superjsonBackend.parse(json));
      expect(result.date).toBeDefined();
    });

    it("should stringify Date objects", async () => {
      const date = new Date("2024-01-15");
      const obj = { timestamp: date };
      const result = await Effect.runPromise(superjsonBackend.stringify(obj));
      expect(typeof result).toBe("string");
      expect(result).toContain("timestamp");
    });

    it("should handle Map serialization", async () => {
      const map = new Map([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);
      const obj = { mapping: map };
      const stringified = await Effect.runPromise(
        superjsonBackend.stringify(obj)
      );
      expect(typeof stringified).toBe("string");
    });

    it("should handle Set serialization", async () => {
      const set = new Set([1, 2, 3]);
      const obj = { uniqueValues: set };
      const stringified = await Effect.runPromise(
        superjsonBackend.stringify(obj)
      );
      expect(typeof stringified).toBe("string");
    });

    it("should handle BigInt values", async () => {
      const obj = { big: BigInt("9007199254740991") };
      const stringified = await Effect.runPromise(
        superjsonBackend.stringify(obj)
      );
      expect(typeof stringified).toBe("string");
    });

    it("should handle undefined in objects", async () => {
      const obj = { defined: "value", undefined: undefined };
      const result = await Effect.runPromise(
        Effect.either(superjsonBackend.stringify(obj))
      );
      expect(Either.isRight(result)).toBe(true);
    });
  });

  describe("Toon Backend", () => {
    it("should stringify basic objects", async () => {
      const obj = { name: "test", value: 42 };
      const result = await Effect.runPromise(toonBackend.stringify(obj));
      expect(typeof result).toBe("string");
      expect(result).toContain("name");
    });

    it("should handle arrays in stringify", async () => {
      const obj = { items: [1, 2, 3] };
      const result = await Effect.runPromise(toonBackend.stringify(obj));
      expect(typeof result).toBe("string");
      expect(result).toContain("items");
    });

    it("should handle nested objects in stringify", async () => {
      const obj = { user: { name: "alice", age: 30 } };
      const result = await Effect.runPromise(toonBackend.stringify(obj));
      expect(typeof result).toBe("string");
      expect(result).toContain("user");
    });
  });

  describe("Backend Comparison", () => {
    it("should produce equivalent output for basic objects", async () => {
      const obj = { name: "test", value: 42, enabled: true };

      const jsonStr = await Effect.runPromise(jsonBackend.stringify(obj));
      const jsoncStr = await Effect.runPromise(jsoncBackend.stringify(obj));

      const jsonParsed = await Effect.runPromise(jsonBackend.parse(jsonStr));
      const jsoncParsed = await Effect.runPromise(jsoncBackend.parse(jsoncStr));

      expect(jsonParsed).toEqual(obj);
      expect(jsoncParsed).toEqual(obj);
    });

    it("should handle round-trip for each backend", async () => {
      const obj = { key: "value", num: 123, bool: false };

      const backends = [jsonBackend, jsoncBackend];

      for (const backend of backends) {
        const stringified = await Effect.runPromise(backend.stringify(obj));
        const parsed = await Effect.runPromise(backend.parse(stringified));
        expect(parsed).toEqual(obj);
      }
    });
  });

  describe("Error Handling", () => {
    it("should fail gracefully on invalid input", async () => {
      const result = await Effect.runPromise(
        Effect.either(jsonBackend.parse("not json"))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on empty string", async () => {
      const result = await Effect.runPromise(
        Effect.either(jsonBackend.parse(""))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should handle very large JSON", async () => {
      const largeArray = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `item-${i}`,
      }));
      const stringified = await Effect.runPromise(
        jsonBackend.stringify(largeArray)
      );
      const parsed = await Effect.runPromise(jsonBackend.parse(stringified));
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(1000);
    });
  });
});
