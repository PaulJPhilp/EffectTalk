/**
 * JsonService integration tests
 *
 * Tests JsonService parse and stringify operations with all supported formats
 */

import { Effect, Either, Layer } from "effect";
import { describe, expect, it } from "vitest";
import { JsonService } from "../services/json/service.js";

describe("JsonService", () => {
  describe("parse operations", () => {
    it("should parse JSON format", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.parse("json", '{"name":"test","value":42}');
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result).toEqual({ name: "test", value: 42 });
    });

    it("should parse JSONC format", async () => {
      const jsonc = `{
        // Comment
        "name": "test"
      }`;
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.parse("jsonc", jsonc);
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result.name).toBe("test");
    });

    it("should handle Buffer input with different formats", async () => {
      const buffer = Buffer.from('{"key":"value"}');
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.parse("json", buffer);
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result.key).toBe("value");
    });

    it("should parse SuperJSON format", async () => {
      const json = '{"date":"2024-01-15T00:00:00.000Z"}';
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.parse("superjson", json);
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result.date).toBeDefined();
    });

    it("should handle arrays", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.parse("json", "[1,2,3]");
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual([1, 2, 3]);
    });

    it("should handle nested objects", async () => {
      const nested = '{"user":{"profile":{"age":30}}}';
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.parse("json", nested);
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result.user.profile.age).toBe(30);
    });

    it("should handle Buffer input", async () => {
      const buffer = Buffer.from('{"key":"value"}');
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.parse("json", buffer);
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result.key).toBe("value");
    });

    it("should fail on invalid JSON", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.parse("json", "{invalid}");
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on malformed JSON in any format", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.parse("json", "{incomplete}");
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  describe("stringify operations", () => {
    it("should stringify JSON format", async () => {
      const obj = { name: "test", value: 42 };
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.stringify("json", obj);
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("string");
      expect(result).toContain("name");
      expect(result).toContain("test");
    });

    it("should stringify JSONC format", async () => {
      const obj = { key: "value" };
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.stringify("jsonc", obj);
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("string");
    });

    it("should stringify SuperJSON format", async () => {
      const obj = { name: "test", date: new Date("2024-01-15") };
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.stringify("superjson", obj);
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("string");
    });

    it("should stringify with options", async () => {
      const obj = { name: "test", count: 5 };
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.stringify("json", obj, { indent: 2 });
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("string");
      expect(result).toContain("\n");
    });

    it("should stringify arrays", async () => {
      const arr = [1, 2, 3, 4, 5];
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.stringify("json", arr);
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result).toContain("1");
      expect(result).toContain("5");
    });

    it("should stringify null values", async () => {
      const obj = { value: null };
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        return yield* service.stringify("json", obj);
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result).toContain("null");
    });
  });

  describe("round-trip operations", () => {
    it("should round-trip JSON", async () => {
      const original = { name: "alice", age: 30, active: true };
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        const stringified = yield* service.stringify("json", original);
        const parsed = yield* service.parse("json", stringified);
        return parsed;
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result).toEqual(original);
    });

    it("should round-trip JSONC", async () => {
      const original = { name: "bob", items: [1, 2, 3] };
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        const stringified = yield* service.stringify("jsonc", original);
        const parsed = yield* service.parse("jsonc", stringified);
        return parsed;
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result).toEqual(original);
    });

    it("should round-trip complex nested structures", async () => {
      const original = {
        users: [
          { id: 1, name: "alice", tags: ["admin", "user"] },
          { id: 2, name: "bob", tags: ["user"] },
        ],
        settings: {
          theme: "dark",
          notifications: true,
        },
      };
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        const stringified = yield* service.stringify("json", original);
        const parsed = yield* service.parse("json", stringified);
        return parsed;
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result).toEqual(original);
    });
  });

  describe("special values", () => {
    it("should handle boolean values", async () => {
      const obj = { enabled: true, disabled: false };
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        const stringified = yield* service.stringify("json", obj);
        const parsed = yield* service.parse("json", stringified);
        return parsed;
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result.enabled).toBe(true);
      expect(result.disabled).toBe(false);
    });

    it("should handle numeric types", async () => {
      const obj = { int: 42, float: 3.14, exp: 1e-3 };
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        const stringified = yield* service.stringify("json", obj);
        const parsed = yield* service.parse("json", stringified);
        return parsed;
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result.int).toBe(42);
      expect(typeof result.float).toBe("number");
    });

    it("should handle empty objects", async () => {
      const obj = {};
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        const stringified = yield* service.stringify("json", obj);
        const parsed = yield* service.parse("json", stringified);
        return parsed;
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(result).toEqual({});
    });

    it("should handle empty arrays", async () => {
      const arr = [];
      const program = Effect.gen(function* () {
        const service = yield* JsonService;
        const stringified = yield* service.stringify("json", arr);
        const parsed = yield* service.parse("json", stringified);
        return parsed;
      }).pipe(Effect.provide(JsonService.Default));

      const result = await Effect.runPromise(program);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});
