import { describe, it, expect } from "vitest";
import { Effect } from "effect";
import { PdfService, PdfServiceLayer } from "../service.js";

describe("PdfService", () => {
  it("should create, save, and then extract text from a PDF", async () => {
    const program = Effect.gen(function* () {
      const pdfService = yield* PdfService;

      // 1. Create a PDF with some text
      const doc = yield* pdfService.createPdf();
      const page = doc.addPage();
      const { height } = page.getSize();
      page.drawText("Hello World from Effect PDF!", {
        x: 50,
        y: height - 4 * 50,
        size: 30,
      });

      // 2. Save it to a buffer
      const pdfBytes = yield* pdfService.savePdf(doc);

      // 3. Extract text (using unpdf via the service)
      const extractionResult = yield* pdfService.extractText(pdfBytes);

      return extractionResult;
    }).pipe(Effect.provide(PdfServiceLayer));

    const result = await Effect.runPromise(program);
    expect(result.text).toContain("Hello World from Effect PDF!");
    expect(result.numpages).toBe(1);
  });
});
