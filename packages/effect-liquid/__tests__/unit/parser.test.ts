import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { parse } from "../../src/index.js";
import { LiquidParseError } from "../../src/errors.js";

describe("Parser", () => {
  it("should parse plain text", async () => {
    const result = await Effect.runPromise(parse("Hello, world!"));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "text",
      value: "Hello, world!",
    });
  });

  it("should parse a simple variable", async () => {
    const result = await Effect.runPromise(parse("{{ name }}"));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "variable",
      name: "name",
    });
  });

  it("should parse text with variable", async () => {
    const result = await Effect.runPromise(parse("Hello, {{ name }}!"));
    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({ type: "text", value: "Hello, " });
    expect(result[1]).toMatchObject({ type: "variable", name: "name" });
    expect(result[2]).toMatchObject({ type: "text", value: "!" });
  });

  it("should parse variable with filter", async () => {
    const result = await Effect.runPromise(parse("{{ name | upcase }}"));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "variable",
      name: "name",
      filters: [{ name: "upcase", args: [] }],
    });
  });

  it("should parse variable with multiple filters", async () => {
    const result = await Effect.runPromise(
      parse("{{ name | upcase | strip }}")
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "variable",
      name: "name",
      filters: [
        { name: "upcase", args: [] },
        { name: "strip", args: [] },
      ],
    });
  });

  it("should parse a simple tag", async () => {
    const result = await Effect.runPromise(parse("{% assign x = 1 %}"));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      type: "tag",
      name: "assign",
    });
  });

  it("should fail on invalid syntax", async () => {
    const result = await Effect.runPromiseExit(parse("{{ invalid"));
    expect(result._tag).toBe("Failure");
    if (result._tag === "Failure") {
      expect(result.cause).toBeInstanceOf(LiquidParseError);
    }
  });
});
