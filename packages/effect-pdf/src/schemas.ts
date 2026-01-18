import { Schema } from "effect";

export const PdfMetadataSchema = Schema.Struct({
  text: Schema.String,
  numpages: Schema.Number,
});

export type PdfMetadata = Schema.Schema.Type<typeof PdfMetadataSchema>;
