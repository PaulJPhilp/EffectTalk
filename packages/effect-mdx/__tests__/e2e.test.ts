import { FileSystem } from "@effect/platform";
import { describe, expect, it } from "bun:test";
import { Effect, Layer } from "effect";
import { MdxConfigService } from "../src/config";
import { MdxService } from "../src/service";

// Test layer with mocked filesystem (same as other tests)
const mockFsLayer = Layer.succeed(
  FileSystem.FileSystem,
  FileSystem.make({
    readFile: () => Effect.succeed(new Uint8Array()),
    readFileString: () => Effect.succeed(""),
  })
);

const mockConfigLayer = Layer.succeed(MdxConfigService, {
  getConfig: () => ({
    remarkPlugins: [],
    rehypePlugins: [],
    sanitize: false,
    slug: false,
    autolinkHeadings: false,
  }),
});

const testLayer = MdxServiceLayer.pipe(
  Layer.provide(mockFsLayer),
  Layer.provide(mockConfigLayer)
);

describe("End-to-End Test Suite", () => {
  describe("Complete MDX Processing Pipelines", () => {
    it("should process a blog post from frontmatter parsing to final HTML", async () => {
      const blogPost = `---yaml
title: "Building Type-Safe APIs with Effect"
author: "Effect Team"
publishedAt: "2024-01-15"
tags: ["typescript", "effect", "api", "type-safety"]
description: "Learn how to build robust, type-safe APIs using Effect"
---

# Building Type-Safe APIs with Effect

Effect provides excellent tools for building type-safe APIs that handle errors gracefully and compose beautifully.

## The Problem

Traditional API code often looks like this:

\`\`\`typescript
async function fetchUser(id: string) {
  try {
    const response = await fetch(\`/api/users/\${id}\`);
    if (!response.ok) {
      throw new Error(\`HTTP \${response.status}\`);
    }
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw error;
  }
}
\`\`\`

## The Effect Solution

With Effect, we can model this much more robustly:

\`\`\`typescript
import { Effect } from "effect";

const fetchUser = (id: string) => Effect.gen(function* () {
  const response = yield* Effect.tryPromise(() =>
    fetch(\`/api/users/\${id}\`)
  );

  if (!response.ok) {
    return yield* Effect.fail(
      new Error(\`HTTP \${response.status}: \${response.statusText}\`)
    );
  }

  return yield* Effect.tryPromise(() => response.json());
});
\`\`\`

## Benefits

- **Type Safety**: Full TypeScript inference
- **Error Handling**: Explicit error types
- **Composition**: Easy to combine operations
- **Testing**: Simple to mock and test

> Effect makes complex async code as readable as sync code.

## Conclusion

Effect's approach to error handling and composition makes API code more maintainable and reliable.`;

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;

        // Step 1: Parse frontmatter
        const parsed = yield* mdx.parseMdxFile(blogPost);

        // Step 2: Extract metadata for blog platform
        const metadata = {
          title: parsed.attributes.title,
          author: parsed.attributes.author,
          publishedAt: parsed.attributes.publishedAt,
          tags: parsed.attributes.tags,
          description: parsed.attributes.description,
          slug: parsed.attributes.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-"),
        };

        // Step 3: Compile to HTML for rendering
        const html = yield* mdx.compileMdxToHtml(parsed.body);

        // Step 4: Prepare for LLM UI (if needed for AI features)
        const llmUi = yield* mdx.compileForLlmUi(blogPost);

        // Step 5: Extract parameters (if this were a parameterized template)
        const parameters = mdx.extractParameters(parsed.attributes);

        return {
          metadata,
          html,
          llmUi,
          parameters,
          frontmatter: parsed.attributes,
        };
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      // Verify complete pipeline worked
      expect(result.metadata.title).toBe("Building Type-Safe APIs with Effect");
      expect(result.metadata.slug).toBe("building-type-safe-apis-with-effect");
      expect(result.metadata.tags).toEqual([
        "typescript",
        "effect",
        "api",
        "type-safety",
      ]);

      expect(result.html).toContain(
        "<h1>Building Type-Safe APIs with Effect</h1>"
      );
      expect(result.html).toContain("<h2>The Problem</h2>");
      expect(result.html).toContain("<h2>The Effect Solution</h2>");
      expect(result.html).toContain('<code class="language-typescript">');
      expect(result.html).toContain("<blockquote>");

      expect(result.llmUi.frontmatter.title).toBe(
        "Building Type-Safe APIs with Effect"
      );
      expect(result.llmUi.rawMarkdown).toContain(
        "# Building Type-Safe APIs with Effect"
      );
      expect(result.llmUi.metadata.llmUiMode).toBe(true);

      expect(result.parameters).toEqual({}); // No parameters in this blog post

      expect(result.frontmatter.publishedAt).toBe("2024-01-15");
    });

    it("should process a parameterized AI prompt template", async () => {
      const promptTemplate = `---yaml
id: code-review-assistant
title: "Code Review Assistant"
description: "An AI assistant specialized in code review"
model: gpt-4
temperature: 0.3
parameters:
  code:
    type: string
    description: "The code to review"
    required: true
  language:
    type: string
    description: "Programming language"
    default: "typescript"
    required: false
  focusAreas:
    type: array
    description: "Specific areas to focus on"
    default: ["performance", "security", "maintainability"]
    required: false
metadata:
  category: "development"
  version: "1.0.0"
  author: "DevTools Team"
---

# Code Review Assistant

You are an expert code reviewer with deep knowledge of {{language}} development. Your task is to provide a thorough, constructive code review focusing on the following areas: {{focusAreas}}.

## Code to Review

\`\`\`{{language}}
{{code}}
\`\`\`

## Review Guidelines

Please analyze the code for:

1. **Correctness**: Does the code work as intended?
2. **Performance**: Are there any performance issues?
3. **Security**: Are there security vulnerabilities?
4. **Maintainability**: Is the code easy to understand and modify?
5. **Best Practices**: Does it follow {{language}} conventions?

## Response Format

Provide your review in the following structured format:

### Summary
[A brief overview of the code quality]

### Issues Found
[List specific issues with severity levels]

### Recommendations
[Specific suggestions for improvement]

### Overall Assessment
[Final rating and conclusion]`;

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;

        // Parse the template
        const parsed = yield* mdx.parseMdxFile(promptTemplate);

        // Extract parameters for UI generation
        const parameters = mdx.extractParameters(parsed.attributes);

        // Compile to HTML for documentation
        const html = yield* mdx.compileMdxToHtml(parsed.body);

        // Prepare for LLM UI
        const llmUi = yield* mdx.compileForLlmUi(promptTemplate);

        // Simulate parameter binding
        const boundParameters = {
          code: `function calculateSum(a: number, b: number): number {
  return a + b;
}`,
          language: "typescript",
          focusAreas: [
            "correctness",
            "performance",
            "typescript-best-practices",
          ],
        };

        return {
          template: parsed.attributes,
          parameters,
          html,
          llmUi,
          boundParameters,
        };
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      // Verify template metadata
      expect(result.template.id).toBe("code-review-assistant");
      expect(result.template.model).toBe("gpt-4");
      expect(result.template.temperature).toBe(0.3);

      // Verify parameter extraction
      expect(result.parameters.code.type).toBe("string");
      expect(result.parameters.code.required).toBe(true);
      expect(result.parameters.language.default).toBe("typescript");
      expect(result.parameters.focusAreas.type).toBe("array");
      expect(result.parameters.focusAreas.default).toEqual([
        "performance",
        "security",
        "maintainability",
      ]);

      // Verify HTML compilation
      expect(result.html).toContain("<h1>Code Review Assistant</h1>");
      expect(result.html).toContain("You are an expert code reviewer");

      // Verify LLM UI preparation
      expect(result.llmUi.frontmatter.title).toBe("Code Review Assistant");
      expect(result.llmUi.rawMarkdown).toContain("# Code Review Assistant");
    });

    it("should handle documentation site content processing", async () => {
      const docContent = `---json
{
  "title": "Getting Started with Effect-MDX",
  "description": "Learn how to use effect-mdx for processing MDX content",
  "category": "documentation",
  "difficulty": "beginner",
  "order": 1,
  "lastUpdated": "2024-01-15"
}
---

# Getting Started with Effect-MDX

Welcome to effect-mdx! This library provides type-safe MDX processing using the Effect ecosystem.

## Installation

Install effect-mdx using your package manager:

\`\`\`bash
bun add effect-mdx
# or
npm install effect-mdx
\`\`\`

## Basic Usage

Here's how to parse MDX content:

\`\`\`typescript
import { Effect } from "effect";
import { MdxService } from "effect-mdx";

const program = Effect.gen(function* () {
  const mdx = yield* MdxService;

  const content = \`---yaml
title: "Hello World"
---

# Hello, World!

This is my first MDX document.\`;

  const parsed = yield* mdx.parseMdxFile(content);
  const html = yield* mdx.compileMdxToHtml(parsed.body);

  return { parsed, html };
});

Effect.runPromise(program).then(console.log);
\`\`\`

## Advanced Features

### JSON Frontmatter

You can use JSON instead of YAML:

\`\`\`json
{
  "title": "JSON Frontmatter",
  "author": "Effect Team"
}
\`\`\`

### Custom Delimiters

For cases where \`---\` conflicts with your content:

\`\`\`markdown
~~~toml
title = "Custom Delimiters"
~~~

Your content here.
\`\`\`

## API Reference

The main service provides these methods:

- \`parseMdxFile()\` - Parse MDX with frontmatter
- \`compileMdxToHtml()\` - Compile to HTML
- \`compileMdx()\` - Compile to JavaScript
- \`testForFrontmatter()\` - Check for frontmatter presence

## Next Steps

- Read the [API documentation](/api)
- Check out [examples](/examples)
- Join our [community](/community)`;

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;

        // Parse with JSON frontmatter
        const parsed = yield* mdx.parseMdxFile(docContent, {
          language: "json",
        });

        // Generate documentation metadata
        const docMetadata = {
          title: parsed.attributes.title,
          description: parsed.attributes.description,
          category: parsed.attributes.category,
          difficulty: parsed.attributes.difficulty,
          order: parsed.attributes.order,
          slug: parsed.attributes.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-"),
          lastUpdated: parsed.attributes.lastUpdated,
        };

        // Compile to HTML for the website
        const html = yield* mdx.compileMdxToHtml(parsed.body);

        // Extract table of contents (simplified)
        const headings = parsed.body.match(/^#{1,6} .+$/gm) || [];
        const toc = headings.map((heading) => {
          const level = heading.match(/^#+/)?.[0].length || 1;
          const text = heading.replace(/^#+\s/, "");
          return {
            level,
            text,
            slug: text.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          };
        });

        return {
          metadata: docMetadata,
          html,
          toc,
          frontmatter: parsed.attributes,
        };
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      // Verify JSON frontmatter parsing
      expect(result.frontmatter.title).toBe("Getting Started with Effect-MDX");
      expect(result.frontmatter.category).toBe("documentation");
      expect(result.frontmatter.difficulty).toBe("beginner");
      expect(result.frontmatter.order).toBe(1);

      // Verify documentation metadata
      expect(result.metadata.slug).toBe("getting-started-with-effect-mdx");
      expect(result.metadata.lastUpdated).toBe("2024-01-15");

      // Verify HTML compilation
      expect(result.html).toContain("<h1>Getting Started with Effect-MDX</h1>");
      expect(result.html).toContain("<h2>Installation</h2>");
      expect(result.html).toContain("<h2>Basic Usage</h2>");
      expect(result.html).toContain('<code class="language-typescript">');
      expect(result.html).toContain('<code class="language-bash">');

      // Verify table of contents extraction
      expect(result.toc.length).toBeGreaterThan(3);
      expect(result.toc[0].text).toBe("Getting Started with Effect-MDX");
      expect(result.toc[0].level).toBe(1);
    });

    it("should process content with different frontmatter formats", async () => {
      const yamlContent = `---yaml
title: "YAML Content"
format: "yaml"
---

YAML frontmatter content.`;

      const jsonContent = `---json
{
  "title": "JSON Content",
  "format": "json"
}
---

JSON frontmatter content.`;

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;

        // Test different formats
        const yamlParsed = yield* mdx.parseMdxFile(yamlContent);
        const jsonParsed = yield* mdx.parseMdxFile(jsonContent, {
          language: "json",
        });

        // Test frontmatter detection for each
        const yamlHasFm = mdx.testForFrontmatter(yamlContent);
        const jsonHasFm = mdx.testForFrontmatter(jsonContent, {
          language: "json",
        });

        // Compile all to HTML
        const yamlHtml = yield* mdx.compileMdxToHtml(yamlParsed.body);
        const jsonHtml = yield* mdx.compileMdxToHtml(jsonParsed.body);

        return {
          yaml: { parsed: yamlParsed, hasFm: yamlHasFm, html: yamlHtml },
          json: { parsed: jsonParsed, hasFm: jsonHasFm, html: jsonHtml },
        };
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      // Verify YAML processing
      expect(result.yaml.parsed.attributes.title).toBe("YAML Content");
      expect(result.yaml.parsed.attributes.format).toBe("yaml");
      expect(result.yaml.hasFm).toBe(true);
      expect(result.yaml.html).toContain("YAML frontmatter content.");

      // Verify JSON processing
      expect(result.json.parsed.attributes.title).toBe("JSON Content");
      expect(result.json.parsed.attributes.format).toBe("json");
      expect(result.json.hasFm).toBe(true);
      expect(result.json.html).toContain("JSON frontmatter content.");
    });

    it("should handle content updates and frontmatter reconstruction", async () => {
      const originalContent = `---
title: "Original Title"
status: "draft"
tags: ["draft"]
---

# Original Content

This is draft content that needs updating.`;

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;

        // Parse original
        const original = yield* mdx.parseMdxFile(originalContent);

        // Update frontmatter
        const updatedFrontmatter = {
          ...original.attributes,
          title: "Updated Title",
          status: "published",
          tags: ["published", "featured"],
          publishedAt: "2024-01-15",
        };

        // Reconstruct content
        const updatedContent = mdx.updateMdxContent(
          originalContent,
          updatedFrontmatter
        );

        // Parse updated content
        const updated = yield* mdx.parseMdxFile(updatedContent);

        // Compile both versions
        const originalHtml = yield* mdx.compileMdxToHtml(original.body);
        const updatedHtml = yield* mdx.compileMdxToHtml(updated.body);

        return {
          original: original.attributes,
          updated: updated.attributes,
          originalHtml,
          updatedHtml,
          reconstructedContent: updatedContent,
        };
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      // Verify original frontmatter
      expect(result.original.title).toBe("Original Title");
      expect(result.original.status).toBe("draft");
      expect(result.original.tags).toEqual(["draft"]);

      // Verify updated frontmatter
      expect(result.updated.title).toBe("Updated Title");
      expect(result.updated.status).toBe("published");
      expect(result.updated.tags).toEqual(["published", "featured"]);
      expect(result.updated.publishedAt).toBe("2024-01-15");

      // Verify content reconstruction
      expect(result.reconstructedContent).toContain("title: Updated Title");
      expect(result.reconstructedContent).toContain("status: published");
      expect(result.reconstructedContent).toContain(
        "publishedAt: '2024-01-15'"
      );
      expect(result.reconstructedContent).toContain("# Original Content");

      // Verify HTML is the same (body didn't change)
      expect(result.originalHtml).toBe(result.updatedHtml);
    });

    it("should compile MDX to JavaScript for client-side rendering", async () => {
      const mdxContent = `---yaml
title: "Interactive Component"
description: "A component with client-side interactivity"
---

# Interactive Counter

This is an interactive counter component:

\`\`\`jsx
export default function Counter({ initialCount = 0 }) {
  const [count, setCount] = useState(initialCount);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
      <button onClick={() => setCount(count - 1)}>Decrement</button>
    </div>
  );
}
\`\`\`

This component can be used in React applications.`;

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;

        // Parse the content
        const parsed = yield* mdx.parseMdxFile(mdxContent);

        // Compile to JavaScript
        const compiled = yield* mdx.compileMdx(parsed.body);

        // Also compile to HTML for comparison
        const html = yield* mdx.compileMdxToHtml(parsed.body);

        return {
          parsed,
          compiled,
          html,
        };
      });

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(testLayer))
      );

      // Verify parsing worked
      expect(result.parsed.attributes.title).toBe("Interactive Component");
      expect(result.parsed.attributes.description).toBe(
        "A component with client-side interactivity"
      );

      // Verify JS compilation
      expect(result.compiled.code).toBeDefined();
      expect(typeof result.compiled.code).toBe("string");
      expect(result.compiled.code.length).toBeGreaterThan(0);
      expect(result.compiled.code).toContain("export default function Counter");
      expect(result.compiled.code).toContain("useState");
      // Frontmatter should be sanitized
      expect(result.compiled.frontmatter).toBeDefined();

      // Verify HTML compilation (code blocks are rendered as HTML)
      expect(result.html).toContain("<h1>Interactive Counter</h1>");
      expect(result.html).toContain(
        "<p>This is an interactive counter component:</p>"
      );
      expect(result.html).toContain('<code class="language-jsx">');
      expect(result.html).toContain("export default function"); // Code is rendered in HTML
    });

    it("should handle MDX with remark and rehype plugins", async () => {
      // Import plugins dynamically
      const { remarkGfm } = await import("remark-gfm");

      const mdxWithPlugins = `---yaml
title: "Content with Plugins"
---

# Content with GitHub Flavored Markdown

This content uses GFM features:

- [x] Task list item
- [ ] Unchecked item

| Table | Header |
|-------|--------|
| Cell  | Data   |

## Math Expressions

Inline math: $E = mc^2$

Block math:
$$
\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}
$$

> This is a blockquote with **emphasis** and \`code\`.`;

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;

        // Parse and compile with plugins
        const parsed = yield* mdx.parseMdxFile(mdxWithPlugins);
        const html = yield* mdx.compileMdxToHtml(parsed.body);

        return {
          parsed,
          html,
        };
      });

      // Create a layer with GFM plugin
      const pluginConfigLayer = Layer.succeed(MdxConfigService, {
        getConfig: () => ({
          remarkPlugins: [remarkGfm],
          rehypePlugins: [],
          sanitize: false,
          slug: false,
          autolinkHeadings: false,
        }),
      });

      const pluginLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(pluginConfigLayer)
      );

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(pluginLayer))
      );

      // Verify parsing
      expect(result.parsed.attributes.title).toBe("Content with Plugins");

      // Verify HTML with GFM features
      expect(result.html).toContain(
        "<h1>Content with GitHub Flavored Markdown</h1>"
      );
      expect(result.html).toContain('<input type="checkbox" checked disabled>');
      expect(result.html).toContain('<input type="checkbox" disabled>');
      expect(result.html).toContain("<table>");
      expect(result.html).toContain("<th>Table</th>");
      expect(result.html).toContain("<td>Cell</td>");
      expect(result.html).toContain("<blockquote>");
      expect(result.html).toContain("<strong>emphasis</strong>");
      expect(result.html).toContain("<code>code</code>");
    });

    it("should handle content with config features enabled", async () => {
      const contentWithHeadings = `---yaml
title: "Document with Headings"
description: "Testing slug and autolink features"
---

# Introduction

This is the introduction section.

## Getting Started

Here's how to get started.

### Installation

Install the package.

#### Advanced Setup

For advanced users.

## API Reference

The API documentation.

### Methods

Available methods.

## Conclusion

That's all.`;

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;

        const parsed = yield* mdx.parseMdxFile(contentWithHeadings);
        const html = yield* mdx.compileMdxToHtml(parsed.body);

        return {
          parsed,
          html,
        };
      });

      // Create layer with features enabled
      const featureConfigLayer = Layer.succeed(MdxConfigService, {
        getConfig: () => ({
          remarkPlugins: [],
          rehypePlugins: [],
          sanitize: true, // Enable sanitization
          slug: true, // Enable slug generation
          autolinkHeadings: true, // Enable autolink headings
        }),
      });

      const featureLayer = MdxServiceLayer.pipe(
        Layer.provide(mockFsLayer),
        Layer.provide(featureConfigLayer)
      );

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(featureLayer))
      );

      // Verify parsing
      expect(result.parsed.attributes.title).toBe("Document with Headings");

      // Verify HTML with features
      expect(result.html).toContain("<h1>Introduction</h1>");
      expect(result.html).toContain("<h2>Getting Started</h2>");
      expect(result.html).toContain("<h3>Installation</h3>");
      expect(result.html).toContain("<h4>Advanced Setup</h4>");

      // Sanitization should remove any potentially dangerous content
      // For this clean content, it should still work
      expect(result.html).toContain("<p>This is the introduction section.</p>");
    });

    it("should handle file-based operations in complete workflows", async () => {
      const fileContent = `---yaml
title: "File-Based Content"
author: "Test Author"
published: true
---

# File Content

This content was read from a file.

## Features

- Parsed from file
- Frontmatter extracted
- HTML compiled`;

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;

        // Read from file
        const fileData = yield* mdx.readMdxAndFrontmatter("test-content.mdx");

        // Compile the body to HTML
        const html = yield* mdx.compileMdxToHtml(fileData.mdxBody);

        // Prepare for LLM UI
        const llmUi = yield* mdx.compileForLlmUi(fileData.content);

        return {
          fileData,
          html,
          llmUi,
        };
      });

      // Create layer with mocked file content
      const fileFsLayer = Layer.succeed(
        FileSystem.FileSystem,
        FileSystem.make({
          readFile: () =>
            Effect.succeed(new Uint8Array(Buffer.from(fileContent))),
          readFileString: () => Effect.succeed(fileContent),
        })
      );

      const fileConfigLayer = Layer.succeed(MdxConfigService, {
        getConfig: () => ({
          remarkPlugins: [],
          rehypePlugins: [],
          sanitize: false,
          slug: false,
          autolinkHeadings: false,
        }),
      });

      const fileLayer = MdxServiceLayer.pipe(
        Layer.provide(fileFsLayer),
        Layer.provide(fileConfigLayer)
      );

      const result = await Effect.runPromise(
        program.pipe(Effect.provide(fileLayer))
      );

      // Verify file reading
      expect(result.fileData.content).toBe(fileContent);
      expect(result.fileData.frontmatter.title).toBe("File-Based Content");
      expect(result.fileData.frontmatter.author).toBe("Test Author");
      expect(result.fileData.frontmatter.published).toBe(true);
      expect(result.fileData.mdxBody).toContain("# File Content");

      // Verify HTML compilation
      expect(result.html).toContain("<h1>File Content</h1>");
      expect(result.html).toContain("<h2>Features</h2>");
      expect(result.html).toContain("<ul>");
      expect(result.html).toContain("<li>Parsed from file</li>");

      // Verify LLM UI preparation
      expect(result.llmUi.frontmatter.title).toBe("File-Based Content");
      expect(result.llmUi.rawMarkdown).toContain("# File Content");
      expect(result.llmUi.metadata.llmUiMode).toBe(true);
    });

    it("should handle error scenarios in e2e pipelines", async () => {
      const invalidMdx = `---yaml
title: "Invalid Content"
---

# Valid Heading

<InvalidComponent unclosed="tag"

This has syntax errors.`;

      const program = Effect.gen(function* () {
        const mdx = yield* MdxService;

        // Try to parse invalid content
        const parsed = yield* mdx.parseMdxFile(invalidMdx);

        // Try to compile to HTML (this might succeed or fail)
        const html = yield* mdx.compileMdxToHtml(parsed.body);

        return {
          parsed,
          html,
        };
      });

      // Test successful parsing but potentially failed compilation
      try {
        const result = await Effect.runPromise(
          program.pipe(Effect.provide(testLayer))
        );

        // If we get here, parsing succeeded
        expect(result.parsed.attributes.title).toBe("Invalid Content");

        // HTML compilation might still work for the valid parts
        expect(result.html).toContain("<h1>Valid Heading</h1>");
      } catch (error) {
        // If compilation fails, verify it's an InvalidMdxFormatError
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toContain("MDX");
      }
    });
  });
});
