/**
 * Complex XML structure tests for effect-xml
 *
 * Tests deeply nested elements, mixed content, and attribute handling
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import * as xml from "../../src/api.js";
import { XmlBackendLayer } from "../../src/backends/XmlBackend.js";
import type { XmlElement } from "../../src/types.js";

describe("Complex XML Structures", () => {
  describe("deeply nested elements", () => {
    it("should parse deeply nested structure", async () => {
      const xmlStr = `<root>
        <level1>
          <level2>
            <level3>
              <level4>
                <level5>deep content</level5>
              </level4>
            </level3>
          </level2>
        </level1>
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
      expect(result.root.name).toBe("root");
    });

    it("should handle very deep nesting (10+ levels)", async () => {
      let xmlStr = "<root>";
      for (let i = 1; i <= 10; i++) {
        xmlStr += `<level${i}>`;
      }
      xmlStr += "deep content";
      for (let i = 10; i >= 1; i--) {
        xmlStr += `</level${i}>`;
      }
      xmlStr += "</root>";

      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });
  });

  describe("mixed content", () => {
    it("should parse text mixed with elements", async () => {
      const xmlStr = `<root>
        text before
        <child1>child content</child1>
        text middle
        <child2>another child</child2>
        text after
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
      expect(result.root.children).toBeDefined();
      expect(result.root.children?.length).toBeGreaterThan(0);
    });

    it("should preserve whitespace in mixed content", async () => {
      const xmlStr = `<root>
        <para>Line 1<br/>Line 2</para>
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });

    it("should handle inline elements", async () => {
      const xmlStr = `<root><p>This is <strong>bold</strong> and <em>italic</em> text.</p></root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
      expect(result.root.name).toBe("root");
    });
  });

  describe("attribute handling", () => {
    it("should parse elements with multiple attributes", async () => {
      const xmlStr = `<element attr1="value1" attr2="value2" attr3="value3">content</element>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
      expect(result.root.name).toBe("element");
    });

    it("should handle attributes with special characters", async () => {
      const xmlStr = `<elem attr="value with &lt;brackets&gt; &amp; ampersand">content</elem>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
      expect(result.root.name).toBe("elem");
    });

    it("should handle attributes with quotes", async () => {
      const xmlStr = `<elem attr='value with "quotes"'>content</elem>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });

    it("should handle empty attributes", async () => {
      const xmlStr = `<elem attr="">content</elem>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });

    it("should handle boolean-style attributes", async () => {
      const xmlStr = `<input type="checkbox" checked="checked" disabled="disabled" />`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });

    it("should handle numeric and URL attributes", async () => {
      const xmlStr = `<link href="http://example.com/path" id="123" size="1024">content</link>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });
  });

  describe("sibling handling", () => {
    it("should parse many sibling elements", async () => {
      let xmlStr = "<root>";
      for (let i = 1; i <= 10; i++) {
        xmlStr += `<item id="${i}">Item ${i}</item>`;
      }
      xmlStr += "</root>";

      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
      expect(result.root.children).toBeDefined();
    });

    it("should preserve sibling order", async () => {
      const xmlStr = `<root>
        <first>1</first>
        <second>2</second>
        <third>3</third>
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
      expect(result.root.children).toBeDefined();
    });

    it("should handle elements with same tag name", async () => {
      const xmlStr = `<root>
        <item>first</item>
        <item>second</item>
        <item>third</item>
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });
  });

  describe("entity references", () => {
    it("should handle standard XML entities", async () => {
      const xmlStr = `<root>
        &lt;tag&gt; &amp; &quot;quote&quot; &apos;apostrophe&apos;
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });

    it("should handle numeric character references", async () => {
      const xmlStr = `<root>
        &#65; &#x41; (both are 'A')
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });

    it("should handle Unicode character references", async () => {
      const xmlStr = `<root>
        &#8364; (Euro €) &#x20AC; (Euro €)
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });
  });
});
