/**
 * effect-html - Type-safe HTML parsing and content extraction for Effect
 *
 * @packageDocumentation
 */

// Errors
export { HtmlError } from "./errors.js";

// Types and Schemas
export { HtmlMetadataSchema } from "./schemas.js";
export type { HtmlMetadata } from "./schemas.js";
// Services (Dependency Injection)
export { HtmlService, type HtmlServiceSchema } from "./service.js";
