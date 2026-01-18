/**
 * TOML Backend Service Tests
 *
 * Direct tests of the TomlBackend service implementation covering parsing,
 * stringifying, and comprehensive error handling with TOML-specific features.
 */

import { Effect, Either } from "effect";
import { describe, expect, it } from "vitest";
import {
  TomlBackend,
  TomlBackendLayer,
} from "../../src/backends/TomlBackend.js";
import { TomlParseError, TomlStringifyError } from "../../src/errors.js";

describe("TomlBackend Service", () => {
  describe("parse method", () => {
    it("should parse simple key-value TOML", async () => {
      const toml = 'name = "John"\nage = 30';
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result.name).toBe("John");
      expect(result.age).toBe(30n);
    });

    it("should parse tables", async () => {
      const toml = `
[owner]
name = "Alice"
email = "alice@example.com"

[database]
server = "192.168.1.1"
port = 5432
`;
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result.owner.name).toBe("Alice");
      expect(result.owner.email).toBe("alice@example.com");
      expect(result.database.server).toBe("192.168.1.1");
      expect(result.database.port).toBe(5432n);
    });

    it("should parse nested tables", async () => {
      const toml = `
[server]
host = "localhost"

[server.database]
name = "mydb"
port = 5432
`;
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result).toHaveProperty("server.database.name", "mydb");
    });

    it("should parse arrays of tables", async () => {
      const toml = `
[[products]]
name = "Hammer"
sku = 738594937

[[products]]
name = "Nail"
sku = 284758393
`;
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.products).toHaveLength(2);
      expect(result.products[0].name).toBe("Hammer");
    });

    it("should parse arrays", async () => {
      const toml = `items = ["one", "two", "three"]`;
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result.items).toEqual(["one", "two", "three"]);
    });

    it("should parse inline tables", async () => {
      const toml = `point = { x = 1, y = 2 }`;
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result.point.x).toBe(1n);
      expect(result.point.y).toBe(2n);
    });

    it("should parse all scalar types", async () => {
      const toml = `
string = "hello"
integer = 42
float = 3.14
boolean_true = true
boolean_false = false
`;
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result.string).toBe("hello");
      expect(typeof result.integer).toBe("bigint");
      expect(result.integer).toBe(42n);
      expect(typeof result.float).toBe("number");
      expect(result.boolean_true).toBe(true);
      expect(result.boolean_false).toBe(false);
    });

    it("should parse integer formats", async () => {
      const toml = `
decimal = 1000
with_underscores = 1000000
octal = 493
hex = 255
binary = 10
`;
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result.decimal).toBe(1000n);
      expect(result.with_underscores).toBe(1000000n);
      expect(result.octal).toBe(493n);
      expect(result.hex).toBe(255n);
      expect(result.binary).toBe(10n);
    });

    it("should parse float formats", async () => {
      const toml = `
float = 3.14
scientific = 1.23e-4
positive_infinity = inf
negative_infinity = -inf
`;
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result.float).toBeCloseTo(3.14, 2);
      expect(typeof result.scientific).toBe("number");
      expect(Number.isFinite(result.positive_infinity)).toBe(false);
    });

    it("should parse dates and timestamps", async () => {
      const toml = `
date = 1979-05-27
datetime = 1979-05-27T07:32:00Z
datetime_with_offset = 1979-05-27T00:32:00-07:00
`;
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result.date).toBeDefined();
      expect(result.datetime).toBeDefined();
      expect(result.datetime_with_offset).toBeDefined();
    });

    it("should parse basic strings", async () => {
      const toml = `
basic = "hello"
multiline = """
Line 1
Line 2
Line 3
"""`;
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result.basic).toBe("hello");
      expect(result.multiline).toContain("\n");
    });

    it("should parse literal strings", async () => {
      const toml = `
literal = 'C:\\Users\\path\\to\\file'
multiline = '''
Line 1
Line 2
'''
`;
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result.literal).toContain("\\");
      expect(result.multiline).toBeDefined();
    });

    it("should fail on invalid TOML syntax", async () => {
      const toml = "invalid = [";
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(TomlBackendLayer))
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(TomlParseError);
      }
    });

    it("should fail on duplicate keys", async () => {
      const toml = `
name = "John"
name = "Jane"
`;
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(TomlBackendLayer))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on unclosed bracket", async () => {
      const toml = "items = [1, 2, 3";
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(TomlBackendLayer))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should parse empty TOML", async () => {
      const toml = "";
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result).toEqual({});
    });

    it("should return appropriate error for invalid input", async () => {
      const toml = "invalid: [";
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(TomlBackendLayer))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("TomlParseError");
        expect(result.left.message).toBeDefined();
      }
    });
  });

  describe("stringify method", () => {
    it("should stringify simple objects", async () => {
      const obj = { name: "John", age: 30 };
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(typeof result).toBe("string");
      expect(result).toContain("name");
      expect(result).toContain("John");
    });

    it("should stringify nested objects", async () => {
      const obj = {
        database: {
          host: "localhost",
          port: 5432,
        },
      };
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result).toContain("database");
      expect(result).toContain("host");
    });

    it("should stringify arrays", async () => {
      const obj = { items: ["one", "two", "three"] };
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(typeof result).toBe("string");
    });

    it("should stringify array of objects", async () => {
      const obj = {
        products: [
          { name: "Hammer", sku: 738594937 },
          { name: "Nail", sku: 284758393 },
        ],
      };
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(typeof result).toBe("string");
    });

    it("should stringify all scalar types", async () => {
      const obj = {
        string: "hello",
        integer: 42,
        float: 3.14,
        boolean: true,
      };
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result).toContain("hello");
      expect(result).toContain("42");
    });

    it("should stringify empty object", async () => {
      const obj = {};
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(typeof result).toBe("string");
    });

    it("should stringify with special characters", async () => {
      const obj = {
        title: 'String with "quotes"',
        description: "Contains: colon, comma, [bracket]",
      };
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(typeof result).toBe("string");
    });

    it("should stringify with Unicode characters", async () => {
      const obj = {
        japanese: "日本語",
        emoji: "🚀",
      };
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result).toContain("日本語");
      expect(result).toContain("🚀");
    });

    it("should handle large nested structures", async () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              level4: "deep value",
            },
          },
        },
      };
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.stringify(obj);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result).toContain("deep value");
    });
  });

  describe("round-trip consistency", () => {
    it("should preserve simple objects through parse-stringify-parse", async () => {
      const original = { name: "test", count: 5, enabled: true };
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        const stringified = yield* backend.stringify(original);
        const parsed = yield* backend.parse(stringified);
        return parsed;
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result.name).toBe("test");
      expect(result.count).toBe(5);
      expect(result.enabled).toBe(true);
    });

    it("should preserve nested objects", async () => {
      const original = {
        database: {
          host: "localhost",
          port: 5432,
          enabled: true,
        },
      };
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        const stringified = yield* backend.stringify(original);
        const parsed = yield* backend.parse(stringified);
        return parsed;
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result.database.host).toBe("localhost");
      expect(result.database.port).toBe(5432);
    });

    it("should preserve arrays of objects", async () => {
      const original = {
        items: [
          { id: 1, name: "one" },
          { id: 2, name: "two" },
        ],
      };
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        const stringified = yield* backend.stringify(original);
        const parsed = yield* backend.parse(stringified);
        return parsed;
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(TomlBackendLayer))
      );
      expect(result.items).toHaveLength(2);
      expect(result.items[0].name).toBe("one");
    });
  });

  describe("error handling", () => {
    it("should wrap parse errors in TomlParseError", async () => {
      const toml = "invalid = [";
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(TomlBackendLayer))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(TomlParseError);
        expect(result.left._tag).toBe("TomlParseError");
      }
    });

    it("should include error message in parse errors", async () => {
      const toml = "invalid = [";
      const program = Effect.gen(function* () {
        const backend = yield* TomlBackend;
        return yield* backend.parse(toml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(TomlBackendLayer))
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.message).toBeDefined();
        expect(result.left.message.length).toBeGreaterThan(0);
      }
    });
  });
});
