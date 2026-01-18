import { Effect } from "effect";
import {
  ArtifactNotFoundError,
  ArtifactStorageError,
  ArtifactValidationError,
} from "../../errors.js";
import type {
  Artifact,
  ArtifactMetadata,
  ArtifactQueryOptions,
  ArtifactType,
  ArtifactVersionDiff,
} from "../../types.js";

/**
 * Interface defining the methods for Artifact management.
 */
export interface ArtifactServiceApi {
  readonly create: (
    content: string,
    metadata: Partial<ArtifactMetadata>,
    explicitType?: ArtifactType | undefined
  ) => Effect.Effect<
    Artifact,
    ArtifactValidationError | ArtifactStorageError,
    never
  >;

  readonly get: (
    id: string,
    version?: string | undefined
  ) => Effect.Effect<
    Artifact,
    ArtifactNotFoundError | ArtifactStorageError,
    never
  >;

  readonly update: (
    id: string,
    content: string,
    metadata?: Partial<ArtifactMetadata> | undefined
  ) => Effect.Effect<
    Artifact,
    ArtifactNotFoundError | ArtifactValidationError | ArtifactStorageError,
    never
  >;

  readonly delete: (
    id: string
  ) => Effect.Effect<void, ArtifactNotFoundError | ArtifactStorageError, never>;

  readonly list: (
    options?: ArtifactQueryOptions | undefined
  ) => Effect.Effect<readonly Artifact[], ArtifactStorageError, never>;

  readonly getVersionHistory: (
    id: string
  ) => Effect.Effect<
    readonly Artifact[],
    ArtifactNotFoundError | ArtifactStorageError,
    never
  >;

  readonly diff: (
    id: string,
    version1: string,
    version2: string
  ) => Effect.Effect<
    ArtifactVersionDiff,
    ArtifactNotFoundError | ArtifactStorageError,
    never
  >;

  readonly updateRenderingHints: (
    id: string,
    hints: Record<string, unknown>
  ) => Effect.Effect<
    Artifact,
    ArtifactNotFoundError | ArtifactStorageError,
    never
  >;
}
