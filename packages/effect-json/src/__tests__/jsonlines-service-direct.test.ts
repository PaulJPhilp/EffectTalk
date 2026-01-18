/**
 * Direct JSON Lines Service Tests
 *
 * Tests the JsonLinesService wrapper and batch methods to improve coverage
 * of the service layer implementations.
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { JsonLinesService } from "../services/jsonlines/service.js";
import type { JsonLinesStringifyOptions } from "../services/jsonlines/types.js";

describe("JsonLinesService Direct Tests", () => {
  describe("parseBatch method", () => {
    it("should parse single line from string", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch('{"id":1,"name":"test"}');
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(1);
    });

    it("should parse multiple lines from string", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch('{"id":1}\n{"id":2}\n{"id":3}');
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(1);
      expect(result[2].id).toBe(3);
    });

    it("should parse from Buffer", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        const buffer = Buffer.from('{"id":1}\n{"id":2}');
        return yield* service.parseBatch(buffer);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toHaveLength(2);
    });

    it("should handle empty input", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch("");
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toHaveLength(0);
    });

    it("should skip blank lines", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch('{"id":1}\n\n{"id":2}');
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result.length).toBeGreaterThan(0);
    });

    it("should handle trailing newlines", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch('{"id":1}\n{"id":2}\n');
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toHaveLength(2);
    });

    it("should handle nested objects", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch('{"user":{"id":1,"name":"Alice"}}');
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toHaveLength(1);
      expect(typeof result[0]).toBe("object");
    });

    it("should handle arrays in values", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch('{"tags":["a","b","c"]}');
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toHaveLength(1);
      expect(Array.isArray(result[0].tags)).toBe(true);
    });

    it("should handle Unicode characters", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch('{"name":"José"}\n{"name":"日本"}');
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("José");
      expect(result[1].name).toBe("日本");
    });

    it("should handle null values", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch(
          '{"id":1,"value":null}\n{"id":2,"value":"test"}'
        );
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toHaveLength(2);
      expect(result[0].value).toBeNull();
    });

    it("should handle large number of lines", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        let jsonl = "";
        for (let i = 1; i <= 100; i++) {
          jsonl += `{"id":${i}}\n`;
        }
        return yield* service.parseBatch(jsonl);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toHaveLength(100);
      expect(result[0].id).toBe(1);
      expect(result[99].id).toBe(100);
    });

    it("should handle special JSON characters", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.parseBatch('{"text":"line1\\nline2\\ttab"}');
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toHaveLength(1);
      expect(result[0].text).toContain("\n");
    });
  });

  describe("stringifyBatch method", () => {
    it("should stringify single object", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch([{ id: 1, name: "test" }]);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(typeof result).toBe("string");
      expect(result).toContain("test");
    });

    it("should stringify multiple objects", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch([{ id: 1 }, { id: 2 }, { id: 3 }]);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      const lines = result.split("\n").filter((l) => l.length > 0);
      expect(lines.length).toBeGreaterThan(0);
    });

    it("should stringify empty array", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch([]);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toBe("");
    });

    it("should stringify with indent option", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        const options: JsonLinesStringifyOptions = { indent: 2 };
        return yield* service.stringifyBatch(
          [{ id: 1, name: "test" }],
          options
        );
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(typeof result).toBe("string");
    });

    it("should stringify with zero indent", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        const options: JsonLinesStringifyOptions = { indent: 0 };
        return yield* service.stringifyBatch([{ id: 1 }], options);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(typeof result).toBe("string");
    });

    it("should stringify without options", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch([{ id: 1 }, { id: 2 }]);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(typeof result).toBe("string");
    });

    it("should stringify nested objects", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch([
          { user: { id: 1, name: "Alice" } },
          { user: { id: 2, name: "Bob" } },
        ]);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toContain("Alice");
      expect(result).toContain("Bob");
    });

    it("should stringify with arrays", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch([{ tags: ["a", "b", "c"] }]);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toContain("a");
    });

    it("should stringify with Unicode", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch([
          { name: "José" },
          { name: "日本" },
        ]);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toContain("José");
      expect(result).toContain("日本");
    });

    it("should stringify with null values", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        return yield* service.stringifyBatch([{ id: 1, value: null }]);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      expect(result).toContain("null");
    });

    it("should stringify large batches", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        const data = Array.from({ length: 100 }, (_, i) => ({ id: i + 1 }));
        return yield* service.stringifyBatch(data);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );
      const lines = result.split("\n").filter((l) => l.length > 0);
      expect(lines.length).toBe(100);
    });
  });

  describe("round-trip operations", () => {
    it("should parse-stringify-parse consistently", async () => {
      const program = Effect.gen(function* () {
        const service = yield* JsonLinesService;
        const input = '{"id":1,"name":"test"}\n{"id":2,"name":"data"}';

        const parsed = yield* service.parseBatch(input);
        const stringified = yield* service.stringifyBatch(parsed);
        const reParsed = yield* service.parseBatch(stringified);

        return { parsed, stringified, reParsed };
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(JsonLinesService.Default))
      );

      expect(result.reParsed).toHaveLength(2);
      expect(result.reParsed[0].id).toBe(1);
      expect(result.reParsed[1].name).toBe("data");
    });
  });
});
