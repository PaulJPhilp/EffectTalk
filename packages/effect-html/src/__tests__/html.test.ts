import { Effect, Layer } from "effect";
import { JsonService } from "effect-json";
import { describe, expect, it } from "vitest";
import { HtmlService, HtmlServiceLayer } from "../service.js";

describe("HtmlService", () => {
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Test Page</title>
        <meta name="description" content="This is a test description">
        <meta name="keywords" content="test, effect, html">
        <meta property="og:title" content="Open Graph Title">
        <meta property="og:type" content="website">
        <link rel="icon" href="/favicon.ico">
        <script type="application/ld+json">
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "Hume"
          }
        </script>
    </head>
    <body>
        <h1>Hello World</h1>
        <div class="content">Some content here</div>
    </body>
    </html>
  `;

  const TestLayer = HtmlServiceLayer.pipe(Layer.provide(JsonService.Default));

  it("should parse HTML and allow querying", async () => {
    const program = Effect.gen(function* () {
      const htmlService = yield* HtmlService;
      const $ = yield* htmlService.parse(htmlContent);
      return $("h1").text();
    }).pipe(Effect.provide(TestLayer));

    const result = await Effect.runPromise(program);
    expect(result).toBe("Hello World");
  });

  it("should extract metadata correctly", async () => {
    const program = Effect.gen(function* () {
      const htmlService = yield* HtmlService;
      return yield* htmlService.extractMetadata(htmlContent);
    }).pipe(Effect.provide(TestLayer));

    const result = await Effect.runPromise(program);
    expect(result.title).toBe("Test Page");
    expect(result.description).toBe("This is a test description");
    expect(result.keywords).toEqual(["test", "effect", "html"]);
    expect(result.openGraph).toEqual({
      title: "Open Graph Title",
      type: "website",
    });
    expect(result.favicon).toBe("/favicon.ico");
  });

  it("should extract JSON-LD correctly", async () => {
    const program = Effect.gen(function* () {
      const htmlService = yield* HtmlService;
      return yield* htmlService.extractJsonLd(htmlContent);
    }).pipe(Effect.provide(TestLayer));

    const result = await Effect.runPromise(program);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Hume",
    });
  });
});
