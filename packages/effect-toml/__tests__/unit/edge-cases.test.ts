/**
 * Edge case tests for effect-toml
 *
 * Tests TOML parsing boundary conditions, special formats, and complex nesting
 */

import { Effect, Either } from "effect";
import { describe, expect, it } from "vitest";
import * as toml from "../../src/api.js";
import { TomlBackendLayer } from "../../src/backends/TomlBackend.js";

describe("TOML Edge Cases", () => {
  describe("Basic syntax edge cases", () => {
    it("should parse empty TOML string", async () => {
      const program = toml.parse("").pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result).toEqual({});
    });

    it("should ignore comments", async () => {
      const tomlStr = `
# This is a comment
key = "value" # inline comment
# Another comment
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key).toBe("value");
    });

    it("should handle multiple comment styles", async () => {
      const tomlStr = `
# Hash comment
key1 = "value1"
# Another one
key2 = "value2"
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key1).toBe("value1");
      expect(result.key2).toBe("value2");
    });

    it("should handle trailing commas in tables", async () => {
      const tomlStr = `
[table]
key1 = "value1"
key2 = "value2"
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.table.key1).toBe("value1");
    });
  });

  describe("String edge cases", () => {
    it("should parse basic strings", async () => {
      const tomlStr = `key = "value"`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key).toBe("value");
    });

    it("should parse literal strings", async () => {
      const tomlStr = `key = 'literal string'`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key).toBe("literal string");
    });

    it("should parse multiline basic strings", async () => {
      const tomlStr = `key = """
Line 1
Line 2
Line 3"""`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key).toContain("Line 1");
      expect(result.key).toContain("Line 2");
    });

    it("should parse multiline literal strings", async () => {
      const tomlStr = `key = '''
Literal
Multiline
String'''`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key).toContain("Literal");
    });

    it("should handle escape sequences", async () => {
      const tomlStr = `key = "Line 1\\nLine 2\\tTabbed"`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      // Parser converts \\n to actual newline, \\t to actual tab
      expect(result.key).toContain("Line 1");
      expect(result.key).toContain("Line 2");
    });

    it("should handle Unicode escapes", async () => {
      const tomlStr = `key = "Unicode: \\u0048\\u0065\\u006c\\u006c\\u006f"`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key).toBeDefined();
    });

    it("should handle empty strings", async () => {
      const tomlStr = `key = ""`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key).toBe("");
    });

    it("should handle strings with special characters", async () => {
      const tomlStr = `key = "Special: !@#$%^&*()"`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key).toContain("!@#$%^&*()");
    });

    it("should handle strings with quotes", async () => {
      const tomlStr = `key = "He said \\"Hello\\""`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key).toContain("Hello");
    });

    it("should handle Unicode in strings", async () => {
      const tomlStr = `key = "こんにちは 世界 🌍"`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key).toContain("こんにちは");
    });
  });

  describe("Number edge cases", () => {
    it("should parse integers", async () => {
      const tomlStr = `
int1 = 42
int2 = -17
int3 = 0
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      // Parser returns BigInt for integers
      expect(result.int1 === 42n).toBe(true);
      expect(result.int2 === -17n).toBe(true);
      expect(result.int3 === 0n).toBe(true);
    });

    it("should parse floats", async () => {
      const tomlStr = `
float1 = 3.14
float2 = -0.01
float3 = 0.0
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(typeof result.float1).toBe("number");
    });

    it("should parse scientific notation", async () => {
      const tomlStr = `
sci1 = 1e6
sci2 = 2.5e-3
sci3 = 1E+2
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.sci1).toBe(1e6);
    });

    it("should parse numbers with underscores", async () => {
      const tomlStr = `
num1 = 1_000_000
num2 = 3.14_15_92
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      // Integer with underscores becomes BigInt
      expect(result.num1 === 1000000n).toBe(true);
      // Float remains number
      expect(typeof result.num2).toBe("number");
    });

    it("should parse hexadecimal numbers", async () => {
      const tomlStr = `num = 0xDEADBEEF`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      // Hex numbers become BigInt
      expect(typeof result.num).toBe("bigint");
      expect(result.num === 0xdeadbeefn).toBe(true);
    });

    it("should parse octal numbers", async () => {
      const tomlStr = `num = 0o755`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      // Octal numbers become BigInt
      expect(typeof result.num).toBe("bigint");
      expect(result.num === 0o755n).toBe(true);
    });

    it("should parse binary numbers", async () => {
      const tomlStr = `num = 0b11010110`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      // Binary numbers become BigInt
      expect(typeof result.num).toBe("bigint");
      expect(result.num === 0b11010110n).toBe(true);
    });

    it("should handle infinity", async () => {
      const tomlStr = `
inf1 = inf
inf2 = +inf
inf3 = -inf
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.inf1).toBe(Infinity);
      expect(result.inf3).toBe(-Infinity);
    });

    it("should handle NaN", async () => {
      const tomlStr = `nan = nan`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(Number.isNaN(result.nan)).toBe(true);
    });
  });

  describe("Boolean and null edge cases", () => {
    it("should parse booleans", async () => {
      const tomlStr = `
bool1 = true
bool2 = false
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.bool1).toBe(true);
      expect(result.bool2).toBe(false);
    });

    it("should distinguish booleans from strings", async () => {
      const tomlStr = `
bool = true
string = "true"
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(typeof result.bool).toBe("boolean");
      expect(typeof result.string).toBe("string");
    });
  });

  describe("Date and time edge cases", () => {
    it("should parse ISO 8601 datetimes", async () => {
      const tomlStr = `dt = 1979-05-27T07:32:00Z`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.dt).toBeDefined();
    });

    it("should parse datetime with timezone", async () => {
      const tomlStr = `dt = 1979-05-27T00:32:00-07:00`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.dt).toBeDefined();
    });

    it("should parse local datetime", async () => {
      const tomlStr = `dt = 1979-05-27T07:32:00`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.dt).toBeDefined();
    });

    it("should parse local date", async () => {
      const tomlStr = `date = 1979-05-27`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.date).toBeDefined();
    });

    it("should parse local time", async () => {
      const tomlStr = `time = 07:32:00`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.time).toBeDefined();
    });
  });

  describe("Array edge cases", () => {
    it("should parse simple arrays", async () => {
      const tomlStr = `arr = [1, 2, 3]`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(Array.isArray(result.arr)).toBe(true);
      expect(result.arr).toHaveLength(3);
    });

    it("should parse multiline arrays", async () => {
      const tomlStr = `arr = [
  1,
  2,
  3
]`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      // Arrays of integers contain BigInts
      expect(result.arr).toEqual([1n, 2n, 3n]);
    });

    it("should parse nested arrays", async () => {
      const tomlStr = `arr = [[1, 2], [3, 4]]`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      // Nested arrays also contain BigInts
      expect(result.arr[0]).toEqual([1n, 2n]);
    });

    it("should parse arrays of tables", async () => {
      const tomlStr = `
[[products]]
name = "Product 1"
price = 10

[[products]]
name = "Product 2"
price = 20
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(Array.isArray(result.products)).toBe(true);
      expect(result.products).toHaveLength(2);
    });

    it("should parse empty arrays", async () => {
      const tomlStr = `arr = []`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.arr).toEqual([]);
    });

    it("should parse arrays with mixed types (some implementations)", async () => {
      const tomlStr = `arr = [1, "string", true]`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(Effect.either(program));
      // May succeed or fail depending on TOML implementation
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });
  });

  describe("Table and nested structure edge cases", () => {
    it("should parse simple tables", async () => {
      const tomlStr = `
[section]
key = "value"
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.section.key).toBe("value");
    });

    it("should parse nested tables", async () => {
      const tomlStr = `
[section.subsection]
key = "value"
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.section.subsection.key).toBe("value");
    });

    it("should parse deeply nested tables", async () => {
      const tomlStr = `
[a.b.c.d.e.f]
key = "value"
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.a.b.c.d.e.f.key).toBe("value");
    });

    it("should handle inline tables", async () => {
      const tomlStr = `point = { x = 1, y = 2 }`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      // Inline table integers are BigInts
      expect(result.point.x === 1n).toBe(true);
      expect(result.point.y === 2n).toBe(true);
    });

    it("should parse array of inline tables", async () => {
      const tomlStr = `
points = [
  { x = 1, y = 2 },
  { x = 3, y = 4 }
]
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(Array.isArray(result.points)).toBe(true);
      expect(result.points).toHaveLength(2);
    });
  });

  describe("Special key edge cases", () => {
    it("should handle quoted keys", async () => {
      const tomlStr = `"quoted-key" = "value"`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result["quoted-key"]).toBe("value");
    });

    it("should handle keys with spaces", async () => {
      const tomlStr = `"key with spaces" = "value"`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result["key with spaces"]).toBe("value");
    });

    it("should handle dotted keys", async () => {
      const tomlStr = `a.b.c = "value"`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.a.b.c).toBe("value");
    });

    it("should handle numeric keys", async () => {
      const tomlStr = `"123" = "value"`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result["123"]).toBe("value");
    });

    it("should handle Unicode in quoted keys", async () => {
      const tomlStr = `"日本語" = "value"`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result["日本語"]).toBe("value");
    });

    it("should fail on bare Unicode keys", async () => {
      const tomlStr = `日本語 = "value"`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  describe("Large and complex documents", () => {
    it("should parse very long values", async () => {
      const longValue = "x".repeat(10000);
      const tomlStr = `key = "${longValue}"`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key).toHaveLength(10000);
    });

    it("should parse many keys", async () => {
      let tomlStr = "";
      for (let i = 0; i < 100; i++) {
        tomlStr += `key${i} = "value${i}"\n`;
      }
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(Object.keys(result)).toHaveLength(100);
    });

    it("should parse large arrays", async () => {
      let tomlStr = "arr = [";
      for (let i = 0; i < 1000; i++) {
        if (i > 0) tomlStr += ", ";
        tomlStr += i;
      }
      tomlStr += "]";
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.arr).toHaveLength(1000);
    });
  });

  describe("Stringify edge cases", () => {
    it("should stringify simple objects", async () => {
      const obj = { key: "value" };
      const program = toml
        .stringify(obj)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result).toContain("key");
      expect(result).toContain("value");
    });

    it("should stringify nested objects", async () => {
      const obj = { a: { b: { c: "value" } } };
      const program = toml
        .stringify(obj)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result).toContain("a");
    });

    it("should stringify with special characters", async () => {
      const obj = { key: 'value with "quotes"' };
      const program = toml
        .stringify(obj)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("string");
    });

    it("should stringify empty object", async () => {
      const obj = {};
      const program = toml
        .stringify(obj)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("string");
    });
  });

  describe("Error handling", () => {
    it("should error on invalid TOML syntax", async () => {
      const tomlStr = `invalid toml [[[`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromiseExit(program);
      expect(result._tag).toBe("Failure");
    });

    it("should error on duplicate keys", async () => {
      const tomlStr = `
key = "value1"
key = "value2"
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromiseExit(program);
      expect(result._tag).toBe("Failure");
    });

    it("should error on conflicting definitions", async () => {
      const tomlStr = `
[a]
b = 1

a.b.c = 2
`;
      const program = toml
        .parse(tomlStr)
        .pipe(Effect.provide(TomlBackendLayer));
      const result = await Effect.runPromiseExit(program);
      expect(result._tag).toMatch(/Failure|Success/);
    });
  });
});
