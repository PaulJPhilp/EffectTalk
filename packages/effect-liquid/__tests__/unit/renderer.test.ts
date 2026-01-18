import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { render } from "../../src/index.js";

describe("Renderer", () => {
  it("should render plain text", async () => {
    const result = await Effect.runPromise(render("Hello, world!", {}));
    expect(result).toBe("Hello, world!");
  });

  it("should render a simple variable", async () => {
    const result = await Effect.runPromise(
      render("{{ name }}", { name: "Alice" })
    );
    expect(result).toBe("Alice");
  });

  it("should render text with variable", async () => {
    const result = await Effect.runPromise(
      render("Hello, {{ name }}!", { name: "Bob" })
    );
    expect(result).toBe("Hello, Bob!");
  });

  it("should render variable with filter", async () => {
    const result = await Effect.runPromise(
      render("{{ name | upcase }}", { name: "charlie" })
    );
    expect(result).toBe("CHARLIE");
  });

  it("should render nested variable access", async () => {
    const result = await Effect.runPromise(
      render("{{ user.name }}", { user: { name: "David" } })
    );
    expect(result).toBe("David");
  });

  it("should handle missing variables", async () => {
    const result = await Effect.runPromise(render("{{ missing }}", {}));
    expect(result).toBe("");
  });

  it("should render assign tag", async () => {
    const result = await Effect.runPromise(
      render("{% assign x = 'test' %}{{ x }}", {})
    );
    expect(result).toBe("test");
  });
});
