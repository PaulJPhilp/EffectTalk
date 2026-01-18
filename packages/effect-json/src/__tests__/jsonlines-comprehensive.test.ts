/**
 * Comprehensive tests for JSON Lines functionality
 */

import { Effect, Schema } from "effect";
import { Either } from "effect";
import { describe, expect, it } from "vitest";
import { parseJsonLines, stringifyJsonLines } from "../JsonLines.js";

describe("JSON Lines Service", () => {
  describe("parseBatch", () => {
    it("should parse single line", async () => {
      const jsonl = '{"id":1,"name":"test"}';
      const schema = Schema.Struct({
        id: Schema.Number,
        name: Schema.String,
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(program);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
      expect(result[0].name).toBe("test");
    });

    it("should parse multiple lines", async () => {
      const jsonl = '{"id":1}\n{"id":2}\n{"id":3}';
      const schema = Schema.Struct({
        id: Schema.Number,
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(program);
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(1);
      expect(result[2].id).toBe(3);
    });

    it("should skip empty lines", async () => {
      const jsonl = '{"id":1}\n\n{"id":2}';
      const schema = Schema.Struct({
        id: Schema.Number,
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(program);
      expect(result.length).toBeGreaterThan(0);
      expect(result.some((r) => r.id === 1)).toBe(true);
      expect(result.some((r) => r.id === 2)).toBe(true);
    });

    it("should handle nested objects", async () => {
      const jsonl = '{"user":{"id":1,"name":"Alice"}}';
      const schema = Schema.Struct({
        user: Schema.Struct({
          id: Schema.Number,
          name: Schema.String,
        }),
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(program);
      expect(result).toHaveLength(1);
      expect(result[0].user.name).toBe("Alice");
    });

    it("should handle arrays", async () => {
      const jsonl = '{"tags":["a","b","c"]}';
      const schema = Schema.Struct({
        tags: Schema.Array(Schema.String),
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(program);
      expect(result).toHaveLength(1);
      expect(result[0].tags).toEqual(["a", "b", "c"]);
    });

    it("should fail on invalid JSON", async () => {
      const jsonl = '{"id":1}\n{invalid}\n{"id":3}';
      const schema = Schema.Struct({
        id: Schema.Number,
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on schema validation error", async () => {
      const jsonl = '{"id":"not a number"}';
      const schema = Schema.Struct({
        id: Schema.Number,
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on missing required fields", async () => {
      const jsonl = '{"name":"test"}';
      const schema = Schema.Struct({
        id: Schema.Number,
        name: Schema.String,
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should handle empty input", async () => {
      const jsonl = "";
      const schema = Schema.Struct({
        id: Schema.Number,
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(program);
      expect(result).toHaveLength(0);
    });

    it("should handle trailing newline", async () => {
      const jsonl = '{"id":1}\n{"id":2}\n';
      const schema = Schema.Struct({
        id: Schema.Number,
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(program);
      expect(result).toHaveLength(2);
    });

    it("should handle Unicode characters", async () => {
      const jsonl = '{"name":"José"}\n{"name":"日本"}';
      const schema = Schema.Struct({
        name: Schema.String,
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(program);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("José");
      expect(result[1].name).toBe("日本");
    });

    it("should handle optional fields", async () => {
      const jsonl = '{"id":1}\n{"id":2,"name":"test"}';
      const schema = Schema.Struct({
        id: Schema.Number,
        name: Schema.optional(Schema.String),
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(program);
      expect(result).toHaveLength(2);
      expect(result[0].name).toBeUndefined();
      expect(result[1].name).toBe("test");
    });

    it("should handle null values", async () => {
      const jsonl = '{"id":1,"value":null}\n{"id":2,"value":"test"}';
      const schema = Schema.Struct({
        id: Schema.Number,
        value: Schema.NullOr(Schema.String),
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(program);
      expect(result).toHaveLength(2);
      expect(result[0].value).toBeNull();
      expect(result[1].value).toBe("test");
    });

    it("should handle many lines", async () => {
      let jsonl = "";
      for (let i = 1; i <= 50; i++) {
        jsonl += `{"id":${i}}\n`;
      }

      const schema = Schema.Struct({
        id: Schema.Number,
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(program);
      expect(result).toHaveLength(50);
      expect(result[0].id).toBe(1);
      expect(result[49].id).toBe(50);
    });

    it("should handle large field values", async () => {
      const largeString = "x".repeat(500);
      const jsonl = `{"data":"${largeString}"}`;
      const schema = Schema.Struct({
        data: Schema.String,
      });

      const program = parseJsonLines(schema, jsonl);

      const result = await Effect.runPromise(program);
      expect(result).toHaveLength(1);
      expect(result[0].data).toHaveLength(500);
    });
  });

  describe("stringifyBatch", () => {
    it("should stringify single object", async () => {
      const schema = Schema.Struct({
        id: Schema.Number,
        name: Schema.String,
      });
      const data = [{ id: 1, name: "test" }];

      const program = stringifyJsonLines(schema, data);

      const result = await Effect.runPromise(program);
      expect(result).toContain('{"id":1');
      expect(result).toContain("test");
    });

    it("should stringify multiple objects", async () => {
      const schema = Schema.Struct({
        id: Schema.Number,
      });
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];

      const program = stringifyJsonLines(schema, data);

      const result = await Effect.runPromise(program);
      const lines = result.split("\n").filter((l) => l.length > 0);
      expect(lines.length).toBeGreaterThan(0);
    });

    it("should fail on schema validation error", async () => {
      const schema = Schema.Struct({
        id: Schema.Number,
      });
      const data = [{ id: "not a number" } as any];

      const program = stringifyJsonLines(schema, data);

      const result = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should handle empty array", async () => {
      const schema = Schema.Struct({
        id: Schema.Number,
      });
      const data: any[] = [];

      const program = stringifyJsonLines(schema, data);

      const result = await Effect.runPromise(program);
      expect(result).toBe("");
    });

    it("should support indent option", async () => {
      const schema = Schema.Struct({
        id: Schema.Number,
        name: Schema.String,
      });
      const data = [{ id: 1, name: "test" }];

      const program = stringifyJsonLines(schema, data, { indent: 2 });

      const result = await Effect.runPromise(program);
      expect(result).toBeTruthy();
    });
  });

  describe("Round-trip operations", () => {
    it("should parse then stringify consistently", async () => {
      const schema = Schema.Struct({
        id: Schema.Number,
        value: Schema.String,
      });
      const jsonl = '{"id":1,"value":"test"}\n{"id":2,"value":"data"}';

      const program = Effect.gen(function* () {
        const parsed = yield* parseJsonLines(schema, jsonl);
        const stringified = yield* stringifyJsonLines(schema, parsed);
        const reParsed = yield* parseJsonLines(schema, stringified);
        return reParsed;
      });

      const result = await Effect.runPromise(program);
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(1);
      expect(result[1].value).toBe("data");
    });
  });
});
