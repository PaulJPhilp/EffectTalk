/**
 * @hume/effect-artifact - Type-safe AI artifact management
 */

// Services
export { ArtifactService } from "./services/index.js";
export type { ArtifactServiceApi } from "./services/index.js";

export { TypeDetectionService } from "./services/index.js";
export type { TypeDetectionServiceSchema } from "./services/index.js";

// Extraction
export {
	extractArtifactsFromResponse,
	extractArtifactsFromString,
} from "./extractors/ai-artifact-extractor.js";

// Types & Schemas
export * from "./types.js";
export * from "./schemas.js";
export * from "./errors.js";
