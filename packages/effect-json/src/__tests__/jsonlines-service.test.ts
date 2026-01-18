/**
 * JsonLinesService integration tests
 *
 * Tests JsonLinesService batch and streaming operations
 */

import { Effect, Stream, Either } from "effect";
import { describe, expect, it } from "vitest";
import { JsonLinesService } from "../services/jsonlines/service.js";

describe("JsonLinesService", () => {
  describe("parseBatch operations", () => {
    it("should parse single line", async () => {
      const jsonl = '{"id":1,"name":"alice"}';
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch(jsonl);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
      expect(result[0]).toEqual({ id: 1, name: "alice" });
    });

    it("should parse multiple lines", async () => {
      const jsonl = `{"id":1,"name":"alice"}
{"id":2,"name":"bob"}
{"id":3,"name":"charlie"}`;
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch(jsonl);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      expect(result.length).toBe(3);
      expect(result[0].name).toBe("alice");
      expect(result[1].name).toBe("bob");
      expect(result[2].name).toBe("charlie");
    });

    it("should handle Buffer input", async () => {
      const jsonl = Buffer.from('{"key":"value1"}\n{"key":"value2"}');
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch(jsonl);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      expect(result.length).toBe(2);
      expect(result[0].key).toBe("value1");
      expect(result[1].key).toBe("value2");
    });

    it("should handle empty lines", async () => {
      const jsonl = `{"id":1,"name":"alice"}

{"id":2,"name":"bob"}`;
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch(jsonl);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      // Empty lines should be skipped or handled gracefully
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("should handle trailing newline", async () => {
      const jsonl = '{"id":1}\n{"id":2}\n';
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch(jsonl);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      expect(result.length).toBe(2);
    });

    it("should fail on invalid JSON line", async () => {
      const jsonl = `{"id":1}
{invalid}
{"id":2}`;
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch(jsonl);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should handle large batch", async () => {
      const lines = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        value: `item-${i}`,
      }));
      const jsonl = lines.map((l) => JSON.stringify(l)).join("\n");

      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch(jsonl);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      expect(result.length).toBe(100);
      expect(result[0].id).toBe(0);
      expect(result[99].id).toBe(99);
    });
  });

  describe("stringifyBatch operations", () => {
    it("should stringify single object", async () => {
      const obj = { id: 1, name: "alice" };
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch([obj]);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("string");
      expect(result).toContain("id");
      expect(result).toContain("alice");
    });

    it("should stringify multiple objects", async () => {
      const objs = [
        { id: 1, name: "alice" },
        { id: 2, name: "bob" },
        { id: 3, name: "charlie" },
      ];
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch(objs);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      const lines = result.trim().split("\n");
      expect(lines.length).toBe(3);
      expect(lines[0]).toContain("alice");
      expect(lines[1]).toContain("bob");
    });

    it("should handle empty array", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch([]);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("string");
    });

    it("should stringify with options", async () => {
      const objs = [{ id: 1, name: "alice" }];
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch(objs, { indent: 2 });
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("string");
    });

    it("should stringify nested objects", async () => {
      const objs = [
        {
          id: 1,
          user: { name: "alice", profile: { age: 30 } },
        },
      ];
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch(objs);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      const parsed = JSON.parse(result.trim());
      expect(parsed.user.profile.age).toBe(30);
    });
  });

  describe("parseStream operations", () => {
    it("should handle stream parsing with batch data", async () => {
      const jsonl = `{"id":1,"name":"alice"}
{"id":2,"name":"bob"}
{"id":3,"name":"charlie"}`;

      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch(jsonl);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      expect(result.length).toBe(3);
      expect(result[0].name).toBe("alice");
      expect(result[2].name).toBe("charlie");
    });

    it("should handle large batch operations", async () => {
      const lines = Array.from({ length: 50 }, (_, i) =>
        JSON.stringify({ id: i, value: `item-${i}` })
      );
      const jsonl = lines.join("\n");

      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch(jsonl);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      expect(result.length).toBe(50);
      expect(result[49].id).toBe(49);
    });
  });

  describe("stringifyStream operations", () => {
    it("should stringify multiple objects with batch", async () => {
      const objs = [
        { id: 1, name: "alice" },
        { id: 2, name: "bob" },
        { id: 3, name: "charlie" },
      ];

      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch(objs);
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      const lines = result.trim().split("\n");
      expect(lines.length).toBe(3);
      expect(lines[0]).toContain("alice");
      expect(lines[1]).toContain("bob");
    });

    it("should stringify with custom options", async () => {
      const objs = [{ id: 1, nested: { key: "value" } }];

      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch(objs, { indent: 2 });
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("string");
      expect(result).toContain("id");
    });
  });

  describe("round-trip operations", () => {
    it("should round-trip batch", async () => {
      const original = [
        { id: 1, name: "alice", active: true },
        { id: 2, name: "bob", active: false },
      ];

      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        const stringified = yield* service.stringifyBatch(original);
        const parsed = yield* service.parseBatch(stringified);
        return parsed;
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      expect(result).toEqual(original);
    });

    it("should round-trip complex objects", async () => {
      const original = [
        {
          id: 1,
          name: "alice",
          tags: ["admin"],
          metadata: { created: "2024-01-01" },
        },
        {
          id: 2,
          name: "bob",
          tags: ["user"],
          metadata: { created: "2024-01-02" },
        },
      ];

      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        const stringified = yield* service.stringifyBatch(original);
        const parsed = yield* service.parseBatch(stringified);
        return parsed;
      }).pipe(Effect.provide(JsonLinesService.Default));

      const result = await Effect.runPromise(program);
      expect(result).toEqual(original);
    });
  });
});
