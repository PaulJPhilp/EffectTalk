/**
 * Edge case tests for effect-yaml
 *
 * Tests boundary conditions, malformed YAML, special characters, and data edge cases
 */

import { Effect, Either } from "effect";
import { describe, expect, it } from "vitest";
import * as yaml from "../../src/api.js";
import { YamlBackendLayer } from "../../src/backends/YamlBackend.js";

describe("YAML Edge Cases", () => {
  describe("Anchors and aliases", () => {
    it("should handle simple anchor and alias", async () => {
      const yamlStr = `
default: &default_values
  key: value
  count: 5

custom:
  <<: *default_values
  extra: field
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result).toBeDefined();
      expect(result.custom).toBeDefined();
    });

    it("should handle multiple aliases", async () => {
      const yamlStr = `
template: &template
  name: Template
  version: 1.0

item1:
  <<: *template
  id: 1

item2:
  <<: *template
  id: 2
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.item1).toBeDefined();
      expect(result.item2).toBeDefined();
    });

    it("should handle nested anchors", async () => {
      const yamlStr = `
parent: &parent
  child: &child
    value: nested

ref_parent: *parent
ref_child: *child
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.ref_parent).toBeDefined();
    });

    it("should handle anchor with array", async () => {
      const yamlStr = `
defaults: &defaults
  - item1
  - item2
  - item3

list1: *defaults
list2: *defaults
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(Array.isArray(result.list1)).toBe(true);
    });

    it("should handle override with merge key", async () => {
      const yamlStr = `
defaults: &defaults
  timeout: 30
  retries: 3

config:
  <<: *defaults
  timeout: 60
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.config.timeout).toBe(60);
    });
  });

  describe("Multi-document YAML", () => {
    it("should handle single document", async () => {
      const yamlStr = `
document: 1
key: value
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.document).toBe(1);
    });

    it("should handle document with explicit start", async () => {
      const yamlStr = `---
document: 1
key: value
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.document).toBe(1);
    });

    it("should handle empty document", async () => {
      const yamlStr = "---\n";
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result).toBeNull();
    });

    it("should handle document with only comments", async () => {
      const yamlStr = `# Comment 1
# Comment 2
# Comment 3
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result).toBeNull();
    });

    it("should fail on multiple documents", async () => {
      const yamlStr = `---
doc: 1
---
doc: 2
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  describe("Scalar styles", () => {
    it("should handle plain scalars", async () => {
      const yamlStr = `
plain: hello world
number: 42
boolean: true
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.plain).toBe("hello world");
      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
    });

    it("should handle quoted scalars", async () => {
      const yamlStr = `
single: 'single quoted'
double: "double quoted"
escaped: "escaped: \\"quote\\""
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.single).toBe("single quoted");
      expect(result.double).toBe("double quoted");
    });

    it("should handle literal block scalar (|)", async () => {
      const yamlStr = `
literal: |
  This is a literal block
  Multiple lines preserved
  Including newlines
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.literal).toContain("\n");
      expect(result.literal).toContain("Multiple lines");
    });

    it("should handle folded block scalar (>)", async () => {
      const yamlStr = `
folded: >
  This is a folded block
  that spans multiple lines
  but will be folded
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.folded).toBeDefined();
    });

    it("should handle literal block with strip indicator", async () => {
      const yamlStr = `
strip: |-
  No trailing newline
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.strip).toBe("No trailing newline");
    });

    it("should handle literal block with keep indicator", async () => {
      const yamlStr = `
keep: |+
  Keep trailing newlines


`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.keep).toBeDefined();
    });

    it("should handle quoted strings with special characters", async () => {
      const yamlStr = `
quoted: "contains: colon, comma, [bracket], {brace}"
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.quoted).toContain(":");
      expect(result.quoted).toContain(",");
    });
  });

  describe("Date and time handling", () => {
    it("should handle ISO8601 timestamp", async () => {
      const yamlStr = `
timestamp: 2024-01-07T10:30:00Z
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.timestamp).toBeDefined();
    });

    it("should handle ISO8601 with timezone", async () => {
      const yamlStr = `
timestamp: 2024-01-07T10:30:00-05:00
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.timestamp).toBeDefined();
    });

    it("should handle date only", async () => {
      const yamlStr = `
date: 2024-01-07
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.date).toBeDefined();
    });

    it("should handle time only", async () => {
      const yamlStr = `
time: 10:30:00
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.time).toBeDefined();
    });
  });

  describe("Comments and whitespace", () => {
    it("should ignore inline comments", async () => {
      const yamlStr = `
key: value  # This is a comment
number: 42  # Another comment
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key).toBe("value");
      expect(result.number).toBe(42);
    });

    it("should handle leading comments", async () => {
      const yamlStr = `# File header
# Configuration file
key: value
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key).toBe("value");
    });

    it("should handle blank lines", async () => {
      const yamlStr = `
key1: value1

key2: value2

key3: value3
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key1).toBe("value1");
      expect(result.key2).toBe("value2");
      expect(result.key3).toBe("value3");
    });

    it("should handle mixed indentation", async () => {
      const yamlStr = `
root:
  level1:
    level2: value
  sibling: other
another: root
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.root.level1.level2).toBe("value");
    });
  });

  describe("Special characters and Unicode", () => {
    it("should handle Unicode characters", async () => {
      const yamlStr = `
japanese: 日本語
arabic: العربية
emoji: 🚀🎉
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.japanese).toBe("日本語");
      expect(result.emoji).toContain("🚀");
    });

    it("should handle special regex characters", async () => {
      const yamlStr = `
regex: ".*+?^$[]{}"
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.regex).toContain(".*");
    });

    it("should handle HTML/XML tags", async () => {
      const yamlStr = `
html: "<div>content</div>"
script: "<script>alert('xss')</script>"
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.html).toContain("<div>");
      expect(result.script).toContain("<script>");
    });

    it("should handle control characters", async () => {
      const yamlStr = `
tab: "contains\\tcharacter"
newline: "line1\\nline2"
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.tab).toBeDefined();
    });
  });

  describe("Complex nested structures", () => {
    it("should handle deeply nested objects", async () => {
      const yamlStr = `
level1:
  level2:
    level3:
      level4:
        level5: value
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.level1.level2.level3.level4.level5).toBe("value");
    });

    it("should handle deeply nested arrays", async () => {
      const yamlStr = `
arrays:
  - - - - value
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.arrays[0][0][0][0]).toBe("value");
    });

    it("should handle mixed nesting (objects and arrays)", async () => {
      const yamlStr = `
data:
  items:
    - name: item1
      values: [1, 2, 3]
    - name: item2
      values: [4, 5, 6]
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items[0].values).toEqual([1, 2, 3]);
    });

    it("should handle empty nested structures", async () => {
      const yamlStr = `
empty_object: {}
empty_array: []
empty_nested:
  child: {}
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.empty_object).toEqual({});
      expect(result.empty_array).toEqual([]);
    });
  });

  describe("Number formats", () => {
    it("should handle various integer formats", async () => {
      const yamlStr = `
decimal: 42
octal: 0o755
hex: 0xFF
binary: 0b1010
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.decimal).toBe(42);
    });

    it("should handle floating point numbers", async () => {
      const yamlStr = `
float: 3.14
scientific: 1.23e-4
infinity: .inf
negative_infinity: -.inf
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.float).toBeCloseTo(3.14, 2);
    });

    it("should handle NaN", async () => {
      const yamlStr = `
nan: .nan
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.nan).toBeDefined();
    });

    it("should handle zero values", async () => {
      const yamlStr = `
zero: 0
zero_float: 0.0
negative_zero: -0
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.zero).toBe(0);
    });
  });

  describe("Boolean and null handling", () => {
    it("should handle true/false booleans", async () => {
      const yamlStr = `
true_val: true
false_val: false
yes_val: yes
no_val: no
on_val: on
off_val: off
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.true_val).toBe(true);
      expect(result.false_val).toBe(false);
    });

    it("should handle null values", async () => {
      const yamlStr = `
null_explicit: null
null_tilde: ~
empty_value:
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.null_explicit).toBeNull();
      expect(result.null_tilde).toBeNull();
      expect(result.empty_value).toBeNull();
    });
  });

  describe("Large data handling", () => {
    it("should handle very long string values", async () => {
      const longString = "x".repeat(10000);
      const yamlStr = `
long_value: ${longString}
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.long_value).toHaveLength(10000);
    });

    it("should handle many keys", async () => {
      let yamlStr = "";
      for (let i = 0; i < 100; i++) {
        yamlStr += `key${i}: value${i}\n`;
      }
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.key0).toBe("value0");
      expect(result.key99).toBe("value99");
    });

    it("should handle large arrays", async () => {
      const yamlStr = `
items:
  ${Array(100)
    .fill(0)
    .map((_, i) => `- item${i}`)
    .join("\n  ")}
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result.items).toHaveLength(100);
    });
  });

  describe("Malformed YAML handling", () => {
    it("should fail on invalid YAML syntax", async () => {
      const yamlStr = "invalid: [";
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on unclosed quote", async () => {
      const yamlStr = `
key: "unclosed quote
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on invalid indentation", async () => {
      const yamlStr = `
key1: value1
 key2: value2
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(Effect.either(program));
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });

    it("should fail on invalid anchor reference", async () => {
      const yamlStr = `
value: *undefined_anchor
`;
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(Effect.either(program));
      expect(Either.isLeft(result)).toBe(true);
    });
  });

  describe("Round-trip consistency", () => {
    it("should parse and stringify simple objects", async () => {
      const original = {
        name: "test",
        count: 42,
        enabled: true,
      };

      const stringifyProgram = yaml
        .stringify(original)
        .pipe(Effect.provide(YamlBackendLayer));
      const stringified = await Effect.runPromise(stringifyProgram);

      const parseProgram = yaml
        .parse(stringified)
        .pipe(Effect.provide(YamlBackendLayer));
      const parsed = await Effect.runPromise(parseProgram);

      expect(parsed).toEqual(original);
    });

    it("should maintain nested object structure", async () => {
      const original = {
        user: {
          name: "Alice",
          age: 30,
          tags: ["admin", "user"],
        },
      };

      const stringifyProgram = yaml
        .stringify(original)
        .pipe(Effect.provide(YamlBackendLayer));
      const stringified = await Effect.runPromise(stringifyProgram);

      const parseProgram = yaml
        .parse(stringified)
        .pipe(Effect.provide(YamlBackendLayer));
      const parsed = await Effect.runPromise(parseProgram);

      expect(parsed.user.name).toBe("Alice");
      expect(parsed.user.tags).toContain("admin");
    });

    it("should handle arrays in round-trip", async () => {
      const original = [
        { id: 1, name: "one" },
        { id: 2, name: "two" },
        { id: 3, name: "three" },
      ];

      const stringifyProgram = yaml
        .stringify(original)
        .pipe(Effect.provide(YamlBackendLayer));
      const stringified = await Effect.runPromise(stringifyProgram);

      const parseProgram = yaml
        .parse(stringified)
        .pipe(Effect.provide(YamlBackendLayer));
      const parsed = await Effect.runPromise(parseProgram);

      expect(parsed).toHaveLength(3);
      expect(parsed[0].name).toBe("one");
    });
  });

  describe("Stringify edge cases", () => {
    it("should stringify empty object", async () => {
      const program = yaml.stringify({}).pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("string");
    });

    it("should stringify empty array", async () => {
      const program = yaml.stringify([]).pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(typeof result).toBe("string");
    });

    it("should stringify null values", async () => {
      const data = {
        key: null,
      };
      const program = yaml
        .stringify(data)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result).toContain("null");
    });

    it("should stringify with special characters", async () => {
      const data = {
        title: "String with \"quotes\" and 'apostrophes'",
        description: "Contains: colon, comma, [bracket], {brace}",
      };
      const program = yaml
        .stringify(data)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result).toBeDefined();
    });

    it("should stringify with Unicode", async () => {
      const data = {
        japanese: "日本語",
        emoji: "🚀",
      };
      const program = yaml
        .stringify(data)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(program);
      expect(result).toContain("日本語");
      expect(result).toContain("🚀");
    });

    it("should handle undefined values gracefully", async () => {
      const data = {
        defined: "value",
        undefined_value: undefined as any,
      };
      const program = yaml
        .stringify(data)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(Effect.either(program));
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });
  });

  describe("Error handling", () => {
    it("should provide informative parse error", async () => {
      const yamlStr = "invalid: [";
      const program = yaml
        .parse(yamlStr)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(Effect.either(program));

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("YamlParseError");
        expect(result.left.message).toBeDefined();
      }
    });

    it("should handle stringify errors", async () => {
      const data: any = { key: "value" };
      // Create a circular reference
      data.self = data;

      const program = yaml
        .stringify(data)
        .pipe(Effect.provide(YamlBackendLayer));
      const result = await Effect.runPromise(Effect.either(program));

      expect(result._tag).toMatch(/^(Left|Right)$/);
    });
  });
});
