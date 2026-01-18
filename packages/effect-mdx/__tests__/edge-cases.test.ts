import { FileSystem } from "@effect/platform";
import { describe, expect, it } from "bun:test";
import { Effect, Layer } from "effect";
import { MdxConfigService } from "../src/config";
import { MdxService } from "../src/service";

describe("MdxService - Edge Cases", () => {
  const mockConfigLayer = Layer.succeed(MdxConfigService, {
    getConfig: () => ({
      remarkPlugins: [],
      rehypePlugins: [],
      sanitize: false,
      slug: false,
      autolinkHeadings: false,
    }),
  });

  describe("Empty files", () => {
    it("should handle completely empty file", async () => {
      const emptyContent = "";

      const mockFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: (_path) =>
            Effect.succeed(new Uint8Array(Buffer.from(emptyContent))),
          readFileString: (_path) => Effect.succeed(emptyContent),
        })
      );

      const testLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(mockConfigLayer)
      );

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;
        return yield* mdx.readMdxAndFrontmatter("empty.mdx");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result.content).toBe("");
      expect(result.mdxBody).toBe("");
      expect(result.frontmatter).toEqual({});
    });

    it("should handle file with only whitespace", async () => {
      const whitespaceContent = "   \n\n  \t  \n";

      const mockFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: (_path) =>
            Effect.succeed(new Uint8Array(Buffer.from(whitespaceContent))),
          readFileString: (_path) => Effect.succeed(whitespaceContent),
        })
      );

      const testLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(mockConfigLayer)
      );

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;
        return yield* mdx.readMdxAndFrontmatter("whitespace.mdx");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result.frontmatter).toEqual({});
      expect(result.mdxBody).toContain("\n");
    });
  });

  describe("Files without frontmatter", () => {
    it("should handle MDX with no frontmatter", async () => {
      const noFrontmatter = `# Hello World

This is just content without frontmatter.`;

      const mockFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: (_path) =>
            Effect.succeed(new Uint8Array(Buffer.from(noFrontmatter))),
          readFileString: (_path) => Effect.succeed(noFrontmatter),
        })
      );

      const testLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(mockConfigLayer)
      );

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;
        return yield* mdx.readMdxAndFrontmatter("no-frontmatter.mdx");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result.frontmatter).toEqual({});
      expect(result.mdxBody).toContain("# Hello World");
    });

    it("should compile HTML from content without frontmatter", async () => {
      const noFrontmatter = `# Hello World

This is just content.`;

      const mockFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: (_path) => Effect.succeed(new Uint8Array()),
          readFileString: (_path) => Effect.succeed(""),
        })
      );

      const testLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(mockConfigLayer)
      );

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;
        return yield* mdx.compileMdxToHtml(noFrontmatter);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result).toContain("<h1>Hello World</h1>");
      expect(result).toContain("<p>This is just content.</p>");
    });
  });

  describe("Files with only frontmatter", () => {
    it("should handle file with only frontmatter, no body", async () => {
      const onlyFrontmatter = `---
title: Test Title
author: John Doe
---`;

      const mockFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: (_path) =>
            Effect.succeed(new Uint8Array(Buffer.from(onlyFrontmatter))),
          readFileString: (_path) => Effect.succeed(onlyFrontmatter),
        })
      );

      const testLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(mockConfigLayer)
      );

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;
        return yield* mdx.readMdxAndFrontmatter("only-frontmatter.mdx");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result.frontmatter).toEqual({
        title: "Test Title",
        author: "John Doe",
      });
      expect(result.mdxBody).toBe("");
    });

    it("should compile empty HTML from frontmatter-only file", async () => {
      const onlyFrontmatter = `---
title: Test
---`;

      const mockFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: (_path) => Effect.succeed(new Uint8Array()),
          readFileString: (_path) => Effect.succeed(""),
        })
      );

      const testLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(mockConfigLayer)
      );

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;
        return yield* mdx.compileMdxToHtml(onlyFrontmatter);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result).toBe("");
    });
  });

  describe("Unicode content", () => {
    it("should handle emoji in content", async () => {
      const emojiContent = `---
title: Emoji Test 🎉
---

# Hello 👋 World 🌍

Testing emoji: 🚀 🎨 🔥`;

      const mockFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: (_path) =>
            Effect.succeed(new Uint8Array(Buffer.from(emojiContent))),
          readFileString: (_path) => Effect.succeed(emojiContent),
        })
      );

      const testLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(mockConfigLayer)
      );

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;
        return yield* mdx.readMdxAndFrontmatter("emoji.mdx");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result.frontmatter.title).toBe("Emoji Test 🎉");
      expect(result.mdxBody).toContain("👋");
      expect(result.mdxBody).toContain("🌍");
    });

    it("should handle CJK characters", async () => {
      const cjkContent = `---
title: 中文测试
author: 山田太郎
---

# 你好世界

こんにちは世界
안녕하세요 세계`;

      const mockFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: (_path) =>
            Effect.succeed(new Uint8Array(Buffer.from(cjkContent))),
          readFileString: (_path) => Effect.succeed(cjkContent),
        })
      );

      const testLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(mockConfigLayer)
      );

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;
        const read = yield* mdx.readMdxAndFrontmatter("cjk.mdx");
        const html = yield* mdx.compileMdxToHtml(cjkContent);
        return { read, html };
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result.read.frontmatter.title).toBe("中文测试");
      expect(result.read.frontmatter.author).toBe("山田太郎");
      expect(result.html).toContain("你好世界");
      expect(result.html).toContain("こんにちは世界");
    });

    it("should handle special characters and symbols", async () => {
      const specialChars = `---
title: Special © ® ™
---

# Math: ∑ ∫ ∂ √

Arrows: ← → ↑ ↓
Currency: € £ ¥ $`;

      const mockFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: (_path) => Effect.succeed(new Uint8Array()),
          readFileString: (_path) => Effect.succeed(""),
        })
      );

      const testLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(mockConfigLayer)
      );

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;
        return yield* mdx.compileMdxToHtml(specialChars);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result).toContain("∑");
      expect(result).toContain("€");
      expect(result).toContain("←");
    });
  });

  describe("Nested objects in frontmatter", () => {
    it("should handle deeply nested objects", async () => {
      const nestedContent = `---
meta:
  author:
    name: John Doe
    contact:
      email: john@example.com
      social:
        twitter: "@johndoe"
  tags:
    - typescript
    - effect
---

# Content`;

      const mockFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: (_path) =>
            Effect.succeed(new Uint8Array(Buffer.from(nestedContent))),
          readFileString: (_path) => Effect.succeed(nestedContent),
        })
      );

      const testLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(mockConfigLayer)
      );

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;
        return yield* mdx.readMdxAndFrontmatter("nested.mdx");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result.frontmatter).toHaveProperty("meta");
      const meta = result.frontmatter.meta as any;
      expect(meta.author.name).toBe("John Doe");
      expect(meta.author.contact.email).toBe("john@example.com");
      expect(meta.author.contact.social.twitter).toBe("@johndoe");
    });

    it("should handle arrays in frontmatter", async () => {
      const arrayContent = `---
tags:
  - typescript
  - effect
  - mdx
numbers:
  - 1
  - 2
  - 3
mixed:
  - string
  - 42
  - true
---

# Content`;

      const mockFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: (_path) =>
            Effect.succeed(new Uint8Array(Buffer.from(arrayContent))),
          readFileString: (_path) => Effect.succeed(arrayContent),
        })
      );

      const testLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(mockConfigLayer)
      );

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;
        return yield* mdx.readMdxAndFrontmatter("arrays.mdx");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(Array.isArray(result.frontmatter.tags)).toBe(true);
      expect((result.frontmatter.tags as any).length).toBe(3);
      expect((result.frontmatter.numbers as any)[0]).toBe(1);
      expect(result.frontmatter.mixed as any).toEqual(["string", 42, true]);
    });
  });

  describe("Large files", () => {
    it("should handle large content", async () => {
      const largeBody = Array(1000)
        .fill("This is a line of content.\n")
        .join("");
      const largeContent = `---
title: Large File
---

${largeBody}`;

      const mockFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: (_path) =>
            Effect.succeed(new Uint8Array(Buffer.from(largeContent))),
          readFileString: (_path) => Effect.succeed(largeContent),
        })
      );

      const testLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(mockConfigLayer)
      );

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;
        return yield* mdx.readMdxAndFrontmatter("large.mdx");
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result.frontmatter.title).toBe("Large File");
      expect(result.mdxBody.length).toBeGreaterThan(1000);
    });

    it("should compile large files to HTML", async () => {
      const sections = Array(100)
        .fill(null)
        .map((_, i) => `## Section ${i}\n\nContent for section ${i}.\n`)
        .join("\n");

      const largeContent = `---
title: Large Document
---

${sections}`;

      const mockFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: (_path) => Effect.succeed(new Uint8Array()),
          readFileString: (_path) => Effect.succeed(""),
        })
      );

      const testLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(mockConfigLayer)
      );

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;
        return yield* mdx.compileMdxToHtml(largeContent);
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      expect(result).toContain("<h2>Section 0</h2>");
      expect(result).toContain("<h2>Section 99</h2>");
    });
  });
});
