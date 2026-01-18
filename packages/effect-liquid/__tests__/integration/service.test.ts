import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import {
  render,
  compile,
  LiquidService,
  LiquidServiceLayer,
} from "../../src/index.js";

describe("LiquidService Integration", () => {
  it("should render a complete template", async () => {
    const template = "Hello, {{ name }}! You have {{ count }} items.";
    const context = { name: "Alice", count: 5 };

    const result = await Effect.runPromise(render(template, context));
    expect(result).toBe("Hello, Alice! You have 5 items.");
  });

  it("should render template with filters", async () => {
    const template = "{{ name | upcase }} has {{ items | size }} items.";
    const context = { name: "bob", items: [1, 2, 3, 4] };

    const result = await Effect.runPromise(render(template, context));
    expect(result).toBe("BOB has 4 items.");
  });

  it("should render template with if tag", async () => {
    const template = "{% if show %}Visible{% else %}Hidden{% endif %}";
    const context1 = { show: true };
    const context2 = { show: false };

    const result1 = await Effect.runPromise(render(template, context1));
    expect(result1).toBe("Visible");

    const result2 = await Effect.runPromise(render(template, context2));
    expect(result2).toBe("Hidden");
  });

  it("should render template with for loop", async () => {
    const template = "{% for item in items %}{{ item }}, {% endfor %}";
    const context = { items: ["a", "b", "c"] };

    const result = await Effect.runPromise(render(template, context));
    expect(result).toBe("a, b, c, ");
  });

  it("should compile and render template", async () => {
    const template = "{{ greeting }}, {{ name }}!";
    const compiled = await Effect.runPromise(compile(template));

    const result = await Effect.runPromise(
      Effect.gen(function* () {
        const service = yield* LiquidService;
        return yield* service.renderCompiled(compiled, {
          greeting: "Hello",
          name: "World",
        });
      }).pipe(Effect.provide(LiquidServiceLayer))
    );

    expect(result).toBe("Hello, World!");
  });
});
