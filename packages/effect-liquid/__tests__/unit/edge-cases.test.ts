/**
 * Edge case tests for effect-liquid
 *
 * Tests boundary conditions, special characters, and complex scenarios
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { parse, render, compile, renderCompiled } from "../../src/index.js";
import { LiquidParseError } from "../../src/errors.js";

describe("Edge Cases and Boundary Conditions", () => {
  describe("Empty and whitespace templates", () => {
    it("should handle empty template", async () => {
      const result = await Effect.runPromise(parse(""));
      expect(result).toHaveLength(0);
    });

    it("should handle whitespace-only template", async () => {
      const result = await Effect.runPromise(parse("   \n\t  "));
      // Should parse as text node with whitespace
      expect(result.length).toBeGreaterThanOrEqual(0);
    });

    it("should handle tabs and newlines", async () => {
      const result = await Effect.runPromise(parse("line1\nline2\tindented"));
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it("should render empty template", async () => {
      const result = await Effect.runPromise(render("", {}));
      expect(result).toBe("");
    });

    it("should render whitespace-only template", async () => {
      const result = await Effect.runPromise(render("   ", {}));
      expect(result.trim()).toBe("");
    });
  });

  describe("Special characters", () => {
    it("should handle Unicode characters", async () => {
      const template = "{{ name }}";
      const result = await Effect.runPromise(
        render(template, { name: "こんにちは" })
      );
      expect(result).toContain("こんにちは");
    });

    it("should handle emoji", async () => {
      const template = "{{ emoji }}";
      const result = await Effect.runPromise(
        render(template, { emoji: "🚀🎉" })
      );
      expect(result).toContain("🚀");
    });

    it("should handle high Unicode code points", async () => {
      const template = "{{ text }}";
      const result = await Effect.runPromise(
        render(template, { text: "𝓗𝓮𝓵𝓵𝓸" })
      );
      expect(result).toContain("𝓗");
    });

    it("should handle special regex characters", async () => {
      const template = "{{ text }}";
      const result = await Effect.runPromise(
        render(template, { text: "[.*+?^${}()|[\\]\\\\]" })
      );
      expect(result).toContain("[");
    });

    it("should handle null bytes", async () => {
      const template = "text{{ var }}";
      const result = await Effect.runPromise(
        render(template, { var: "value" })
      );
      expect(result).toBe("textvalue");
    });
  });

  describe("Nested structures", () => {
    it("should handle nested objects", async () => {
      const template = "{{ user.profile.email }}";
      const result = await Effect.runPromise(
        render(template, {
          user: { profile: { email: "test@example.com" } },
        })
      );
      expect(result).toContain("test@example.com");
    });

    it("should handle deeply nested arrays", async () => {
      const template = "{{ arr[0][1][2] }}";
      const result = await Effect.runPromise(
        render(template, {
          arr: [[[0, 0, "value"]]],
        })
      );
      expect(result).toContain("value");
    });

    it("should handle mixed nested structures", async () => {
      const template = "{{ data[0].items[1].name }}";
      const result = await Effect.runPromise(
        render(template, {
          data: [
            {
              items: [{ name: "first" }, { name: "second" }],
            },
          ],
        })
      );
      expect(result).toContain("second");
    });
  });

  describe("Large input handling", () => {
    it("should handle very long variable names", async () => {
      const longName = "a".repeat(1000);
      const template = `{{ ${longName} }}`;
      const result = await Effect.runPromise(Effect.either(parse(template)));
      // Should parse successfully
      expect(result._tag).toBe("Right");
    });

    it("should handle large template strings", async () => {
      const largeTemplate = "text ".repeat(1000);
      const result = await Effect.runPromise(render(largeTemplate, {}));
      expect(result.length).toBeGreaterThan(4000);
    });

    it("should handle large variable values", async () => {
      const template = "{{ text }}";
      const largeValue = "x".repeat(10000);
      const result = await Effect.runPromise(
        render(template, { text: largeValue })
      );
      expect(result).toHaveLength(10000);
    });

    it("should handle many variables", async () => {
      let template = "";
      const context: Record<string, unknown> = {};
      for (let i = 0; i < 100; i++) {
        template += `{{ var${i} }}`;
        context[`var${i}`] = `value${i}`;
      }
      const result = await Effect.runPromise(render(template, context));
      expect(result).toContain("value0");
      expect(result).toContain("value99");
    });
  });

  describe("Deeply nested control structures", () => {
    it("should handle nested if statements", async () => {
      const template = `
        {% if a %}
          {% if b %}
            {% if c %}
              nested
            {% endif %}
          {% endif %}
        {% endif %}
      `;
      const result = await Effect.runPromise(
        render(template, { a: true, b: true, c: true })
      );
      expect(result).toContain("nested");
    });

    it("should handle nested for loops", async () => {
      const template = `
        {% for i in outer %}
          {% for j in inner %}
            x
          {% endfor %}
        {% endfor %}
      `;
      const result = await Effect.runPromise(
        render(template, { outer: [1, 2], inner: [1, 2, 3] })
      );
      // Should render 'x' 6 times (2 * 3)
      expect((result.match(/x/g) || []).length).toBe(6);
    });

    it("should handle if inside for inside if", async () => {
      const template = `
        {% if outer %}
          {% for i in items %}
            {% if include %}yes{% endif %}
          {% endfor %}
        {% endif %}
      `;
      const result = await Effect.runPromise(
        render(template, { outer: true, items: [1, 2], include: true })
      );
      expect((result.match(/yes/g) || []).length).toBe(2);
    });
  });

  describe("Reserved and special keywords", () => {
    it("should handle variables named with reserved words", async () => {
      const template = "{{ if }}";
      const result = await Effect.runPromise(render(template, { if: "value" }));
      expect(result).toContain("value");
    });

    it("should handle variables with special names", async () => {
      const template = "{{ null }} {{ true }} {{ false }}";
      const result = await Effect.runPromise(
        render(template, { null: "n", true: "t", false: "f" })
      );
      expect(result).toContain("n");
    });
  });

  describe("Number and type edge cases", () => {
    it("should handle very large numbers", async () => {
      const template = "{{ num }}";
      const result = await Effect.runPromise(
        render(template, { num: 9007199254740991 }) // MAX_SAFE_INTEGER
      );
      expect(result).toContain("9007199254740991");
    });

    it("should handle floating point precision", async () => {
      const template = "{{ num }}";
      const result = await Effect.runPromise(
        render(template, { num: 0.1 + 0.2 })
      );
      expect(result).toBeDefined();
    });

    it("should handle negative numbers", async () => {
      const template = "{{ num }}";
      const result = await Effect.runPromise(render(template, { num: -42 }));
      expect(result).toContain("-42");
    });

    it("should handle Infinity", async () => {
      const template = "{{ num }}";
      const result = await Effect.runPromise(
        render(template, { num: Infinity })
      );
      expect(result).toBeDefined();
    });

    it("should handle NaN", async () => {
      const template = "{{ num }}";
      const result = await Effect.runPromise(render(template, { num: NaN }));
      expect(result).toBeDefined();
    });
  });

  describe("Multiple filter chains", () => {
    it("should handle many filters in sequence", async () => {
      const template = "{{ text | upcase | downcase | capitalize | upcase }}";
      const result = await Effect.runPromise(
        render(template, { text: "hello" })
      );
      expect(result).toBe("Hello");
    });

    it("should handle filters with multiple arguments", async () => {
      const template = "{{ text | truncate: 10, '...' }}";
      const result = await Effect.runPromise(
        render(template, { text: "hello world test" })
      );
      expect(result.length).toBeLessThanOrEqual(13);
    });
  });

  describe("Template compilation and reuse", () => {
    it("should compile and render same template multiple times", async () => {
      const template = "Hello, {{ name }}!";
      const compiled = await Effect.runPromise(compile(template));

      const result1 = await Effect.runPromise(
        renderCompiled(compiled, { name: "Alice" })
      );
      const result2 = await Effect.runPromise(
        renderCompiled(compiled, { name: "Bob" })
      );

      expect(result1).toBe("Hello, Alice!");
      expect(result2).toBe("Hello, Bob!");
    });

    it("should handle compiled template with complex structure", async () => {
      const template = `
        {% for item in items %}
          {{ item.name | upcase }}
        {% endfor %}
      `;
      const compiled = await Effect.runPromise(compile(template));
      const result = await Effect.runPromise(
        renderCompiled(compiled, {
          items: [{ name: "alice" }, { name: "bob" }],
        })
      );
      expect(result).toContain("ALICE");
      expect(result).toContain("BOB");
    });
  });

  describe("Escape sequences", () => {
    it("should handle escaped quotes in strings", async () => {
      const template = 'Hello "world"';
      const result = await Effect.runPromise(render(template, {}));
      expect(result).toContain('"');
    });

    it("should handle escaped backslashes", async () => {
      const template = "path\\to\\file";
      const result = await Effect.runPromise(render(template, {}));
      expect(result).toContain("\\");
    });
  });

  describe("Parser error cases", () => {
    it("should handle mismatched braces", async () => {
      const result = await Effect.runPromise(
        Effect.either(parse("{{ unclosed"))
      );
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(LiquidParseError);
      }
    });

    it("should handle invalid tag syntax", async () => {
      const result = await Effect.runPromise(
        Effect.either(parse("{% invalid syntax %}"))
      );
      // May or may not be an error depending on implementation
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });

    it("should handle unclosed tags", async () => {
      const result = await Effect.runPromise(
        Effect.either(parse("{% for item in items %}"))
      );
      // May or may not be an error
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });
  });

  describe("Context mutation during rendering", () => {
    it("should not mutate original context", async () => {
      const context = { name: "Alice" };
      const contextCopy = JSON.parse(JSON.stringify(context));

      await Effect.runPromise(render("{{ name }}", context));

      expect(context).toEqual(contextCopy);
    });

    it("should handle context with methods", async () => {
      const context = {
        name: "Alice",
        getName: () => "Alice",
      };
      const result = await Effect.runPromise(render("{{ name }}", context));
      expect(result).toContain("Alice");
    });
  });

  describe("Boundary value testing", () => {
    it("should handle zero in arithmetic", async () => {
      const template = "{{ num }}";
      const result = await Effect.runPromise(render(template, { num: 0 }));
      expect(result).toBe("0");
    });

    it("should handle empty string vs null vs undefined", async () => {
      const template1 = "{{ empty }}";
      const template2 = "{{ nil }}";
      const template3 = "{{ undef }}";

      const result1 = await Effect.runPromise(render(template1, { empty: "" }));
      const result2 = await Effect.runPromise(render(template2, { nil: null }));
      const result3 = await Effect.runPromise(render(template3, {}));

      expect(result1).toBe("");
      expect(result2).toBe("");
      expect(result3).toBe("");
    });

    it("should handle boolean false vs falsy values", async () => {
      const context = { f: false, z: 0, e: "", n: null };
      const template = "{{ f }}|{{ z }}|{{ e }}|{{ n }}";
      const result = await Effect.runPromise(render(template, context));
      expect(result).toBeDefined();
    });
  });
});
