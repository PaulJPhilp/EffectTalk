/**
 * Schema validation tests for effect-artifact
 *
 * Tests type validation and schema constraints for all artifact schemas
 */

import { describe, expect, it } from "vitest";
import { Schema } from "effect";
import {
  ArtifactCategorySchema,
  ModelInfoSchema,
  ArtifactTypeSchema,
  RenderingHintsSchema,
  ArtifactMetadataSchema,
  ArtifactSchema,
  ArtifactVersionDiffSchema,
  ArtifactQueryOptionsSchema,
} from "../../src/schemas.js";

describe("Schema Validation - effect-artifact", () => {
  describe("ArtifactCategorySchema", () => {
    it("should accept all valid categories", () => {
      const categories = [
        "code",
        "document",
        "diagram",
        "data",
        "media",
        "markup",
        "configuration",
      ] as const;

      for (const category of categories) {
        const result = Schema.decodeSync(ArtifactCategorySchema)(category);
        expect(result).toBe(category);
      }
    });

    it("should reject invalid categories", () => {
      expect(() => {
        Schema.decodeSync(ArtifactCategorySchema)("invalid");
      }).toThrow();
    });
  });

  describe("ModelInfoSchema", () => {
    it("should validate complete ModelInfo", () => {
      const now = new Date();
      const modelInfo = {
        provider: "openai",
        model: "gpt-4",
        timestamp: now,
      };

      const result = Schema.decodeSync(ModelInfoSchema)(modelInfo);
      expect(result.provider).toBe("openai");
      expect(result.model).toBe("gpt-4");
      expect(result.timestamp).toEqual(now);
    });

    it("should reject missing required fields", () => {
      expect(() => {
        Schema.decodeSync(ModelInfoSchema)({
          provider: "openai",
          // Missing model and timestamp
        });
      }).toThrow();
    });

    it("should require timestamp to be a Date", () => {
      expect(() => {
        Schema.decodeSync(ModelInfoSchema)({
          provider: "openai",
          model: "gpt-4",
          timestamp: "2024-01-01", // String, not Date
        });
      }).toThrow();
    });
  });

  describe("ArtifactTypeSchema - Discriminated Unions", () => {
    describe("Code type", () => {
      it("should validate code artifact type", () => {
        const codeType = {
          category: "code" as const,
          language: "typescript",
        };

        const result = Schema.decodeSync(ArtifactTypeSchema)(codeType);
        expect(result.category).toBe("code");
        expect(result.language).toBe("typescript");
      });

      it("should accept optional framework field", () => {
        const codeType = {
          category: "code" as const,
          language: "javascript",
          framework: "react",
        };

        const result = Schema.decodeSync(ArtifactTypeSchema)(codeType);
        expect(result.framework).toBe("react");
      });

      it("should allow code without framework", () => {
        const codeType = {
          category: "code" as const,
          language: "python",
        };

        const result = Schema.decodeSync(ArtifactTypeSchema)(codeType);
        expect(result.framework).toBeUndefined();
      });
    });

    describe("Document type", () => {
      it("should validate document artifact type", () => {
        const docType = {
          category: "document" as const,
          format: "markdown" as const,
        };

        const result = Schema.decodeSync(ArtifactTypeSchema)(docType);
        expect(result.category).toBe("document");
        expect(result.format).toBe("markdown");
      });

      it("should accept all document formats", () => {
        const formats = ["markdown", "plaintext", "html"] as const;
        for (const format of formats) {
          const docType = {
            category: "document" as const,
            format,
          };
          const result = Schema.decodeSync(ArtifactTypeSchema)(docType);
          expect(result.format).toBe(format);
        }
      });
    });

    describe("Diagram type", () => {
      it("should validate diagram artifact type", () => {
        const diagramType = {
          category: "diagram" as const,
          diagramType: "mermaid" as const,
        };

        const result = Schema.decodeSync(ArtifactTypeSchema)(diagramType);
        expect(result.category).toBe("diagram");
        expect(result.diagramType).toBe("mermaid");
      });

      it("should accept all diagram types", () => {
        const types = ["mermaid", "plantuml", "svg", "dot"] as const;
        for (const diagramType of types) {
          const diagram = {
            category: "diagram" as const,
            diagramType,
          };
          const result = Schema.decodeSync(ArtifactTypeSchema)(diagram);
          expect(result.diagramType).toBe(diagramType);
        }
      });
    });

    describe("Data type", () => {
      it("should validate data artifact type", () => {
        const dataType = {
          category: "data" as const,
          dataFormat: "json" as const,
        };

        const result = Schema.decodeSync(ArtifactTypeSchema)(dataType);
        expect(result.category).toBe("data");
        expect(result.dataFormat).toBe("json");
      });

      it("should accept all data formats", () => {
        const formats = ["json", "csv", "yaml", "toml", "xml"] as const;
        for (const dataFormat of formats) {
          const data = {
            category: "data" as const,
            dataFormat,
          };
          const result = Schema.decodeSync(ArtifactTypeSchema)(data);
          expect(result.dataFormat).toBe(dataFormat);
        }
      });
    });

    describe("Media type", () => {
      it("should validate media artifact type", () => {
        const mediaType = {
          category: "media" as const,
          mediaType: "image" as const,
          mimeType: "image/png",
          encoding: "base64" as const,
        };

        const result = Schema.decodeSync(ArtifactTypeSchema)(mediaType);
        expect(result.category).toBe("media");
        expect(result.mediaType).toBe("image");
        expect(result.mimeType).toBe("image/png");
        expect(result.encoding).toBe("base64");
      });

      it("should accept both media types", () => {
        const types = ["image", "audio"] as const;
        for (const mediaType of types) {
          const media = {
            category: "media" as const,
            mediaType,
            mimeType: "image/jpeg",
            encoding: "base64" as const,
          };
          const result = Schema.decodeSync(ArtifactTypeSchema)(media);
          expect(result.mediaType).toBe(mediaType);
        }
      });
    });

    describe("Markup type", () => {
      it("should validate markup artifact type", () => {
        const markupType = {
          category: "markup" as const,
          markupType: "html" as const,
        };

        const result = Schema.decodeSync(ArtifactTypeSchema)(markupType);
        expect(result.category).toBe("markup");
        expect(result.markupType).toBe("html");
      });

      it("should accept all markup types", () => {
        const types = ["html", "xml", "jsx", "tsx"] as const;
        for (const markupType of types) {
          const markup = {
            category: "markup" as const,
            markupType,
          };
          const result = Schema.decodeSync(ArtifactTypeSchema)(markup);
          expect(result.markupType).toBe(markupType);
        }
      });
    });

    describe("Configuration type", () => {
      it("should validate configuration artifact type", () => {
        const configType = {
          category: "configuration" as const,
          configType: "docker",
        };

        const result = Schema.decodeSync(ArtifactTypeSchema)(configType);
        expect(result.category).toBe("configuration");
        expect(result.configType).toBe("docker");
      });
    });

    it("should reject mismatched category and type fields", () => {
      expect(() => {
        Schema.decodeSync(ArtifactTypeSchema)({
          category: "code",
          format: "markdown", // Wrong field for code category
        });
      }).toThrow();
    });
  });

  describe("RenderingHintsSchema", () => {
    it("should validate complete rendering hints", () => {
      const hints = {
        syntaxHighlighting: true,
        lineNumbers: true,
        theme: "dark" as const,
        collapsible: false,
        maxHeight: 500,
        readOnly: false,
        diffView: false,
        executionEnabled: true,
      };

      const result = Schema.decodeSync(RenderingHintsSchema)(hints);
      expect(result.syntaxHighlighting).toBe(true);
      expect(result.lineNumbers).toBe(true);
      expect(result.theme).toBe("dark");
      expect(result.maxHeight).toBe(500);
    });

    it("should accept empty rendering hints", () => {
      const hints = {};
      const result = Schema.decodeSync(RenderingHintsSchema)(hints);
      expect(result).toEqual({});
    });

    it("should handle partial rendering hints", () => {
      const hints = {
        syntaxHighlighting: true,
        theme: "light" as const,
      };

      const result = Schema.decodeSync(RenderingHintsSchema)(hints);
      expect(result.syntaxHighlighting).toBe(true);
      expect(result.theme).toBe("light");
      expect(result.lineNumbers).toBeUndefined();
    });

    it("should accept all theme values", () => {
      const themes = ["light", "dark", "auto"] as const;
      for (const theme of themes) {
        const hints = { theme };
        const result = Schema.decodeSync(RenderingHintsSchema)(hints);
        expect(result.theme).toBe(theme);
      }
    });
  });

  describe("ArtifactMetadataSchema", () => {
    it("should validate complete artifact metadata", () => {
      const now = new Date();
      const metadata = {
        version: "1.0.0",
        created: now,
        updated: now,
        author: "John Doe",
        title: "Sample Artifact",
        description: "A sample artifact for testing",
        tags: ["test", "sample"],
        parentVersion: "0.9.0",
        generatedBy: "ai" as const,
        modelInfo: {
          provider: "openai",
          model: "gpt-4",
          timestamp: now,
        },
      };

      const result = Schema.decodeSync(ArtifactMetadataSchema)(metadata);
      expect(result.version).toBe("1.0.0");
      expect(result.title).toBe("Sample Artifact");
      expect(result.tags).toEqual(["test", "sample"]);
      expect(result.modelInfo?.provider).toBe("openai");
    });

    it("should validate minimal metadata with required fields only", () => {
      const now = new Date();
      const metadata = {
        version: "1.0.0",
        created: now,
        updated: now,
        title: "Sample Artifact",
        tags: [],
      };

      const result = Schema.decodeSync(ArtifactMetadataSchema)(metadata);
      expect(result.version).toBe("1.0.0");
      expect(result.title).toBe("Sample Artifact");
      expect(result.author).toBeUndefined();
      expect(result.description).toBeUndefined();
    });

    it("should accept all generatedBy values", () => {
      const now = new Date();
      const values = ["ai", "human", "mixed"] as const;

      for (const value of values) {
        const metadata = {
          version: "1.0.0",
          created: now,
          updated: now,
          title: "Test",
          tags: [],
          generatedBy: value,
        };

        const result = Schema.decodeSync(ArtifactMetadataSchema)(metadata);
        expect(result.generatedBy).toBe(value);
      }
    });

    it("should reject missing required fields", () => {
      const now = new Date();
      expect(() => {
        Schema.decodeSync(ArtifactMetadataSchema)({
          version: "1.0.0",
          created: now,
          // Missing updated, title, tags
        });
      }).toThrow();
    });

    it("should accept empty tags array", () => {
      const now = new Date();
      const metadata = {
        version: "1.0.0",
        created: now,
        updated: now,
        title: "Test",
        tags: [],
      };

      const result = Schema.decodeSync(ArtifactMetadataSchema)(metadata);
      expect(result.tags).toEqual([]);
    });
  });

  describe("ArtifactSchema", () => {
    it("should validate complete artifact", () => {
      const now = new Date();
      const artifact = {
        id: "art-123",
        type: {
          category: "code" as const,
          language: "typescript",
        },
        content: "console.log('hello');",
        metadata: {
          version: "1.0.0",
          created: now,
          updated: now,
          title: "Hello World",
          tags: ["hello"],
        },
        renderingHints: {
          syntaxHighlighting: true,
          lineNumbers: true,
        },
      };

      const result = Schema.decodeSync(ArtifactSchema)(artifact);
      expect(result.id).toBe("art-123");
      expect(result.content).toBe("console.log('hello');");
      expect(result.type.category).toBe("code");
    });

    it("should validate artifact without rendering hints", () => {
      const now = new Date();
      const artifact = {
        id: "art-124",
        type: {
          category: "document" as const,
          format: "markdown" as const,
        },
        content: "# Hello World",
        metadata: {
          version: "1.0.0",
          created: now,
          updated: now,
          title: "Markdown Doc",
          tags: [],
        },
      };

      const result = Schema.decodeSync(ArtifactSchema)(artifact);
      expect(result.renderingHints).toBeUndefined();
    });

    it("should reject missing required fields", () => {
      const now = new Date();
      expect(() => {
        Schema.decodeSync(ArtifactSchema)({
          id: "art-125",
          type: {
            category: "code" as const,
            language: "python",
          },
          // Missing content and metadata
        });
      }).toThrow();
    });

    it("should validate artifact with all artifact types", () => {
      const now = new Date();
      const types = [
        { category: "code" as const, language: "python" },
        { category: "document" as const, format: "markdown" as const },
        { category: "diagram" as const, diagramType: "mermaid" as const },
        { category: "data" as const, dataFormat: "json" as const },
        {
          category: "media" as const,
          mediaType: "image" as const,
          mimeType: "image/png",
          encoding: "base64" as const,
        },
        { category: "markup" as const, markupType: "html" as const },
        { category: "configuration" as const, configType: "nginx" },
      ];

      for (const type of types) {
        const artifact = {
          id: "art-test",
          type,
          content: "test content",
          metadata: {
            version: "1.0.0",
            created: now,
            updated: now,
            title: "Test",
            tags: [],
          },
        };

        const result = Schema.decodeSync(ArtifactSchema)(artifact);
        expect(result.type.category).toBeDefined();
      }
    });
  });

  describe("ArtifactVersionDiffSchema", () => {
    it("should validate complete version diff", () => {
      const now = new Date();
      const artifact = {
        id: "art-123",
        type: {
          category: "code" as const,
          language: "typescript",
        },
        content: "console.log('old');",
        metadata: {
          version: "1.0.0",
          created: now,
          updated: now,
          title: "Test",
          tags: [],
        },
      };

      const artifact2 = {
        ...artifact,
        content: "console.log('new');",
        metadata: {
          ...artifact.metadata,
          version: "1.1.0",
        },
      };

      const diff = {
        oldVersion: artifact,
        newVersion: artifact2,
        changes: {
          contentChanged: true,
          metadataChanged: true,
          typeChanged: false,
          diff: "@@ -1 +1 @@ console.log('old'); => console.log('new');",
        },
      };

      const result = Schema.decodeSync(ArtifactVersionDiffSchema)(diff);
      expect(result.oldVersion.content).toBe("console.log('old');");
      expect(result.newVersion.content).toBe("console.log('new');");
      expect(result.changes.contentChanged).toBe(true);
    });

    it("should reject missing changes object", () => {
      const now = new Date();
      const artifact = {
        id: "art-123",
        type: {
          category: "code" as const,
          language: "typescript",
        },
        content: "test",
        metadata: {
          version: "1.0.0",
          created: now,
          updated: now,
          title: "Test",
          tags: [],
        },
      };

      expect(() => {
        Schema.decodeSync(ArtifactVersionDiffSchema)({
          oldVersion: artifact,
          newVersion: artifact,
          // Missing changes
        });
      }).toThrow();
    });

    it("should require all change tracking fields", () => {
      const now = new Date();
      const artifact = {
        id: "art-123",
        type: {
          category: "code" as const,
          language: "typescript",
        },
        content: "test",
        metadata: {
          version: "1.0.0",
          created: now,
          updated: now,
          title: "Test",
          tags: [],
        },
      };

      expect(() => {
        Schema.decodeSync(ArtifactVersionDiffSchema)({
          oldVersion: artifact,
          newVersion: artifact,
          changes: {
            contentChanged: true,
            // Missing metadataChanged, typeChanged, diff
          },
        });
      }).toThrow();
    });
  });

  describe("ArtifactQueryOptionsSchema", () => {
    it("should validate complete query options", () => {
      const now = new Date();
      const options = {
        category: "code" as const,
        tags: ["typescript", "react"],
        authorPattern: "John.*",
        generatedBy: "ai" as const,
        afterDate: now,
        beforeDate: now,
      };

      const result = Schema.decodeSync(ArtifactQueryOptionsSchema)(options);
      expect(result.category).toBe("code");
      expect(result.tags).toEqual(["typescript", "react"]);
    });

    it("should accept empty query options", () => {
      const options = {};
      const result = Schema.decodeSync(ArtifactQueryOptionsSchema)(options);
      expect(result).toEqual({});
    });

    it("should handle partial query options", () => {
      const options = {
        tags: ["test"],
        authorPattern: "Alice.*",
      };

      const result = Schema.decodeSync(ArtifactQueryOptionsSchema)(options);
      expect(result.tags).toEqual(["test"]);
      expect(result.authorPattern).toBe("Alice.*");
      expect(result.category).toBeUndefined();
    });

    it("should accept all generatedBy values in options", () => {
      const values = ["ai", "human", "mixed"] as const;

      for (const value of values) {
        const options = { generatedBy: value };
        const result = Schema.decodeSync(ArtifactQueryOptionsSchema)(options);
        expect(result.generatedBy).toBe(value);
      }
    });

    it("should accept date range queries", () => {
      const start = new Date("2024-01-01");
      const end = new Date("2024-12-31");
      const options = {
        afterDate: start,
        beforeDate: end,
      };

      const result = Schema.decodeSync(ArtifactQueryOptionsSchema)(options);
      expect(result.afterDate).toEqual(start);
      expect(result.beforeDate).toEqual(end);
    });
  });
});
