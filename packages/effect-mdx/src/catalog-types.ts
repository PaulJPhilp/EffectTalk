import { Schema } from "effect";

export const PatternSchema = Schema.Struct({
  id: Schema.String,
  title: Schema.String,
  description: Schema.String,
  moduleId: Schema.String,
  stage: Schema.Number,
  contentPath: Schema.String,
});

export type Pattern = Schema.Schema.Type<typeof PatternSchema>;

export const EnrichedPatternSchema = Schema.Struct({
  ...PatternSchema.fields,
  content: Schema.String,
});

export type EnrichedPattern = Schema.Schema.Type<typeof EnrichedPatternSchema>;

export const StageViewSchema = Schema.Struct({
  stage: Schema.Number,
  title: Schema.String,
  patterns: Schema.Array(PatternSchema),
});

export type StageView = Schema.Schema.Type<typeof StageViewSchema>;

export const ModuleViewSchema = Schema.Struct({
  moduleId: Schema.String,
  stages: Schema.Array(StageViewSchema),
});

export type ModuleView = Schema.Schema.Type<typeof ModuleViewSchema>;
