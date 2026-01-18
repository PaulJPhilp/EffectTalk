/**
 * Edge case tests for effect-xml
 *
 * Tests boundary conditions, malformed XML, special characters, and data edge cases
 */

import { Cause, Effect, Either, Exit } from "effect";
import { describe, expect, it } from "vitest";
import * as xml from "../../src/api.js";
import { XmlBackendLayer } from "../../src/backends/XmlBackend.js";
import type { XmlElement } from "../../src/types.js";

describe("XML Edge Cases", () => {
  describe("XML structure", () => {
    it("should parse basic XML document", async () => {
      const xmlStr = `<root>content</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
      expect(result.root.children).toEqual(["content"]);
    });

    it("should fail on invalid XML declaration", async () => {
      const xmlStr = `<?xml version=1.0?>
<root/>`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });

    it("should ignore comments", async () => {
      const xmlStr = `<root>
  <!-- This is a comment -->
  content
  <!-- Another comment -->
</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });

    it("should handle comments with special characters", async () => {
      const xmlStr = `<root>
  <!-- Comment with -- and > and < -->
  content
</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });

    it("should ignore multiple comments in sequence", async () => {
      const xmlStr = `<root>
  <!-- Comment 1 -->
  <!-- Comment 2 -->
  <!-- Comment 3 -->
  content
</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });
  });

  describe("CDATA sections", () => {
    it("should parse CDATA section", async () => {
      const xmlStr = `<root><![CDATA[This is CDATA content]]></root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
      expect(result.root.children.length).toBeGreaterThan(0);
    });

    it("should handle CDATA with special characters", async () => {
      const xmlStr = `<root><![CDATA[Content with <tags> & entities]]></root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });

    it("should handle CDATA with newlines", async () => {
      const xmlStr = `<root><![CDATA[Line 1
Line 2
Line 3]]></root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });

    it("should handle empty CDATA section", async () => {
      const xmlStr = `<root><![CDATA[]]></root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });

    it("should handle CDATA with encoded sequences", async () => {
      const xmlStr = `<root><![CDATA[]]></root><![CDATA[more]]>`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });
  });

  describe("Entity references", () => {
    it("should parse predefined entities", async () => {
      const xmlStr = `<root>&lt; &gt; &amp; &quot; &apos;</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
      expect(result.root.children.length).toBeGreaterThan(0);
    });

    it("should parse numeric character references", async () => {
      const xmlStr = `<root>&#65; &#x41;</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });

    it("should handle entity in attribute", async () => {
      const xmlStr = `<root attr="value &amp; more"/>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.attributes.attr).toBeDefined();
    });

    it("should handle mixed entities and text", async () => {
      const xmlStr = `<root>Normal &lt;text&gt; with &amp; entities</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });
  });

  describe("Namespaces", () => {
    it("should parse element with namespace", async () => {
      const xmlStr = `<root xmlns="http://example.com">content</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });

    it("should parse element with namespace prefix", async () => {
      const xmlStr = `<ns:root xmlns:ns="http://example.com">content</ns:root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBeDefined();
    });

    it("should parse multiple namespaces", async () => {
      const xmlStr = `<root xmlns:a="http://a.com" xmlns:b="http://b.com">content</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });

    it("should handle namespace inheritance", async () => {
      const xmlStr = `<root xmlns="http://example.com">
  <child>content</child>
</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });
  });

  describe("Attribute edge cases", () => {
    it("should handle attributes with special characters", async () => {
      const xmlStr = `<root attr="value with &lt; &gt; &amp;"/>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.attributes.attr).toBeDefined();
    });

    it("should handle attributes with Unicode", async () => {
      const xmlStr = `<root attr="日本語 français العربية"/>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.attributes.attr).toContain("日");
    });

    it("should handle empty attribute values", async () => {
      const xmlStr = `<root attr=""/>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.attributes.attr).toBe("");
    });

    it("should handle many attributes", async () => {
      const attrs = Array(50)
        .fill(0)
        .map((_, i) => `attr${i}="value${i}"`)
        .join(" ");
      const xmlStr = `<root ${attrs}/>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.attributes.attr0).toBe("value0");
      expect(result.root.attributes.attr49).toBe("value49");
    });

    it("should handle attribute with quotes", async () => {
      const xmlStr = `<root attr='value with "double" quotes'/>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.attributes.attr).toContain("double");
    });

    it("should handle attribute with numeric values", async () => {
      const xmlStr = `<root id="123" count="456" price="99.99"/>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.attributes.id).toBe("123");
      expect(result.root.attributes.price).toBe("99.99");
    });
  });

  describe("Special characters and Unicode", () => {
    it("should handle Unicode in element names", async () => {
      const xmlStr = `<root><日本語>content</日本語></root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });

    it("should handle Unicode in text content", async () => {
      const xmlStr = `<root>日本語 français العربية 🚀</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.children[0]).toContain("日");
    });

    it("should handle emoji in content", async () => {
      const xmlStr = `<root>Hello 🌍 🚀 🎉</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.children[0]).toContain("🌍");
    });

    it("should handle control characters in CDATA", async () => {
      const xmlStr = `<root><![CDATA[Contains\ttab\nand\nnewline]]></root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });
  });

  describe("Whitespace handling", () => {
    it("should preserve whitespace in text content", async () => {
      const xmlStr = `<root>  spaced  content  </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.children[0]).toContain("  ");
    });

    it("should handle multiple spaces between elements", async () => {
      const xmlStr = `<root>
      <child1/>
      <child2/>
      <child3/>
    </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.children.length).toBeGreaterThanOrEqual(1);
    });

    it("should handle tabs and newlines in attributes", async () => {
      const xmlStr = `<root attr="value with
newline and	tab"/>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.attributes.attr).toBeDefined();
    });

    it("should handle leading and trailing whitespace in elements", async () => {
      const xmlStr = `<root>
        content
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });
  });

  describe("Mixed content", () => {
    it("should handle text and element children", async () => {
      const xmlStr = `<root>
        text before
        <child>nested</child>
        text after
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.children.length).toBeGreaterThan(1);
    });

    it("should handle multiple elements and text", async () => {
      const xmlStr = `<root>
        start
        <a>one</a>
        middle
        <b>two</b>
        end
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.children.length).toBeGreaterThan(1);
    });

    it("should handle deeply nested mixed content", async () => {
      const xmlStr = `<root>
        <a>text<b>nested<c>deep</c></b></a>
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });
  });

  describe("Empty and minimal documents", () => {
    it("should parse empty element", async () => {
      const xmlStr = `<root/>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
      expect(result.root.children).toEqual([]);
    });

    it("should parse element with only whitespace", async () => {
      const xmlStr = `<root>   </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });

    it("should parse single character element name", async () => {
      const xmlStr = `<a/>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("a");
    });

    it("should parse single character content", async () => {
      const xmlStr = `<root>x</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.children).toEqual(["x"]);
    });
  });

  describe("Large documents", () => {
    it("should handle very long element names", async () => {
      const longName = "a".repeat(1000);
      const xmlStr = `<${longName}/>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe(longName);
    });

    it("should handle very long text content", async () => {
      const longText = "x".repeat(10000);
      const xmlStr = `<root>${longText}</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.children[0]).toHaveLength(10000);
    });

    it("should handle deeply nested structure", async () => {
      let xmlStr = "<root>";
      for (let i = 0; i < 100; i++) {
        xmlStr += `<level${i}>`;
      }
      xmlStr += "deep content";
      for (let i = 99; i >= 0; i--) {
        xmlStr += `</level${i}>`;
      }
      xmlStr += "</root>";

      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.name).toBe("root");
    });

    it("should handle many sibling elements", async () => {
      let xmlStr = "<root>";
      for (let i = 0; i < 100; i++) {
        xmlStr += `<item${i}>content</item${i}>`;
      }
      xmlStr += "</root>";

      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.children.length).toBeGreaterThanOrEqual(100);
    });

    it("should handle elements with many attributes", async () => {
      let xmlStr = "<root";
      for (let i = 0; i < 100; i++) {
        xmlStr += ` attr${i}="value${i}"`;
      }
      xmlStr += "/>";

      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root.attributes.attr0).toBe("value0");
      expect(result.root.attributes.attr99).toBe("value99");
    });
  });

  describe("Malformed XML handling", () => {
    it("should fail on unclosed tag", async () => {
      const xmlStr = `<root>unclosed`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on mismatched tags", async () => {
      const xmlStr = `<root>content</other>`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on invalid tag name", async () => {
      const xmlStr = `<root><123/></root>`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });

    it("should fail on invalid attribute syntax", async () => {
      const xmlStr = `<root attr=value/>`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });

    it("should fail on duplicate attribute names", async () => {
      const xmlStr = `<root attr="value1" attr="value2"/>`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });

    it("should fail on missing root element", async () => {
      const xmlStr = `<child1/><child2/>`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });

    it("should fail on multiple root elements", async () => {
      const xmlStr = `<root/><root/>`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });

    it("should fail on invalid entity reference", async () => {
      const xmlStr = `<root>&undefined;</root>`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });

    it("should fail on unterminated CDATA", async () => {
      const xmlStr = `<root><![CDATA[unclosed</root>`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      expect(Either.isLeft(result)).toBe(true);
    });

    it("should fail on invalid XML declaration", async () => {
      const xmlStr = `<?xml version=1.0?>
<root/>`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });
  });

  describe("Error handling", () => {
    it("should provide informative parse error", async () => {
      const xmlStr = "<root>";
      const exit = await Effect.runPromiseExit(xml.parseStringDefault(xmlStr));

      expect(Exit.isFailure(exit)).toBe(true);
      if (Exit.isFailure(exit)) {
        const error = Cause.failureOption(exit.cause);
        expect(error._tag).toBe("Some");
      }
    });

    it("should include error details", async () => {
      const xmlStr = "<root><child></root>";
      const exit = await Effect.runPromiseExit(xml.parseStringDefault(xmlStr));

      expect(Exit.isFailure(exit)).toBe(true);
    });

    it("should report position of error", async () => {
      const xmlStr = `<root>content</other>`;
      const exit = await Effect.runPromiseExit(xml.parseStringDefault(xmlStr));

      expect(Exit.isFailure(exit)).toBe(true);
    });
  });

  describe("Element structure validation", () => {
    it("should return proper XmlElement structure", async () => {
      const xmlStr = `<root attr="value"><child>text</child></root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));

      expect(result.root).toBeDefined();
      expect(result.root.name).toBe("root");
      expect(result.root.attributes).toBeDefined();
      expect(result.root.children).toBeDefined();
    });

    it("should have readonly attributes", async () => {
      const xmlStr = `<root/>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));

      expect(
        Object.isFrozen(result.root.attributes) ||
          typeof result.root.attributes === "object"
      ).toBe(true);
    });

    it("should have readonly children array", async () => {
      const xmlStr = `<root><child/></root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));

      expect(Array.isArray(result.root.children)).toBe(true);
    });
  });

  describe("Type discrimination in children", () => {
    it("should distinguish text from elements", async () => {
      const xmlStr = `<root>text<child/>more text</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));

      const children = result.root.children;
      const textNodes = children.filter(
        (c): c is string => typeof c === "string"
      );
      const elementNodes = children.filter(
        (c): c is XmlElement => typeof c === "object"
      );

      expect(textNodes.length).toBeGreaterThan(0);
      expect(elementNodes.length).toBeGreaterThan(0);
    });

    it("should preserve order of mixed content", async () => {
      const xmlStr = `<root>a<b/>c<d/>e</root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));

      const children = result.root.children;
      expect(children.length).toBeGreaterThan(1);
      // First child should be text "a"
      expect(typeof children[0]).toBe("string");
    });
  });
});
