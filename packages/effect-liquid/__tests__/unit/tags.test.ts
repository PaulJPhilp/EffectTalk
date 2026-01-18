import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { render } from "../../src/index.js";

describe("Tags", () => {
  it("should render if tag with true condition", async () => {
    const result = await Effect.runPromise(
      render("{% if true %}Hello{% endif %}", {})
    );
    expect(result).toBe("Hello");
  });

  it("should render if tag with false condition", async () => {
    const result = await Effect.runPromise(
      render("{% if false %}Hello{% endif %}", {})
    );
    expect(result).toBe("");
  });

  it("should render if tag with variable condition", async () => {
    const result = await Effect.runPromise(
      render("{% if show %}Hello{% endif %}", { show: true })
    );
    expect(result).toBe("Hello");
  });

  it("should render for loop", async () => {
    const result = await Effect.runPromise(
      render("{% for item in items %}{{ item }}{% endfor %}", {
        items: [1, 2, 3],
      })
    );
    expect(result).toBe("123");
  });

  it("should render assign tag", async () => {
    const result = await Effect.runPromise(
      render("{% assign x = 'test' %}{{ x }}", {})
    );
    expect(result).toBe("test");
  });

  it("should render capture tag", async () => {
    const result = await Effect.runPromise(
      render("{% capture x %}Hello{% endcapture %}{{ x }}", {})
    );
    expect(result).toBe("Hello");
  });

  it("should render comment tag", async () => {
    const result = await Effect.runPromise(
      render("Hello{% comment %}This is a comment{% endcomment %}World", {})
    );
    expect(result).toBe("HelloWorld");
  });
});
