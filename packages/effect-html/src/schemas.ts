import { Schema } from "effect";

export const HtmlMetadataSchema = Schema.Struct({
  title: Schema.optional(Schema.String),
  description: Schema.optional(Schema.String),
  keywords: Schema.Array(Schema.String),
  favicon: Schema.optional(Schema.String),
  openGraph: Schema.Record({ key: Schema.String, value: Schema.String }),
});

export type HtmlMetadata = Schema.Schema.Type<typeof HtmlMetadataSchema>;
