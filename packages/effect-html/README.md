# effect-html

Type-safe, Effect-native library for HTML parsing and scraping with metadata extraction.

[![npm version](https://img.shields.io/npm/v/effect-html)](https://www.npmjs.com/package/effect-html)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎯 **Effect-Native** - Fully integrated with the Effect ecosystem
- 🔍 **HTML Parsing** - Modern HTML parsing via [cheerio](https://cheerio.js.org/)
- 🏷️ **Metadata Extraction** - Extract titles, descriptions, Open Graph data, and more
- 📋 **JSON-LD Support** - Parse and extract structured linked data
- 🛡️ **Type-Safe** - Robust error handling with discriminated errors
- 🔄 **Composable** - Chain operations seamlessly with Effect

## Installation

```bash
npm install effect-html
# or
bun add effect-html
```

## Quick Start

```typescript
import { Effect } from "effect";
import { HtmlService } from "effect-html";

const program = Effect.gen(function* () {
  const html = yield* HtmlService;
  
  // Parse HTML
  const $ = yield* html.parse("<h1>Hello World</h1>");
  console.log($("h1").text()); // "Hello World"
  
  // Extract metadata
  const metadata = yield* html.extractMetadata(`
    <html>
      <head>
        <title>My Page</title>
        <meta name="description" content="Page description">
        <meta property="og:image" content="image.jpg">
      </head>
    </html>
  `);
  
  console.log(metadata.title); // "My Page"
  console.log(metadata.description); // "Page description"
  console.log(metadata.ogImage); // "image.jpg"
  
  // Extract structured data
  const jsonLd = yield* html.extractJsonLd(`
    <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": "My Article"
      }
    </script>
  `);
  
  console.log(jsonLd.headline); // "My Article"
});

await Effect.runPromise(program);
```

## Core Operations

### HTML Parsing

```typescript
const program = Effect.gen(function* () {
  const html = yield* HtmlService;
  
  const $ = yield* html.parse(htmlString);
  
  // Query elements
  const headings = $("h1, h2, h3").map((i, el) => $(el).text());
  
  // Extract attributes
  const links = $("a").map((i, el) => $(el).attr("href"));
});
```

### Metadata Extraction

```typescript
const result = yield* html.extractMetadata(htmlString);

// Result includes:
// - title: page title
// - description: meta description
// - keywords: meta keywords
// - author: author meta tag
// - ogTitle, ogDescription, ogImage: Open Graph tags
// - twitterCard, twitterCreator: Twitter Card tags
// - canonical: canonical URL
```

### JSON-LD Extraction

```typescript
const jsonLd = yield* html.extractJsonLd(htmlString);

// Extracts and validates structured data
// Returns parsed JSON-LD objects
// Supports multiple JSON-LD blocks
```

### Cheerio API

Once parsed, use Cheerio's full API:

```typescript
const $ = yield* html.parse(htmlString);

// DOM traversal
$("div.container").find("p").each((i, el) => {
  console.log($(el).text());
});

// Attribute access
$("a").attr("href");
$("img").attr("src");

// Content manipulation
$("h1").html(); // inner HTML
$("h1").text(); // text content
```

## Error Handling

All operations return discriminated errors:

```typescript
const result = yield* html.parse(htmlString).pipe(
  Effect.catchTag("HtmlParsingError", (err) => {
    console.error("Failed to parse HTML:", err.message);
  }),
);
```

## Development

```bash
# Build
bun run build

# Test
bun run test
bun run test:watch
bun run test:coverage

# Lint & format
bun run lint
bun run format
```

## Integration

Works well with other Effect packages:

- **[effect-json](../effect-json)** - Schema validation for extracted data
- **[effect-storage](../effect-storage)** - Store parsed HTML or metadata
- **[effect-prompt](../effect-prompt)** - Generate prompts from HTML content

## License

MIT © 2025 Paul Philp

## Resources

- **[Cheerio](https://cheerio.js.org/)** - jQuery-like HTML parsing
- **[JSON-LD](https://json-ld.org/)** - Structured data format
- **[Open Graph](https://ogp.me/)** - Metadata protocol
- **[Effect Documentation](https://effect.website)** - Effect-TS runtime
