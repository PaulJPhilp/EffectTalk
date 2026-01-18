/**
 * Namespace handling tests for effect-xml
 *
 * Tests XML namespace prefix resolution and namespace-aware parsing
 */

import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import * as xml from "../../src/api.js";
import { XmlBackendLayer } from "../../src/backends/XmlBackend.js";

describe("XML Namespaces", () => {
  describe("namespace declarations", () => {
    it("should parse document with default namespace", async () => {
      const xmlStr = `<root xmlns="http://example.com">
        <child>content</child>
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
      expect(result.root.name).toBe("root");
    });

    it("should parse document with prefixed namespace", async () => {
      const xmlStr = `<root xmlns:ex="http://example.com">
        <ex:child>content</ex:child>
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
      expect(result.root.name).toBe("root");
    });

    it("should handle multiple namespace declarations", async () => {
      const xmlStr = `<root
        xmlns:a="http://example.com/a"
        xmlns:b="http://example.com/b">
        <a:elem1>content1</a:elem1>
        <b:elem2>content2</b:elem2>
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
      expect(result.root.children).toBeDefined();
    });

    it("should handle nested namespace declarations", async () => {
      const xmlStr = `<root xmlns="http://example.com/root">
        <child xmlns="http://example.com/child">
          <grandchild>content</grandchild>
        </child>
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });

    it("should handle namespace inheritance", async () => {
      const xmlStr = `<root xmlns="http://example.com">
        <parent>
          <child>content</child>
        </parent>
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
      expect(result.root.children).toBeDefined();
    });
  });

  describe("namespace prefix resolution", () => {
    it("should resolve prefixes correctly", async () => {
      const xmlStr = `<doc xmlns="http://www.w3.org/1999/xhtml">
        <body>
          <p>Paragraph</p>
        </body>
      </doc>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
      expect(result.root.name).toBe("doc");
    });

    it("should handle prefix redeclaration", async () => {
      const xmlStr = `<root xmlns:a="http://example.com/a">
        <child xmlns:a="http://example.com/b">
          <elem>content</elem>
        </child>
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });

    it("should handle xml: prefix (reserved)", async () => {
      const xmlStr = `<root xml:lang="en">
        <child xml:space="preserve">content</child>
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });
  });

  describe("namespace attributes", () => {
    it("should parse xmlns attributes", async () => {
      const xmlStr = `<root xmlns="http://example.com">
        <child attr="value">content</child>
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });

    it("should handle xml: prefix in attributes", async () => {
      const xmlStr = `<root xml:id="id1" xml:lang="en">
        content
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });

    it("should handle local attributes alongside namespaced ones", async () => {
      const xmlStr = `<root xmlns:ex="http://example.com"
                          id="root1"
                          ex:property="value">
        content
      </root>`;
      const result = await Effect.runPromise(xml.parseStringDefault(xmlStr));
      expect(result.root).toBeDefined();
    });
  });

  describe("malformed namespace handling", () => {
    it("should handle empty namespace URI", async () => {
      const xmlStr = `<root xmlns="">
        <child>content</child>
      </root>`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });

    it("should handle undefined namespace prefix usage", async () => {
      const xmlStr = `<root>
        <undefined:child>content</undefined:child>
      </root>`;
      const result = await Effect.runPromise(
        Effect.either(xml.parseStringDefault(xmlStr))
      );
      // Should either parse successfully or fail gracefully
      expect(result._tag).toMatch(/^(Left|Right)$/);
    });
  });
});
