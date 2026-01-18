/**
 * Advanced filter tests for effect-liquid
 *
 * Tests complex filter operations and edge cases
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  upcase,
  downcase,
  capitalize,
  strip,
  stripHtml,
  stripNewlines,
  newlineToBr,
  escape,
  escapeOnce,
  urlEncode,
  urlDecode,
  truncate,
} from "../../src/filters.js";
import { LiquidFilterError } from "../../src/errors.js";

describe("Advanced Filter Operations", () => {
  describe("String filters", () => {
    it("should handle upcase on various inputs", async () => {
      const tests = ["hello", "HELLO", "HeLLo", "", "123abc"];
      for (const input of tests) {
        const result = await Effect.runPromise(upcase(input));
        expect(result).toBe(input.toUpperCase());
      }
    });

    it("should handle downcase on various inputs", async () => {
      const tests = ["HELLO", "hello", "HeLLo", "", "ABC123"];
      for (const input of tests) {
        const result = await Effect.runPromise(downcase(input));
        expect(result).toBe(input.toLowerCase());
      }
    });

    it("should capitalize first letter only", async () => {
      const tests = [
        { input: "hello world", expected: "Hello world" },
        { input: "HELLO WORLD", expected: "Hello world" },
        { input: "a", expected: "A" },
        { input: "", expected: "" },
        { input: "123", expected: "123" },
      ];
      for (const { input, expected } of tests) {
        const result = await Effect.runPromise(capitalize(input));
        expect(result).toBe(expected);
      }
    });

    it("should strip whitespace", async () => {
      const tests = [
        { input: "  hello  ", expected: "hello" },
        { input: "\thello\n", expected: "hello" },
        { input: "hello", expected: "hello" },
        { input: "   ", expected: "" },
      ];
      for (const { input, expected } of tests) {
        const result = await Effect.runPromise(strip(input));
        expect(result).toBe(expected);
      }
    });
  });

  describe("HTML filters", () => {
    it("should strip HTML tags", async () => {
      const tests = [
        { input: "<p>hello</p>", expected: "hello" },
        { input: "<div><span>nested</span></div>", expected: "nested" },
        { input: "<br>", expected: "" },
        { input: "no tags", expected: "no tags" },
        { input: "<>empty", expected: "empty" },
      ];
      for (const { input, expected } of tests) {
        const result = await Effect.runPromise(stripHtml(input));
        expect(result).toBe(expected);
      }
    });

    it("should strip newlines", async () => {
      const tests = [
        { input: "line1\nline2", expected: "line1line2" },
        { input: "no newlines", expected: "no newlines" },
        { input: "\n\n\n", expected: "" },
        { input: "line1\nline2\nline3", expected: "line1line2line3" },
      ];
      for (const { input, expected } of tests) {
        const result = await Effect.runPromise(stripNewlines(input));
        expect(result).toBe(expected);
      }
    });

    it("should convert newlines to br tags", async () => {
      const tests = [
        { input: "line1\nline2", expected: "line1<br>line2" },
        { input: "single line", expected: "single line" },
        { input: "line1\n\nline2", expected: "line1<br><br>line2" },
      ];
      for (const { input, expected } of tests) {
        const result = await Effect.runPromise(newlineToBr(input));
        expect(result).toBe(expected);
      }
    });

    it("should escape HTML entities", async () => {
      const tests = [
        { input: "<script>", expected: "&lt;script&gt;" },
        { input: 'hello "world"', expected: "hello &quot;world&quot;" },
        { input: "tom & jerry", expected: "tom &amp; jerry" },
        { input: "it's", expected: "it&#39;s" },
        {
          input: '<p>hello & "world"</p>',
          expected: "&lt;p&gt;hello &amp; &quot;world&quot;&lt;/p&gt;",
        },
      ];
      for (const { input, expected } of tests) {
        const result = await Effect.runPromise(escape(input));
        expect(result).toBe(expected);
      }
    });

    it("should escape only once", async () => {
      const tests = [
        { input: "&lt;", expected: "&lt;" },
        { input: "<", expected: "&lt;" },
        { input: "&amp;", expected: "&amp;" },
        { input: "&", expected: "&amp;" },
      ];
      for (const { input, expected } of tests) {
        const result = await Effect.runPromise(escapeOnce(input));
        expect(result).toBe(expected);
      }
    });
  });

  describe("URL filters", () => {
    it("should URL encode strings", async () => {
      const tests = [
        { input: "hello world", expected: "hello%20world" },
        { input: "foo=bar&baz=qux", expected: "foo%3Dbar%26baz%3Dqux" },
        { input: "special!@#$%", expected: "special%21%40%23%24%25" },
      ];
      for (const { input, expected } of tests) {
        const result = await Effect.runPromise(urlEncode(input));
        expect(result).toBe(expected);
      }
    });

    it("should URL decode strings", async () => {
      const tests = [
        { input: "hello%20world", expected: "hello world" },
        { input: "foo%3Dbar%26baz%3Dqux", expected: "foo=bar&baz=qux" },
      ];
      for (const { input, expected } of tests) {
        const result = await Effect.runPromise(urlDecode(input));
        expect(result).toBe(expected);
      }
    });

    it("should handle URL decode errors", async () => {
      const result = await Effect.runPromise(Effect.either(urlDecode("%")));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(LiquidFilterError);
      }
    });
  });

  describe("Truncate filter", () => {
    it("should truncate long strings", async () => {
      const result = await Effect.runPromise(truncate("hello world", 8));
      expect(result).toBe("hello...");
    });

    it("should not truncate short strings", async () => {
      const result = await Effect.runPromise(truncate("hi", 10));
      expect(result).toBe("hi");
    });

    it("should use custom ellipsis", async () => {
      const result = await Effect.runPromise(truncate("hello world", 8, "~"));
      expect(result).toBe("hello w~");
    });

    it("should default to 50 characters", async () => {
      const longString = "a".repeat(100);
      const result = await Effect.runPromise(truncate(longString));
      expect(result.length).toBe(50);
    });

    it("should handle edge cases", async () => {
      const tests = [
        { input: "", length: 10, expected: "" },
        { input: "a", length: 0, expected: "..." },
        { input: "hello", length: 3, expected: "..." },
      ];
      for (const { input, length, expected } of tests) {
        const result = await Effect.runPromise(truncate(input, length));
        expect(result).toBe(expected);
      }
    });

    it("should handle large ellipsis", async () => {
      const result = await Effect.runPromise(
        truncate("hello world", 10, "!!!")
      );
      expect(result).toBe("hello...");
    });
  });

  describe("Filter chaining scenarios", () => {
    it("should compose multiple filters", async () => {
      const input = "  hello world  ";
      const result1 = await Effect.runPromise(strip(input));
      const result2 = await Effect.runPromise(upcase(result1));
      expect(result2).toBe("HELLO WORLD");
    });

    it("should handle filter composition with HTML", async () => {
      const input = "<p>hello</p>";
      const result1 = await Effect.runPromise(stripHtml(input));
      const result2 = await Effect.runPromise(capitalize(result1));
      expect(result2).toBe("Hello");
    });

    it("should escape then truncate", async () => {
      const input = "<script>alert('xss')</script>";
      const result1 = await Effect.runPromise(escape(input));
      const result2 = await Effect.runPromise(truncate(result1, 20));
      expect(result2).toBe("&lt;script&gt;alert...");
    });
  });

  describe("Filter type coercion", () => {
    it("should handle numeric inputs", async () => {
      const result = await Effect.runPromise(upcase(123));
      expect(result).toBe("123");
    });

    it("should handle boolean inputs", async () => {
      const result1 = await Effect.runPromise(upcase(true));
      const result2 = await Effect.runPromise(downcase(false));
      expect(result1).toBe("TRUE");
      expect(result2).toBe("false");
    });

    it("should handle null/undefined", async () => {
      const result1 = await Effect.runPromise(upcase(null));
      const result2 = await Effect.runPromise(upcase(undefined));
      expect(result1).toBe("NULL");
      expect(result2).toBe("UNDEFINED");
    });

    it("should handle array inputs", async () => {
      const result = await Effect.runPromise(upcase([1, 2, 3]));
      expect(result).toBe("1,2,3");
    });

    it("should handle object inputs", async () => {
      const result = await Effect.runPromise(upcase({ key: "value" }));
      expect(typeof result).toBe("string");
    });
  });

  describe("Filter performance and limits", () => {
    it("should handle very long strings", async () => {
      const longString = "a".repeat(10000);
      const result = await Effect.runPromise(upcase(longString));
      expect(result).toHaveLength(10000);
      expect(result).toBe("A".repeat(10000));
    });

    it("should handle deep HTML nesting", async () => {
      const nested = "<div>".repeat(100) + "content" + "</div>".repeat(100);
      const result = await Effect.runPromise(stripHtml(nested));
      expect(result).toBe("content");
    });

    it("should handle complex special characters", async () => {
      const complex = "emoji: 😀, symbols: ™®©, unicode: α β γ";
      const result = await Effect.runPromise(upcase(complex));
      expect(result).toContain("EMOJI");
      expect(result).toContain("😀");
    });
  });

  describe("Filter error handling", () => {
    it("should not throw on edge cases", async () => {
      const operations = [
        upcase(""),
        downcase(""),
        capitalize(""),
        strip(""),
        stripHtml(""),
        stripNewlines(""),
      ];
      const results = await Effect.runPromise(Effect.all(operations));
      expect(results).toHaveLength(6);
    });

    it("should handle circular object references", async () => {
      const obj: any = { a: 1 };
      obj.self = obj;
      // Should not hang or error
      const result = await Effect.runPromise(upcase(obj));
      expect(typeof result).toBe("string");
    });
  });
});
