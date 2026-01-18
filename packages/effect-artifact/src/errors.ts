/**
 * Error definitions for effect-artifact
 * All errors use Data.TaggedError for type-safe pattern matching
 */

import { Data } from "effect";

/**
 * Error thrown when an artifact or artifact version is not found
 */
export class ArtifactNotFoundError extends Data.TaggedError(
  "ArtifactNotFoundError"
)<{
  readonly artifactId: string;
  readonly version?: string | undefined;
  readonly cause?: Error | undefined;
}> {}

/**
 * Error thrown when artifact data fails schema validation
 */
export class ArtifactValidationError extends Data.TaggedError(
  "ArtifactValidationError"
)<{
  readonly message: string;
  readonly field: string;
  readonly value: unknown;
  readonly cause?: Error | undefined;
}> {}

/**
 * Error thrown when a storage operation fails
 */
export class ArtifactStorageError extends Data.TaggedError(
  "ArtifactStorageError"
)<{
  readonly message: string;
  readonly operation: string;
  readonly artifactId?: string | undefined;
  readonly cause?: Error | undefined;
}> {}

/**
 * Error thrown when artifact type detection fails
 */
export class InvalidArtifactTypeError extends Data.TaggedError(
  "InvalidArtifactTypeError"
)<{
  readonly message: string;
  readonly content: string;
  readonly hints?: {
    readonly filename?: string | undefined;
    readonly mimeType?: string | undefined;
  } | undefined;
  readonly cause?: Error | undefined;
}> {}

/**
 * Error thrown when there's a version conflict or mismatch
 */
export class VersionConflictError extends Data.TaggedError(
  "VersionConflictError"
)<{
  readonly artifactId: string;
  readonly requestedVersion: string;
  readonly latestVersion: string;
  readonly cause?: Error | undefined;
}> {}
