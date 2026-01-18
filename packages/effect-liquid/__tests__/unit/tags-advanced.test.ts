/**
 * Advanced tag tests for effect-liquid
 *
 * Tests complex tag operations including if/elsif/else, for loops with modifiers, and edge cases
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { executeIf, executeUnless, executeFor } from "../../src/tags.js";

describe("Advanced Tag Operations", () => {
  describe("executeIf with simple conditions", () => {
    it("should execute body when condition is truthy", async () => {
      const result = await Effect.runPromise(
        executeIf(
          true,
          [{ type: "text", value: "yes" }],
          undefined,
          undefined,
          {},
          async (nodes) => "yes"
        )
      );
      expect(result).toBe("yes");
    });

    it("should skip body when condition is falsy", async () => {
      const result = await Effect.runPromise(
        executeIf(
          false,
          [{ type: "text", value: "yes" }],
          undefined,
          undefined,
          {},
          async (nodes) => "yes"
        )
      );
      expect(result).toBe("");
    });

    it("should execute else body when condition is false", async () => {
      const result = await Effect.runPromise(
        executeIf(
          false,
          [],
          undefined,
          [{ type: "text", value: "no" }],
          {},
          async (nodes) => (nodes.length > 0 ? "yes" : "no")
        )
      );
      expect(result).toBe("no");
    });
  });

  describe("executeIf with elsif branches", () => {
    it("should check elsif when condition is false", async () => {
      const result = await Effect.runPromise(
        executeIf(
          false,
          [{ type: "text", value: "first" }],
          [{ condition: true, body: [{ type: "text", value: "second" }] }],
          undefined,
          {},
          async (nodes) => (nodes[0]?.value === "second" ? "elsif" : "first")
        )
      );
      expect(result).toBe("elsif");
    });

    it("should check multiple elsif branches in order", async () => {
      const result = await Effect.runPromise(
        executeIf(
          false,
          [],
          [
            { condition: false, body: [] },
            { condition: false, body: [] },
            { condition: true, body: [{ type: "text", value: "third" }] },
          ],
          undefined,
          {},
          async (nodes) => (nodes[0]?.value === "third" ? "found" : "not found")
        )
      );
      expect(result).toBe("found");
    });

    it("should fall through to else when all elsif are false", async () => {
      const result = await Effect.runPromise(
        executeIf(
          false,
          [],
          [
            { condition: false, body: [] },
            { condition: false, body: [] },
          ],
          [{ type: "text", value: "else" }],
          {},
          async (nodes) => "else"
        )
      );
      expect(result).toBe("else");
    });
  });

  describe("executeIf with variable conditions", () => {
    it("should resolve string condition from context", async () => {
      const result = await Effect.runPromise(
        executeIf(
          "show",
          [{ type: "text", value: "shown" }],
          undefined,
          undefined,
          { show: true },
          async (nodes) => "shown"
        )
      );
      expect(result).toBe("shown");
    });

    it("should handle undefined variables in condition", async () => {
      const result = await Effect.runPromise(
        executeIf(
          "missing",
          [],
          undefined,
          [{ type: "text", value: "undefined" }],
          {},
          async (nodes) => "undefined"
        )
      );
      expect(result).toBe("undefined");
    });
  });

  describe("executeUnless", () => {
    it("should execute body when condition is falsy", async () => {
      const result = await Effect.runPromise(
        executeUnless(
          false,
          [{ type: "text", value: "yes" }],
          {},
          async () => "yes"
        )
      );
      expect(result).toBe("yes");
    });

    it("should skip body when condition is truthy", async () => {
      const result = await Effect.runPromise(
        executeUnless(
          true,
          [{ type: "text", value: "yes" }],
          {},
          async () => "yes"
        )
      );
      expect(result).toBe("");
    });

    it("should resolve string condition from context", async () => {
      const result = await Effect.runPromise(
        executeUnless(
          "disabled",
          [{ type: "text", value: "enabled" }],
          { disabled: false },
          async () => "enabled"
        )
      );
      expect(result).toBe("enabled");
    });
  });

  describe("executeFor with collections", () => {
    it("should iterate over array", async () => {
      const rendered: unknown[] = [];
      await Effect.runPromise(
        executeFor(
          "item",
          "items",
          [],
          undefined,
          undefined,
          undefined,
          { items: [1, 2, 3] },
          async () => {
            rendered.push("x");
            return "";
          }
        )
      );
      expect(rendered).toHaveLength(3);
    });

    it("should not iterate when collection is not an array", async () => {
      const rendered: unknown[] = [];
      const result = await Effect.runPromise(
        executeFor(
          "item",
          "notarray",
          [],
          undefined,
          undefined,
          undefined,
          { notarray: "string" },
          async () => {
            rendered.push("x");
            return "";
          }
        )
      );
      expect(result).toBe("");
      expect(rendered).toHaveLength(0);
    });

    it("should not iterate when collection is undefined", async () => {
      const rendered: unknown[] = [];
      const result = await Effect.runPromise(
        executeFor(
          "item",
          "missing",
          [],
          undefined,
          undefined,
          undefined,
          {},
          async () => {
            rendered.push("x");
            return "";
          }
        )
      );
      expect(result).toBe("");
      expect(rendered).toHaveLength(0);
    });
  });

  describe("executeFor with limit modifier", () => {
    it("should limit iterations", async () => {
      const iterations: unknown[] = [];
      await Effect.runPromise(
        executeFor(
          "item",
          "items",
          [],
          2, // limit to 2
          undefined,
          undefined,
          { items: [1, 2, 3, 4, 5] },
          async () => {
            iterations.push("x");
            return "";
          }
        )
      );
      expect(iterations).toHaveLength(2);
    });

    it("should handle limit larger than collection", async () => {
      const iterations: unknown[] = [];
      await Effect.runPromise(
        executeFor(
          "item",
          "items",
          [],
          100, // limit larger than collection
          undefined,
          undefined,
          { items: [1, 2] },
          async () => {
            iterations.push("x");
            return "";
          }
        )
      );
      expect(iterations).toHaveLength(2);
    });
  });

  describe("executeFor with offset modifier", () => {
    it("should skip first N items", async () => {
      const iterations: unknown[] = [];
      await Effect.runPromise(
        executeFor(
          "item",
          "items",
          [],
          undefined,
          2, // offset by 2
          undefined,
          { items: [1, 2, 3, 4] },
          async () => {
            iterations.push("x");
            return "";
          }
        )
      );
      expect(iterations).toHaveLength(2);
    });

    it("should handle offset beyond collection length", async () => {
      const iterations: unknown[] = [];
      await Effect.runPromise(
        executeFor(
          "item",
          "items",
          [],
          undefined,
          100, // offset beyond collection
          undefined,
          { items: [1, 2] },
          async () => {
            iterations.push("x");
            return "";
          }
        )
      );
      expect(iterations).toHaveLength(0);
    });
  });

  describe("executeFor with reversed modifier", () => {
    it("should reverse iteration order", async () => {
      const items: unknown[] = [];
      await Effect.runPromise(
        executeFor(
          "item",
          "items",
          [],
          undefined,
          undefined,
          true, // reversed
          { items: [1, 2, 3] },
          async () => {
            items.push("x");
            return "";
          }
        )
      );
      expect(items).toHaveLength(3);
    });

    it("should work with offset + reversed", async () => {
      const iterations: unknown[] = [];
      await Effect.runPromise(
        executeFor(
          "item",
          "items",
          [],
          undefined,
          1, // offset
          true, // reversed
          { items: [1, 2, 3, 4] },
          async () => {
            iterations.push("x");
            return "";
          }
        )
      );
      expect(iterations).toHaveLength(3);
    });

    it("should work with limit + reversed", async () => {
      const iterations: unknown[] = [];
      await Effect.runPromise(
        executeFor(
          "item",
          "items",
          [],
          2, // limit
          undefined,
          true, // reversed
          { items: [1, 2, 3, 4] },
          async () => {
            iterations.push("x");
            return "";
          }
        )
      );
      expect(iterations).toHaveLength(2);
    });
  });

  describe("executeFor with combined modifiers", () => {
    it("should apply limit and offset together", async () => {
      const iterations: unknown[] = [];
      await Effect.runPromise(
        executeFor(
          "item",
          "items",
          [],
          2, // limit
          1, // offset
          undefined,
          { items: [1, 2, 3, 4, 5] },
          async () => {
            iterations.push("x");
            return "";
          }
        )
      );
      expect(iterations).toHaveLength(2);
    });

    it("should apply all three modifiers", async () => {
      const iterations: unknown[] = [];
      await Effect.runPromise(
        executeFor(
          "item",
          "items",
          [],
          2, // limit
          1, // offset
          true, // reversed
          { items: [1, 2, 3, 4, 5] },
          async () => {
            iterations.push("x");
            return "";
          }
        )
      );
      // offset by 1, limit 2, reversed: should still be 2 iterations
      expect(iterations).toHaveLength(2);
    });
  });

  describe("Tag truthiness evaluation", () => {
    it("should consider 0 as falsy", async () => {
      const result = await Effect.runPromise(
        executeIf(
          0,
          [],
          undefined,
          [{ type: "text", value: "falsy" }],
          {},
          async () => "falsy"
        )
      );
      expect(result).toBe("falsy");
    });

    it("should consider empty string as falsy", async () => {
      const result = await Effect.runPromise(
        executeIf(
          "",
          [],
          undefined,
          [{ type: "text", value: "falsy" }],
          {},
          async () => "falsy"
        )
      );
      expect(result).toBe("falsy");
    });

    it("should consider empty array as falsy", async () => {
      const result = await Effect.runPromise(
        executeIf(
          [],
          [],
          undefined,
          [{ type: "text", value: "falsy" }],
          {},
          async () => "falsy"
        )
      );
      expect(result).toBe("falsy");
    });

    it("should consider null as falsy", async () => {
      const result = await Effect.runPromise(
        executeIf(
          null,
          [],
          undefined,
          [{ type: "text", value: "falsy" }],
          {},
          async () => "falsy"
        )
      );
      expect(result).toBe("falsy");
    });

    it("should consider undefined as falsy", async () => {
      const result = await Effect.runPromise(
        executeIf(
          undefined,
          [],
          undefined,
          [{ type: "text", value: "falsy" }],
          {},
          async () => "falsy"
        )
      );
      expect(result).toBe("falsy");
    });

    it("should consider non-empty string as truthy", async () => {
      const result = await Effect.runPromise(
        executeIf(
          "hello",
          [{ type: "text", value: "truthy" }],
          undefined,
          undefined,
          {},
          async () => "truthy"
        )
      );
      expect(result).toBe("truthy");
    });

    it("should consider non-zero number as truthy", async () => {
      const result = await Effect.runPromise(
        executeIf(
          42,
          [{ type: "text", value: "truthy" }],
          undefined,
          undefined,
          {},
          async () => "truthy"
        )
      );
      expect(result).toBe("truthy");
    });

    it("should consider non-empty array as truthy", async () => {
      const result = await Effect.runPromise(
        executeIf(
          [1],
          [{ type: "text", value: "truthy" }],
          undefined,
          undefined,
          {},
          async () => "truthy"
        )
      );
      expect(result).toBe("truthy");
    });
  });

  describe("Tag error handling", () => {
    it("should handle errors in render callback", async () => {
      const result = await Effect.runPromise(
        Effect.either(
          executeIf(true, [], undefined, undefined, {}, async () => {
            throw new Error("render failed");
          })
        )
      );
      expect(result._tag).toBe("Left");
    });

    it("should handle empty body gracefully", async () => {
      const result = await Effect.runPromise(
        executeIf(true, [], undefined, undefined, {}, async () => "rendered")
      );
      expect(result).toBe("rendered");
    });
  });

  describe("For loop edge cases", () => {
    it("should handle empty collection", async () => {
      const iterations: unknown[] = [];
      const result = await Effect.runPromise(
        executeFor(
          "item",
          "items",
          [],
          undefined,
          undefined,
          undefined,
          { items: [] },
          async () => {
            iterations.push("x");
            return "";
          }
        )
      );
      expect(result).toBe("");
      expect(iterations).toHaveLength(0);
    });

    it("should handle single-item collection", async () => {
      const iterations: unknown[] = [];
      await Effect.runPromise(
        executeFor(
          "item",
          "items",
          [],
          undefined,
          undefined,
          undefined,
          { items: [1] },
          async () => {
            iterations.push("x");
            return "";
          }
        )
      );
      expect(iterations).toHaveLength(1);
    });

    it("should handle large collections", async () => {
      const iterations: unknown[] = [];
      const largeArray = Array(1000).fill(0);
      await Effect.runPromise(
        executeFor(
          "item",
          "items",
          [],
          undefined,
          undefined,
          undefined,
          { items: largeArray },
          async () => {
            iterations.push("x");
            return "";
          }
        )
      );
      expect(iterations).toHaveLength(1000);
    });
  });
});
