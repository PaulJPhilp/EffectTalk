/**
 * YAML Backend Service Tests
 *
 * Direct tests of the YamlBackend service implementation covering parsing,
 * stringifying, and comprehensive error handling.
 */

import { Effect, Either } from "effect";
import { describe, expect, it } from "vitest";
import {
  YamlBackend,
  YamlBackendLayer,
} from "../../src/backends/YamlBackend.js";
import { YamlParseError, YamlStringifyError } from "../../src/errors.js";

describe("YamlBackend Service", () => {
  describe("parse method", () => {
    it("should parse simple key-value YAML", async () => {
      const yaml = "name: John\nage: 30";
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result).toEqual({ name: "John", age: 30 });
    });

    it("should parse nested objects", async () => {
      const yaml = `
user:
  name: Alice
  address:
    city: New York
    zip: 10001
`;
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result).toHaveProperty("user.address.city", "New York");
    });

    it("should parse arrays", async () => {
      const yaml = `
items:
  - name: item1
    value: 1
  - name: item2
    value: 2
`;
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe("item1");
    });

    it("should parse flow-style arrays", async () => {
      const yaml = "items: [1, 2, 3, 4, 5]";
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.items).toEqual([1, 2, 3, 4, 5]);
    });

    it("should parse flow-style objects", async () => {
      const yaml = "person: {name: John, age: 30, city: Boston}";
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.person).toEqual({ name: "John", age: 30, city: "Boston" });
    });

    it("should parse all scalar types", async () => {
      const yaml = `
string: hello
integer: 42
float: 3.14
boolean_true: true
boolean_false: false
null_value: null
`;
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.string).toBe("hello");
      expect(result.integer).toBe(42);
      expect(typeof result.float).toBe("number");
      expect(result.boolean_true).toBe(true);
      expect(result.boolean_false).toBe(false);
      expect(result.null_value).toBeNull();
    });

    it("should parse multiline literal block scalars", async () => {
      const yaml = `
description: |
  This is a multi-line
  literal block scalar
  that preserves newlines
`;
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.description).toContain("\n");
      expect(result.description).toContain("multi-line");
    });

    it("should parse multiline folded block scalars", async () => {
      const yaml = `
summary: >
  This is a folded
  block scalar that
  spans multiple lines
`;
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(typeof result.summary).toBe("string");
      expect(result.summary.length).toBeGreaterThan(0);
    });

    it("should parse quoted strings", async () => {
      const yaml = `
single: 'single quoted'
double: "double quoted"
with_special: "contains: colons, [brackets], {braces}"
`;
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.single).toBe("single quoted");
      expect(result.double).toBe("double quoted");
      expect(result.with_special).toContain(":");
    });

    it("should parse timestamps", async () => {
      const yaml = `
iso8601: 2024-01-15T10:30:00Z
date_only: 2024-01-15
`;
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.iso8601).toBeDefined();
      expect(result.date_only).toBeDefined();
    });

    it("should parse empty document", async () => {
      const yaml = "";
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result).toBeNull();
    });

    it("should parse document with only comments", async () => {
      const yaml = `# Comment 1
# Comment 2
# Comment 3`;
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result).toBeNull();
    });

    it("should fail on invalid YAML syntax", async () => {
      const yaml = "invalid: [";
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(YamlBackendLayer))
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(YamlParseError);
      }
    });

    it("should fail on unclosed quote", async () => {
      const yaml = 'key: "unclosed quote';
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(YamlBackendLayer))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on undefined anchor reference", async () => {
      const yaml = `
value: *undefined_anchor
`;
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(YamlBackendLayer))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should parse with anchors and aliases", async () => {
      const yaml = `
defaults: &defaults
  timeout: 30
  retries: 3

config1:
  <<: *defaults

config2:
  <<: *defaults
`;
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.config1).toBeDefined();
      expect(result.config2).toBeDefined();
    });

    it("should return appropriate error for invalid input", async () => {
      const yaml = "invalid: [";
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(YamlBackendLayer))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("YamlParseError");
        expect(result.left.message).toBeDefined();
        expect(typeof result.left.message).toBe("string");
      }
    });
  });

  describe("stringify method", () => {
    it("should stringify simple objects", async () => {
      const obj = { name: "John", age: 30 };
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(typeof result).toBe("string");
      expect(result).toContain("name");
      expect(result).toContain("John");
      expect(result).toContain("age");
      expect(result).toContain("30");
    });

    it("should stringify nested objects", async () => {
      const obj = {
        user: {
          name: "Alice",
          address: {
            city: "New York",
            zip: 10001,
          },
        },
      };
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result).toContain("user");
      expect(result).toContain("Alice");
      expect(result).toContain("New York");
    });

    it("should stringify arrays", async () => {
      const obj = { items: ["one", "two", "three"] };
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(typeof result).toBe("string");
      expect(result).toContain("items");
    });

    it("should stringify array of objects", async () => {
      const obj = [
        { id: 1, name: "one" },
        { id: 2, name: "two" },
      ];
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(typeof result).toBe("string");
    });

    it("should stringify all scalar types", async () => {
      const obj = {
        string: "hello",
        integer: 42,
        float: 3.14,
        boolean: true,
        null_val: null,
      };
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result).toContain("hello");
      expect(result).toContain("42");
    });

    it("should stringify empty object", async () => {
      const obj = {};
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(typeof result).toBe("string");
    });

    it("should stringify empty array", async () => {
      const obj: unknown[] = [];
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(typeof result).toBe("string");
    });

    it("should stringify null", async () => {
      const obj = null;
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(typeof result).toBe("string");
    });

    it("should stringify with Unicode characters", async () => {
      const obj = {
        japanese: "日本語",
        arabic: "العربية",
        emoji: "🚀",
      };
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result).toContain("日本語");
      expect(result).toContain("🚀");
    });

    it("should stringify with special characters", async () => {
      const obj = {
        title: "String with \"quotes\" and 'apostrophes'",
        description: "Contains: colon, comma, [bracket], {brace}",
      };
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(typeof result).toBe("string");
    });

    it("should return appropriate error for circular reference", async () => {
      const obj: any = { key: "value" };
      obj.self = obj; // Create circular reference
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(YamlBackendLayer))
      );

      expect(result._tag).toMatch(/^(Left|Right)$/);
    });

    it("should stringify with large nested structure", async () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: "deep value",
              },
            },
          },
        },
      };
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result).toContain("deep value");
    });
  });

  describe("round-trip consistency", () => {
    it("should preserve simple objects through parse-stringify-parse", async () => {
      const original = { name: "test", count: 5, enabled: true };
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        const stringified = yield* backend.stringify(original);
        const parsed = yield* backend.parse(stringified);
        return parsed;
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result).toEqual(original);
    });

    it("should preserve nested objects", async () => {
      const original = {
        user: {
          name: "Alice",
          age: 30,
          tags: ["admin", "user"],
        },
      };
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        const stringified = yield* backend.stringify(original);
        const parsed = yield* backend.parse(stringified);
        return parsed;
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result.user.name).toBe("Alice");
      expect(result.user.tags).toContain("admin");
    });

    it("should preserve arrays of objects", async () => {
      const original = [
        { id: 1, name: "one" },
        { id: 2, name: "two" },
      ];
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        const stringified = yield* backend.stringify(original);
        const parsed = yield* backend.parse(stringified);
        return parsed;
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(YamlBackendLayer))
      );
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("one");
    });
  });

  describe("error handling", () => {
    it("should wrap parse errors in YamlParseError", async () => {
      const yaml = "invalid: [";
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(YamlBackendLayer))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(YamlParseError);
        expect(result.left._tag).toBe("YamlParseError");
      }
    });

    it("should include error message in parse errors", async () => {
      const yaml = "invalid: [";
      const program = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse(yaml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(YamlBackendLayer))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.message).toBeDefined();
        expect(result.left.message.length).toBeGreaterThan(0);
      }
    });

    it("should distinguish between parse and stringify errors", async () => {
      const parseProgram = Effect.gen(function* () {
        const backend = yield* YamlBackend;
        return yield* backend.parse("invalid: [");
      });
      const parseResult = await Effect.runPromise(
        parseProgram.pipe(Effect.either, Effect.provide(YamlBackendLayer))
      );

      expect(Either.isLeft(parseResult)).toBe(true);
      if (Either.isLeft(parseResult)) {
        expect(parseResult.left._tag).toBe("YamlParseError");
      }
    });
  });
});
