import { Effect, Schema } from "effect";
import { PDFDocument } from "pdf-lib";
import { extractText as unpdfExtractText } from "unpdf";
import { PdfError } from "./errors.js";
import { PdfMetadataSchema, type PdfMetadata } from "./schemas.js";

export interface PdfServiceSchema {
  /**
   * Extract text and metadata from a PDF buffer
   */
  readonly extractText: (
    buffer: Buffer | Uint8Array
  ) => Effect.Effect<PdfMetadata, PdfError>;

  /**
   * Create a new blank PDF
   */
  readonly createPdf: () => Effect.Effect<PDFDocument, PdfError>;

  /**
   * Load a PDF from a buffer for manipulation
   */
  readonly loadPdf: (
    buffer: Buffer | Uint8Array
  ) => Effect.Effect<PDFDocument, PdfError>;

  /**
   * Save a PDF document to a Uint8Array
   */
  readonly savePdf: (
    pdfDoc: PDFDocument
  ) => Effect.Effect<Uint8Array, PdfError>;
}

export class PdfService extends Effect.Service<PdfServiceSchema>()(
  "PdfService",
  {
    effect: Effect.gen(function* () {
      const extractText = (buffer: Buffer | Uint8Array) =>
        Effect.gen(function* () {
          const result = yield* Effect.tryPromise({
            try: async () => {
              const { text, totalPages } = await unpdfExtractText(buffer);
              return {
                // unpdf might return string[] depending on the document/version
                text: Array.isArray(text) ? text.join("\n") : text,
                numpages: totalPages,
              };
            },
            catch: (error) =>
              new PdfError({
                reason: `Failed to extract text from PDF: ${error instanceof Error ? error.message : String(error)}`,
                cause: error,
              }),
          });

          return yield* Schema.decodeUnknown(PdfMetadataSchema)(result).pipe(
            Effect.mapError(
              (error) =>
                new PdfError({
                  reason: `PDF metadata validation failed: ${error}`,
                  cause: error,
                })
            )
          );
        });

      const createPdf = () =>
        Effect.tryPromise({
          try: () => PDFDocument.create(),
          catch: (error) =>
            new PdfError({
              reason: `Failed to create PDF: ${error instanceof Error ? error.message : String(error)}`,
              cause: error,
            }),
        });

      const loadPdf = (buffer: Buffer | Uint8Array) =>
        Effect.tryPromise({
          try: () => PDFDocument.load(buffer),
          catch: (error) =>
            new PdfError({
              reason: `Failed to load PDF: ${error instanceof Error ? error.message : String(error)}`,
              cause: error,
            }),
        });

      const savePdf = (pdfDoc: PDFDocument) =>
        Effect.tryPromise({
          try: () => pdfDoc.save({ useObjectStreams: false }),
          catch: (error) =>
            new PdfError({
              reason: `Failed to save PDF: ${error instanceof Error ? error.message : String(error)}`,
              cause: error,
            }),
        });

      return {
        extractText,
        createPdf,
        loadPdf,
        savePdf,
      };
    }),
  }
) {}

export const PdfServiceLayer = PdfService.Default;
