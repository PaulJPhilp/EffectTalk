# effect-pdf

Type-safe, Effect-native library for PDF processing with text extraction, creation, and manipulation.

[![npm version](https://img.shields.io/npm/v/effect-pdf)](https://www.npmjs.com/package/effect-pdf)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎯 **Effect-Native** - Fully integrated with the Effect ecosystem
- 📄 **Text Extraction** - Modern, ESM-ready PDF text extraction via [unpdf](https://github.com/unjs/unpdf)
- ✏️ **PDF Manipulation** - Create, load, and modify PDFs via [pdf-lib](https://pdf-lib.js.org/)
- 🛡️ **Type-Safe** - Validated results via `effect-json` schemas
- 🔄 **Composable** - Chain operations with Effect's `yield*` syntax
- 📦 **ESM-Native** - Modern JavaScript modules

## Installation

```bash
npm install effect-pdf
# or
bun add effect-pdf
```

## Quick Start

```typescript
import { Effect } from "effect";
import { PdfService } from "effect-pdf";

const program = Effect.gen(function* () {
  const pdf = yield* PdfService;
  
  // Extract text from PDF
  const { text } = yield* pdf.extractText(pdfBuffer);
  console.log(text);
  
  // Create new PDF
  const doc = yield* pdf.createPdf();
  const page = yield* pdf.addPage(doc);
  yield* pdf.drawText(page, "Hello from Effect!", {
    x: 50,
    y: 750,
  });
  
  // Save PDF
  const bytes = yield* pdf.savePdf(doc);
});

await Effect.runPromise(program);
```

## Core Operations

### Text Extraction

```typescript
const program = Effect.gen(function* () {
  const pdf = yield* PdfService;
  
  const result = yield* pdf.extractText(pdfBuffer);
  console.log(result.text); // Extracted text
  console.log(result.metadata); // Document metadata
});
```

### PDF Creation

```typescript
const program = Effect.gen(function* () {
  const pdf = yield* PdfService;
  
  // Create new PDF
  const doc = yield* pdf.createPdf();
  
  // Add page with content
  const page = yield* pdf.addPage(doc);
  yield* pdf.drawText(page, "Title", { x: 50, y: 750 });
  
  // Save to bytes
  const bytes = yield* pdf.savePdf(doc);
});
```

### PDF Manipulation

```typescript
const program = Effect.gen(function* () {
  const pdf = yield* PdfService;
  
  // Load existing PDF
  const doc = yield* pdf.loadPdf(pdfBuffer);
  
  // Add page
  const page = yield* pdf.addPage(doc);
  
  // Draw content
  yield* pdf.drawText(page, "Modified", { x: 100, y: 100 });
  yield* pdf.drawImage(page, imageBuffer, { x: 50, y: 50 });
  
  // Save modified PDF
  const modified = yield* pdf.savePdf(doc);
});
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

- **[effect-json](../effect-json)** - Schema validation for extracted metadata
- **[effect-image](../effect-image)** - Image processing before embedding in PDFs
- **[effect-storage](../effect-storage)** - Persistent PDF storage

## Error Handling

All operations return discriminated errors:

```typescript
const result = yield* pdf.extractText(buffer).pipe(
  Effect.catchTag("PdfError", (err) => {
    console.error("PDF processing failed:", err.message);
    // Handle gracefully
  }),
);
```

## License

MIT © 2025 Paul Philp

## Resources

- **[pdf-lib](https://pdf-lib.js.org/)** - PDF manipulation library
- **[unpdf](https://github.com/unjs/unpdf)** - PDF extraction library
- **[Effect Documentation](https://effect.website)** - Effect-TS runtime
