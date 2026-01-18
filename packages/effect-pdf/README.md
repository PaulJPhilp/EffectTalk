# effect-pdf

An Effect-native library for PDF processing, powered by [unpdf](https://github.com/unjs/unpdf) for extraction and [pdf-lib](https://pdf-lib.js.org/) for creation and manipulation.

## Features

- **Effect-native**: Fully integrated with the Effect ecosystem.
- **Text Extraction**: Modern, ESM-ready PDF text extraction.
- **Type-safe**: Metadata and extraction results validated via `effect-json` schemas.
- **Manipulation**: Create, load, and modify PDF documents.

## Installation

```bash
bun add effect-pdf
```

## Usage

```typescript
import { Effect } from "effect";
import { PdfService, PdfServiceLayer } from "effect-pdf";

const program = Effect.gen(function* () {
  const pdfService = yield* PdfService;
  
  // Extract text
  const { text } = yield* pdfService.extractText(pdfBuffer);
  
  // Create PDF
  const doc = yield* pdfService.createPdf();
  const page = doc.addPage();
  page.drawText("Hello from Effect!");
  const bytes = yield* pdfService.savePdf(doc);
});

Effect.runPromise(program.pipe(Effect.provide(PdfServiceLayer)));
```
