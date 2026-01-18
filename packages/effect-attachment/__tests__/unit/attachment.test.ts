/**
 * Unit tests for effect-attachment
 */

import { describe, expect, it } from "vitest";
import { Effect, Either } from "effect";
import { InMemoryBackend } from "effect-repository";
import {
  createAttachmentService,
  AttachmentNotFoundError,
  AttachmentSizeLimitError,
} from "../../src/index.js";

describe("AttachmentService", () => {
  it("should upload and download an attachment", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend);

      // Upload
      const imageData = Buffer.from("fake image data");
      const attachment = yield* service.upload(
        "photo.jpg",
        imageData,
        "image/jpeg",
        { chatId: "chat-123", userId: "user-456" }
      );

      expect(attachment.filename).toBe("photo.jpg");
      expect(attachment.mimeType).toBe("image/jpeg");
      expect(attachment.chatId).toBe("chat-123");
      expect(attachment.userId).toBe("user-456");

      // Download
      const downloaded = yield* service.download(attachment.id);
      expect(downloaded.data.toString()).toBe("fake image data");
    }).pipe(Effect.provide(InMemoryBackend.Default));

    await Effect.runPromise(program);
  });

  it("should enforce size limits", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend, {
        maxSizeBytes: 100,
      });

      const largeData = Buffer.alloc(200);
      const result = yield* Effect.either(
        service.upload("large.bin", largeData, "application/octet-stream")
      );

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(AttachmentSizeLimitError);
      }
    }).pipe(Effect.provide(InMemoryBackend.Default));

    await Effect.runPromise(program);
  });

  it("should list attachments by chat", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend);

      // Upload multiple attachments
      yield* service.upload("file1.txt", Buffer.from("data1"), "text/plain", {
        chatId: "chat-1",
      });

      yield* service.upload("file2.txt", Buffer.from("data2"), "text/plain", {
        chatId: "chat-2",
      });

      // List by chat ID
      const result = yield* service.list({ chatId: "chat-1" });
      expect(result.items.length).toBe(1);
      expect(result.items[0].filename).toBe("file1.txt");
    }).pipe(Effect.provide(InMemoryBackend.Default));

    await Effect.runPromise(program);
  });

  it("should fail on attachment not found", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend);

      const result = yield* Effect.either(service.get("nonexistent-id"));

      expect(Either.isLeft(result)).toBe(true);
      if (Either.isLeft(result)) {
        expect(result.left).toBeInstanceOf(AttachmentNotFoundError);
      }
    }).pipe(Effect.provide(InMemoryBackend.Default));

    await Effect.runPromise(program);
  });

  it("should delete attachments", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend);

      const attachment = yield* service.upload(
        "test.txt",
        Buffer.from("data"),
        "text/plain"
      );

      yield* service.delete(attachment.id);

      const result = yield* Effect.either(service.get(attachment.id));

      expect(Either.isLeft(result)).toBe(true);
    }).pipe(Effect.provide(InMemoryBackend.Default));

    await Effect.runPromise(program);
  });
});
