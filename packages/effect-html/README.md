# effect-html

An Effect-native library for HTML parsing and scraping, powered by [cheerio](https://cheerio.js.org/).

## Features

- **Effect-native**: Fully integrated with the Effect ecosystem.
- **Type-safe**: Robust error handling using `HtmlError`.
- **Metadata Extraction**: Helpers for extracting titles, descriptions, Open Graph data, and more.
- **JSON-LD Support**: Extract and parse linked data using `effect-json`.

## Installation

```bash
bun add effect-html
```

## Usage

```typescript
import { Effect } from "effect";
import { HtmlService, HtmlServiceLayer } from "effect-html";

const program = Effect.gen(function* () {
  const htmlService = yield* HtmlService;
  
  // Parse and query
  const $ = yield* htmlService.parse("<h1>Hello World</h1>");
  console.log($("h1").text());
  
  // Extract metadata
  const metadata = yield* htmlService.extractMetadata(someHtmlString);
  console.log(metadata.title);

  // Extract JSON-LD
  const jsonLd = yield* htmlService.extractJsonLd(someHtmlString);
  console.log(jsonLd);
});

Effect.runPromise(program.pipe(Effect.provide(HtmlServiceLayer)));
```
