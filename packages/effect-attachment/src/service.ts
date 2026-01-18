/**
 * Attachment Service
 *
 * High-level service for chat attachment management using effect-repository
 *
 * @module service
 */

import { Effect } from "effect";
import type { RepositoryBackend, BlobMetadata } from "effect-repository";
import {
  AttachmentNotFoundError,
  InvalidAttachmentError,
  AttachmentSizeLimitError,
  UnsupportedAttachmentTypeError,
} from "./errors.js";
import type {
  Attachment,
  AttachmentWithData,
  AttachmentServiceConfig,
  UploadOptions,
  AttachmentListOptions,
  AttachmentListResult,
} from "./types.js";

/**
 * Convert BlobMetadata to Attachment
 */
const blobMetadataToAttachment = (metadata: BlobMetadata): Attachment => {
  const customMeta = metadata.customMetadata ?? {};
  return {
    id: metadata.id,
    filename: customMeta.filename ?? metadata.id,
    mimeType: metadata.mimeType,
    sizeBytes: metadata.sizeBytes,
    uploadedAt: metadata.createdAt,
    ...(customMeta.chatId !== undefined && { chatId: customMeta.chatId }),
    ...(customMeta.userId !== undefined && { userId: customMeta.userId }),
  };
};

/**
 * AttachmentService Schema - Interface for the service
 */
export interface AttachmentServiceSchema {
  readonly upload: (
    filename: string,
    data: Buffer,
    mimeType: string,
    options?: UploadOptions
  ) => Effect.Effect<
    Attachment,
    | InvalidAttachmentError
    | AttachmentSizeLimitError
    | UnsupportedAttachmentTypeError
    | Error
  >;

  readonly download: (
    id: string
  ) => Effect.Effect<AttachmentWithData, AttachmentNotFoundError | Error>;

  readonly get: (
    id: string
  ) => Effect.Effect<Attachment, AttachmentNotFoundError | Error>;

  readonly delete: (
    id: string
  ) => Effect.Effect<void, AttachmentNotFoundError | Error>;

  readonly list: (
    options?: AttachmentListOptions
  ) => Effect.Effect<AttachmentListResult, Error>;
}

/**
 * AttachmentService
 *
 * Factory function that creates an attachment service using a repository backend.
 * This allows flexibility in backend selection (in-memory, filesystem, PostgreSQL).
 */
export const createAttachmentService = (
  backend: RepositoryBackend,
  config?: AttachmentServiceConfig
): AttachmentServiceSchema => {
  const maxSizeBytes = config?.maxSizeBytes ?? 10 * 1024 * 1024; // 10MB default
  const allowedMimeTypes = config?.allowedMimeTypes ?? [];

  const upload = (
    filename: string,
    data: Buffer,
    mimeType: string,
    options?: UploadOptions
  ) => {
    // Build custom metadata outside generator
    const customMetadata: Record<string, string> = {
      filename,
    };
    if (options?.chatId) customMetadata.chatId = options.chatId;
    if (options?.userId) customMetadata.userId = options.userId;

    // Extract save operation outside generator (before any type-problematic operations)
    // biome-ignore lint/suspicious/noExplicitAny: TypeScript Effect.gen type inference limitation
    const saveOptions: Record<string, unknown> = { customMetadata };
    if (options?.id !== undefined) {
      saveOptions.id = options.id;
    }
    const saveBlob: any = backend.save(data, mimeType, saveOptions);

    return Effect.gen(function* () {
      // Validate filename
      if (!filename || filename.trim() === "") {
        return yield* Effect.fail(
          new InvalidAttachmentError({
            message: "Filename cannot be empty",
            reason: "empty_filename",
            filename,
          })
        );
      }

      // Validate size
      if (data.length > maxSizeBytes) {
        return yield* Effect.fail(
          new AttachmentSizeLimitError({
            message: `Attachment exceeds size limit: ${data.length} > ${maxSizeBytes}`,
            filename,
            sizeBytes: data.length,
            limitBytes: maxSizeBytes,
          })
        );
      }

      // Validate MIME type
      if (allowedMimeTypes.length > 0 && !allowedMimeTypes.includes(mimeType)) {
        return yield* Effect.fail(
          new UnsupportedAttachmentTypeError({
            message: `MIME type not allowed: ${mimeType}`,
            mimeType,
            allowedTypes: allowedMimeTypes,
          })
        );
      }

      const blobMetadata = yield* saveBlob;
      return blobMetadataToAttachment(blobMetadata);
    }) as any;
  };

  const download = (id: string) => {
    // biome-ignore lint/suspicious/noExplicitAny: TypeScript Effect.gen type inference limitation
    const getBlob: any = backend.get(id);

    return Effect.gen(function* () {
      const blob = yield* getBlob;
      return {
        ...blobMetadataToAttachment(blob.metadata),
        data: blob.data,
      } satisfies AttachmentWithData;
    }) as any;
  };

  const get = (id: string) => {
    // biome-ignore lint/suspicious/noExplicitAny: TypeScript Effect.gen type inference limitation
    const getMetadata: any = backend.getMetadata(id);

    return Effect.gen(function* () {
      const metadata = yield* getMetadata;
      return blobMetadataToAttachment(metadata);
    }) as any;
  };

  const deleteAttachment = (id: string) => {
    // biome-ignore lint/suspicious/noExplicitAny: TypeScript Effect.gen type inference limitation
    const deleteBlob: any = backend.delete(id);

    return Effect.gen(function* () {
      yield* deleteBlob;
    }) as any;
  };

  const list = (options?: AttachmentListOptions) => {
    // Convert to repository options
    const repoOptions: Record<string, unknown> = {};
    if (options?.limit !== undefined) {
      repoOptions.limit = options.limit;
    }
    if (options?.cursor !== undefined) {
      repoOptions.cursor = options.cursor;
    }
    if (options?.mimeTypePrefix !== undefined) {
      repoOptions.mimeTypePrefix = options.mimeTypePrefix;
    }

    // biome-ignore lint/suspicious/noExplicitAny: TypeScript Effect.gen type inference limitation
    const listBlobs: any = backend.list(repoOptions);

    return Effect.gen(function* () {
      const result = yield* listBlobs;

      // Convert blob metadata to attachments
      let items = result.items.map(blobMetadataToAttachment);

      // Client-side filtering for chatId/userId
      if (options?.chatId) {
        items = items.filter((a: Attachment) => a.chatId === options.chatId);
      }
      if (options?.userId) {
        items = items.filter((a: Attachment) => a.userId === options.userId);
      }

      return {
        items,
        nextCursor: result.nextCursor,
        totalCount: result.totalCount,
      } satisfies AttachmentListResult;
    }) as any;
  };

  return {
    upload,
    download,
    get,
    delete: deleteAttachment,
    list,
  } satisfies AttachmentServiceSchema;
};
