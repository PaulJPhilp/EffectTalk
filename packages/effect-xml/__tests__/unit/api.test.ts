import { Cause, Effect, Exit } from "effect";
import { describe, expect, it } from "vitest";
import * as xml from "../../src/api";
import { XmlBackendLayer } from "../../src/backends/XmlBackend";
import { XmlParseError } from "../../src/errors";
import type { XmlElement } from "../../src/types";

describe("XML API", () => {
  it("should parse a minimal document", async () => {
    const program = Effect.provide(
      xml.parseString('<root a="1">hi</root>'),
      XmlBackendLayer
    );

    const result = await Effect.runPromise(program);

    expect(result.root.name).toBe("root");
    expect(result.root.attributes.a).toBe("1");
    expect(result.root.children).toEqual(["hi"]);
  });

  it("parseStringDefault should parse without providing a backend", async () => {
    const result = await Effect.runPromise(
      xml.parseStringDefault("<root>hi</root>")
    );

    expect(result.root.name).toBe("root");
    expect(result.root.children).toEqual(["hi"]);
  });

  it("should fail on invalid xml", async () => {
    const program = Effect.provide(xml.parseString("<root>"), XmlBackendLayer);

    const exit = await Effect.runPromiseExit(program);
    expect(exit._tag).toBe("Failure");
  });

  it("should return XmlParseError with message on invalid xml", async () => {
    const exit = await Effect.runPromiseExit(xml.parseStringDefault("<root>"));

    expect(Exit.isFailure(exit)).toBe(true);
    if (Exit.isFailure(exit)) {
      const error = Cause.failureOption(exit.cause);
      expect(error._tag).toBe("Some");
      if (error._tag === "Some") {
        expect(error.value).toBeInstanceOf(XmlParseError);
        expect(error.value.message).toContain("Unclosed tag");
      }
    }
  });

  it("should parse empty element", async () => {
    const result = await Effect.runPromise(xml.parseStringDefault("<empty/>"));

    expect(result.root.name).toBe("empty");
    expect(result.root.attributes).toEqual({});
    expect(result.root.children).toEqual([]);
  });

  it("should parse self-closing element with attributes", async () => {
    const result = await Effect.runPromise(
      xml.parseStringDefault('<img src="a.png" alt="test"/>')
    );

    expect(result.root.name).toBe("img");
    expect(result.root.attributes.src).toBe("a.png");
    expect(result.root.attributes.alt).toBe("test");
    expect(result.root.children).toEqual([]);
  });

  it("should parse nested elements", async () => {
    const result = await Effect.runPromise(
      xml.parseStringDefault("<root><child>text</child></root>")
    );

    expect(result.root.name).toBe("root");
    expect(result.root.children.length).toBe(1);

    const child = result.root.children[0];
    expect(typeof child).toBe("object");
    if (typeof child === "object") {
      expect(child.name).toBe("child");
      expect(child.children).toEqual(["text"]);
    }
  });

  it("should parse multiple sibling elements", async () => {
    const result = await Effect.runPromise(
      xml.parseStringDefault("<root><a/><b/><c/></root>")
    );

    expect(result.root.name).toBe("root");
    expect(result.root.children.length).toBe(3);

    const names = result.root.children.map((c) =>
      typeof c === "object" ? c.name : c
    );
    expect(names).toEqual(["a", "b", "c"]);
  });

  it("should parse repeated sibling elements with same name", async () => {
    const result = await Effect.runPromise(
      xml.parseStringDefault("<root><item>1</item><item>2</item></root>")
    );

    expect(result.root.name).toBe("root");
    expect(result.root.children.length).toBe(2);

    const items = result.root.children.filter(
      (c): c is XmlElement => typeof c === "object"
    );
    expect(items.length).toBe(2);
    expect(items[0]?.children).toEqual(["1"]);
    expect(items[1]?.children).toEqual(["2"]);
  });

  it("should handle numeric text content", async () => {
    const result = await Effect.runPromise(
      xml.parseStringDefault("<num>42</num>")
    );

    expect(result.root.name).toBe("num");
    expect(result.root.children).toEqual(["42"]);
  });

  it("should handle boolean-like text content", async () => {
    const result = await Effect.runPromise(
      xml.parseStringDefault("<flag>true</flag>")
    );

    expect(result.root.name).toBe("flag");
    expect(result.root.children).toEqual(["true"]);
  });

  it("should preserve whitespace in text content", async () => {
    const result = await Effect.runPromise(
      xml.parseStringDefault("<pre>  spaced  </pre>")
    );

    expect(result.root.name).toBe("pre");
    expect(result.root.children).toEqual(["  spaced  "]);
  });

  it("should handle deeply nested structure", async () => {
    const result = await Effect.runPromise(
      xml.parseStringDefault("<a><b><c><d>deep</d></c></b></a>")
    );

    expect(result.root.name).toBe("a");

    const b = result.root.children[0];
    expect(typeof b).toBe("object");
    if (typeof b === "object") {
      expect(b.name).toBe("b");
      const c = b.children[0];
      expect(typeof c).toBe("object");
      if (typeof c === "object") {
        expect(c.name).toBe("c");
        const d = c.children[0];
        expect(typeof d).toBe("object");
        if (typeof d === "object") {
          expect(d.name).toBe("d");
          expect(d.children).toEqual(["deep"]);
        }
      }
    }
  });

  it("should handle mixed content (text + elements)", async () => {
    const result = await Effect.runPromise(
      xml.parseStringDefault("<p>Hello <b>world</b></p>")
    );

    expect(result.root.name).toBe("p");
    expect(result.root.children.length).toBeGreaterThanOrEqual(1);
  });

  it("should handle attribute with numeric value", async () => {
    const result = await Effect.runPromise(
      xml.parseStringDefault('<el count="5"/>')
    );

    expect(result.root.attributes.count).toBe("5");
  });
});
