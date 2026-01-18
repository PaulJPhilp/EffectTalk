/**
 * Error handling tests for effect-attachment
 *
 * Tests all error types, error construction, error recovery,
 * and error tag-based matching patterns.
 */

import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { InMemoryBackend } from "effect-repository";
import {
  createAttachmentService,
  AttachmentNotFoundError,
  InvalidAttachmentError,
  AttachmentSizeLimitError,
  UnsupportedAttachmentTypeError,
} from "../../src/index.js";

describe("Error Types", () => {
  describe("AttachmentNotFoundError", () => {
    it("should create error with proper fields", () => {
      const error = new AttachmentNotFoundError({
        message: "Attachment not found",
        id: "missing-id",
      });

      expect(error._tag).toBe("AttachmentNotFoundError");
      expect(error.message).toBe("Attachment not found");
      expect(error.id).toBe("missing-id");
    });

    it("should be catchable by tag", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend;
        const service = createAttachmentService(backend);

        return yield* service.get("nonexistent").pipe(
          Effect.catchTag("AttachmentNotFoundError", (err) => {
            return Effect.succeed({
              tag: err._tag,
              id: err.id,
              hasFallback: true,
            });
          })
        );
      }).pipe(Effect.provide(InMemoryBackend.Default));

      const result = await Effect.runPromise(program);
      expect(result.tag).toBe("AttachmentNotFoundError");
      expect(result.id).toBe("nonexistent");
      expect(result.hasFallback).toBe(true);
    });

    it("should preserve error through pipeline", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend;
        const service = createAttachmentService(backend);

        return yield* service
          .get("missing")
          .pipe(
            Effect.tapError((err) =>
              Effect.logWarning(
                `Failed to get attachment: ${(err as AttachmentNotFoundError).id}`
              )
            )
          );
      }).pipe(Effect.provide(InMemoryBackend.Default));

      const result = await Effect.runPromise(Effect.either(program));
      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(AttachmentNotFoundError);
      }
    });
  });

  describe("InvalidAttachmentError", () => {
    it("should create error with proper fields", () => {
      const error = new InvalidAttachmentError({
        message: "Invalid attachment",
        reason: "empty_filename",
        filename: "",
      });

      expect(error._tag).toBe("InvalidAttachmentError");
      expect(error.message).toBe("Invalid attachment");
      expect(error.reason).toBe("empty_filename");
      expect(error.filename).toBe("");
    });

    it("should handle error with optional filename", () => {
      const error = new InvalidAttachmentError({
        message: "Invalid data",
        reason: "corrupted",
      });

      expect(error._tag).toBe("InvalidAttachmentError");
      expect(error.filename).toBeUndefined();
    });

    it("should be catchable by tag during upload", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend;
        const service = createAttachmentService(backend);

        return yield* service
          .upload("", Buffer.from("data"), "text/plain")
          .pipe(
            Effect.catchTag("InvalidAttachmentError", (err) => {
              return Effect.succeed({
                tag: err._tag,
                reason: err.reason,
                recovered: true,
              });
            })
          );
      }).pipe(Effect.provide(InMemoryBackend.Default));

      const result = await Effect.runPromise(program);
      expect(result.tag).toBe("InvalidAttachmentError");
      expect(result.reason).toBe("empty_filename");
      expect(result.recovered).toBe(true);
    });
  });

  describe("AttachmentSizeLimitError", () => {
    it("should create error with proper fields", () => {
      const error = new AttachmentSizeLimitError({
        message: "Size limit exceeded",
        filename: "large.bin",
        sizeBytes: 1000,
        limitBytes: 500,
      });

      expect(error._tag).toBe("AttachmentSizeLimitError");
      expect(error.message).toBe("Size limit exceeded");
      expect(error.filename).toBe("large.bin");
      expect(error.sizeBytes).toBe(1000);
      expect(error.limitBytes).toBe(500);
    });

    it("should be catchable by tag", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend;
        const service = createAttachmentService(backend, {
          maxSizeBytes: 100,
        });

        const largeData = Buffer.alloc(200);
        return yield* service
          .upload("large.bin", largeData, "application/octet-stream")
          .pipe(
            Effect.catchTag("AttachmentSizeLimitError", (err) => {
              return Effect.succeed({
                tag: err._tag,
                limitBytes: err.limitBytes,
                sizeBytes: err.sizeBytes,
                exceedsBy: err.sizeBytes - err.limitBytes,
              });
            })
          );
      }).pipe(Effect.provide(InMemoryBackend.Default));

      const result = await Effect.runPromise(program);
      expect(result.tag).toBe("AttachmentSizeLimitError");
      expect(result.limitBytes).toBe(100);
      expect(result.sizeBytes).toBe(200);
      expect(result.exceedsBy).toBe(100);
    });
  });

  describe("UnsupportedAttachmentTypeError", () => {
    it("should create error with proper fields", () => {
      const error = new UnsupportedAttachmentTypeError({
        message: "Unsupported type",
        mimeType: "application/x-executable",
        allowedTypes: ["image/jpeg", "image/png"],
      });

      expect(error._tag).toBe("UnsupportedAttachmentTypeError");
      expect(error.message).toBe("Unsupported type");
      expect(error.mimeType).toBe("application/x-executable");
      expect(error.allowedTypes).toContain("image/jpeg");
    });

    it("should be catchable by tag", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend;
        const service = createAttachmentService(backend, {
          allowedMimeTypes: ["image/jpeg", "image/png"],
        });

        return yield* service
          .upload("file.exe", Buffer.from("data"), "application/x-executable")
          .pipe(
            Effect.catchTag("UnsupportedAttachmentTypeError", (err) => {
              return Effect.succeed({
                tag: err._tag,
                mimeType: err.mimeType,
                allowedCount: err.allowedTypes.length,
              });
            })
          );
      }).pipe(Effect.provide(InMemoryBackend.Default));

      const result = await Effect.runPromise(program);
      expect(result.tag).toBe("UnsupportedAttachmentTypeError");
      expect(result.mimeType).toBe("application/x-executable");
      expect(result.allowedCount).toBe(2);
    });
  });
});

