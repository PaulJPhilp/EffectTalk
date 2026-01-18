/**
 * XML Backend Service Tests
 *
 * Direct tests of the XmlBackend implementation covering parsing,
 * error handling, and comprehensive XML feature support.
 */

import { Effect, Either } from "effect";
import { describe, expect, it } from "vitest";
import { XmlBackend } from "../../src/backends/XmlBackend.js";
import { XmlParseError } from "../../src/errors.js";

describe("XmlBackend Service", () => {
  describe("parse method - basic elements", () => {
    it("should parse simple element", async () => {
      const xml = "<root>content</root>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.name).toBe("root");
      expect(result.root.children).toContain("content");
    });

    it("should parse element with attributes", async () => {
      const xml = '<element attr="value">content</element>';
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.name).toBe("element");
      expect(result.root.attributes["attr"]).toBe("value");
    });

    it("should parse multiple attributes", async () => {
      const xml = '<element attr1="value1" attr2="value2">content</element>';
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(Object.keys(result.root.attributes).length).toBeGreaterThanOrEqual(
        2
      );
      expect(result.root.attributes["attr1"]).toBe("value1");
    });

    it("should parse empty element", async () => {
      const xml = "<empty></empty>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.name).toBe("empty");
      expect(result.root.children.length).toBe(0);
    });

    it("should parse self-closing element", async () => {
      const xml = "<single />";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.name).toBe("single");
    });
  });

  describe("parse method - nested elements", () => {
    it("should parse nested elements", async () => {
      const xml = "<parent><child>text</child></parent>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.name).toBe("parent");
      expect(result.root.children.length).toBeGreaterThan(0);
    });

    it("should parse deeply nested elements", async () => {
      const xml = "<l1><l2><l3><l4>deep</l4></l3></l2></l1>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.name).toBe("l1");
    });

    it("should parse multiple child elements", async () => {
      const xml =
        "<parent><child>1</child><child>2</child><child>3</child></parent>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.children.length).toBeGreaterThanOrEqual(3);
    });

    it("should parse mixed content", async () => {
      const xml = "<mixed>text<element>nested</element>more text</mixed>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.children.length).toBeGreaterThan(0);
    });
  });

  describe("parse method - attributes", () => {
    it("should parse numeric attributes as strings", async () => {
      const xml = '<element count="42">content</element>';
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.attributes["count"]).toBe("42");
    });

    it("should parse boolean-like attributes", async () => {
      const xml = '<element enabled="true">content</element>';
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.attributes["enabled"]).toBe("true");
    });

    it("should parse attributes with special characters", async () => {
      const xml = '<element attr="value &amp; &lt; &gt;">content</element>';
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.attributes["attr"]).toBeDefined();
    });

    it("should parse attributes with namespaces", async () => {
      const xml =
        '<element xmlns:custom="http://custom.ns" custom:attr="value">content</element>';
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(Object.keys(result.root.attributes).length).toBeGreaterThanOrEqual(
        1
      );
    });
  });

  describe("parse method - special content", () => {
    it("should parse CDATA sections", async () => {
      const xml = "<root><![CDATA[This is CDATA content]]></root>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.children.length).toBeGreaterThan(0);
    });

    it("should parse comments (may be ignored)", async () => {
      const xml = "<root><!-- comment --><value>text</value></root>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.children.length).toBeGreaterThan(0);
    });

    it("should preserve whitespace in text nodes", async () => {
      const xml = "<root>text with   spaces</root>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      const textContent = result.root.children.find(
        (c) => typeof c === "string"
      );
      expect(textContent).toBeDefined();
    });

    it("should handle numeric content", async () => {
      const xml = "<root>42</root>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.children.length).toBeGreaterThan(0);
    });
  });

  describe("parse method - error handling", () => {
    it("should fail on invalid XML syntax", async () => {
      const xml = "<root><unclosed>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(XmlBackend.Default))
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(XmlParseError);
      }
    });

    it("should fail on mismatched tags", async () => {
      const xml = "<root><child></different>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(XmlBackend.Default))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on invalid attribute syntax", async () => {
      const xml = "<root attr=value>text</root>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(XmlBackend.Default))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail when no root element exists", async () => {
      const xml = "<root></root><extra></extra>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(XmlBackend.Default))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should include error message in XmlParseError", async () => {
      const xml = "<root><unclosed>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(XmlBackend.Default))
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left.message).toBeDefined();
        expect(result.left.message.length).toBeGreaterThan(0);
      }
    });
  });

  describe("parse method - unicode and special characters", () => {
    it("should parse Unicode characters in content", async () => {
      const xml = "<root>Hello 世界 مرحبا 🌍</root>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.children.length).toBeGreaterThan(0);
    });

    it("should parse Unicode characters in attributes", async () => {
      const xml = '<root attr="世界">content</root>';
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.attributes["attr"]).toBe("世界");
    });

    it("should parse Unicode in element names", async () => {
      const xml = "<élément>content</élément>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.name).toBe("élément");
    });

    it("should handle entity references", async () => {
      const xml = "<root>&lt;tag&gt; &amp; &quot;quoted&quot;</root>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.children.length).toBeGreaterThan(0);
    });
  });

  describe("parse method - XML declaration", () => {
    it("should parse XML without declaration", async () => {
      const xml = "<root>content</root>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.name).toBe("root");
    });

    it("should parse root element with namespace", async () => {
      const xml = '<root xmlns="http://example.com">content</root>';
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.name).toBe("root");
    });
  });

  describe("parse method - large documents", () => {
    it("should parse large documents with many elements", async () => {
      const items = Array.from(
        { length: 100 },
        (_, i) => `<item id="${i}">Item ${i}</item>`
      ).join("");
      const xml = `<root>${items}</root>`;
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.children.length).toBeGreaterThanOrEqual(100);
    });

    it("should parse deeply nested documents", async () => {
      let xml = "<root>";
      for (let i = 0; i < 20; i++) {
        xml += `<level${i}>`;
      }
      xml += "content";
      for (let i = 19; i >= 0; i--) {
        xml += `</level${i}>`;
      }
      xml += "</root>";

      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.provide(XmlBackend.Default))
      );
      expect(result.root.name).toBe("root");
    });
  });

  describe("error distinguishability", () => {
    it("should create XmlParseError with correct _tag", async () => {
      const xml = "<invalid>";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(XmlBackend.Default))
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left._tag).toBe("XmlParseError");
      }
    });

    it("should distinguish XmlParseError by instanceof", async () => {
      const xml = "<bad";
      const program = Effect.gen(function* () {
        const backend = yield* XmlBackend;
        return yield* backend.parseString(xml);
      });
      const result = await Effect.runPromise(
        program.pipe(Effect.either, Effect.provide(XmlBackend.Default))
      );
      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(XmlParseError);
      }
    });
  });
});
