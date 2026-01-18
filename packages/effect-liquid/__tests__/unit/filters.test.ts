import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { render } from "../../src/index.js";

describe("Filters", () => {
  describe("String filters", () => {
    it("should apply upcase filter", async () => {
      const result = await Effect.runPromise(
        render("{{ name | upcase }}", { name: "hello" })
      );
      expect(result).toBe("HELLO");
    });

    it("should apply downcase filter", async () => {
      const result = await Effect.runPromise(
        render("{{ name | downcase }}", { name: "WORLD" })
      );
      expect(result).toBe("world");
    });

    it("should apply capitalize filter", async () => {
      const result = await Effect.runPromise(
        render("{{ name | capitalize }}", { name: "hello" })
      );
      expect(result).toBe("Hello");
    });

    it("should apply strip filter", async () => {
      const result = await Effect.runPromise(
        render("{{ name | strip }}", { name: "  hello  " })
      );
      expect(result).toBe("hello");
    });

    it("should apply default filter", async () => {
      const result1 = await Effect.runPromise(
        render("{{ name | default: 'unknown' }}", {})
      );
      expect(result1).toBe("unknown");

      const result2 = await Effect.runPromise(
        render("{{ name | default: 'unknown' }}", { name: "test" })
      );
      expect(result2).toBe("test");
    });
  });

  describe("Array filters", () => {
    it("should apply first filter", async () => {
      const result = await Effect.runPromise(
        render("{{ items | first }}", { items: [1, 2, 3] })
      );
      expect(result).toBe("1");
    });

    it("should apply last filter", async () => {
      const result = await Effect.runPromise(
        render("{{ items | last }}", { items: [1, 2, 3] })
      );
      expect(result).toBe("3");
    });

    it("should apply join filter", async () => {
      const result = await Effect.runPromise(
        render("{{ items | join: ', ' }}", { items: ["a", "b", "c"] })
      );
      expect(result).toBe("a, b, c");
    });

    it("should apply size filter", async () => {
      const result = await Effect.runPromise(
        render("{{ items | size }}", { items: [1, 2, 3] })
      );
      expect(result).toBe("3");
    });
  });

  describe("Math filters", () => {
    it("should apply plus filter", async () => {
      const result = await Effect.runPromise(render("{{ 5 | plus: 3 }}", {}));
      expect(result).toBe("8");
    });

    it("should apply minus filter", async () => {
      const result = await Effect.runPromise(render("{{ 10 | minus: 3 }}", {}));
      expect(result).toBe("7");
    });

    it("should apply times filter", async () => {
      const result = await Effect.runPromise(render("{{ 5 | times: 3 }}", {}));
      expect(result).toBe("15");
    });
  });
});