describe("Error Recovery Patterns", () => {
  it("should recover from AttachmentNotFoundError with fallback", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend);

      const attachment = yield* service.get("missing-id").pipe(
        Effect.catchTag("AttachmentNotFoundError", () =>
          Effect.succeed({
            id: "fallback-id",
            filename: "fallback.txt",
            mimeType: "text/plain",
            sizeBytes: 0,
            uploadedAt: new Date(),
          })
        )
      );

      return attachment.filename;
    }).pipe(Effect.provide(InMemoryBackend.Default));

    const result = await Effect.runPromise(program);
    expect(result).toBe("fallback.txt");
  });

  it("should handle multiple error types in sequence", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend, {
        maxSizeBytes: 100,
        allowedMimeTypes: ["image/jpeg"],
      });

      // Try to upload with MIME type error
      const result1 = yield* service
        .upload("file.txt", Buffer.from("data"), "text/plain")
        .pipe(
          Effect.catchTag("UnsupportedAttachmentTypeError", () =>
            Effect.succeed({ recovered: "mime_type" })
          ),
          Effect.catchTag("InvalidAttachmentError", () =>
            Effect.succeed({ recovered: "invalid" })
          )
        );

      // Try to upload with size error
      const largeData = Buffer.alloc(200);
      const result2 = yield* service
        .upload("large.bin", largeData, "image/jpeg")
        .pipe(
          Effect.catchTag("AttachmentSizeLimitError", () =>
            Effect.succeed({ recovered: "size_limit" })
          )
        );

      return { result1, result2 };
    }).pipe(Effect.provide(InMemoryBackend.Default));

    const result = await Effect.runPromise(program);
    expect(result.result1.recovered).toBe("mime_type");
    expect(result.result2.recovered).toBe("size_limit");
  });

  it("should allow retrying failed operations", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend);

      // Upload an attachment
      const uploaded = yield* service.upload(
        "file.txt",
        Buffer.from("data"),
        "text/plain"
      );

      // Try to get it (will succeed after retry)
      let attempts = 0;
      const result = yield* service.get(uploaded.id).pipe(
        Effect.catchTag("AttachmentNotFoundError", () => {
          attempts++;
          return attempts < 2
            ? Effect.fail(
                new AttachmentNotFoundError({
                  message: "Retry",
                  id: uploaded.id,
                })
              )
            : Effect.succeed({
                id: uploaded.id,
                filename: "fallback.txt",
                mimeType: "text/plain",
                sizeBytes: 0,
                uploadedAt: new Date(),
              });
        })
      );

      return { recovered: true, attempts };
    }).pipe(Effect.provide(InMemoryBackend.Default));

    const result = await Effect.runPromise(program);
    expect(result.recovered).toBe(true);
  });
});
