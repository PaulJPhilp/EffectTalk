/**
 * Extended service tests for effect-attachment
 *
 * Tests edge cases, boundary conditions, and comprehensive scenario coverage.
 */

import { describe, expect, it } from "vitest"
import { Effect, Either } from "effect"
import { InMemoryBackend } from "effect-repository"
import {
  createAttachmentService,
  AttachmentNotFoundError,
  InvalidAttachmentError,
  AttachmentSizeLimitError,
  UnsupportedAttachmentTypeError,
} from "../../src/index.js"

describe("AttachmentService - Edge Cases", () => {
  describe("Upload validation", () => {
    it("should reject empty filename", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const result = yield* Effect.either(
          service.upload("", Buffer.from("data"), "text/plain")
        )

        expect(Either.isLeft(result)).toBe(true)
        if (Either.isLeft(result)) {
          expect(result.left).toBeInstanceOf(InvalidAttachmentError)
          const err = result.left as InvalidAttachmentError
          expect(err.reason).toBe("empty_filename")
        }
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should reject whitespace-only filename", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const result = yield* Effect.either(
          service.upload("   ", Buffer.from("data"), "text/plain")
        )

        expect(Either.isLeft(result)).toBe(true)
        if (Either.isLeft(result)) {
          expect(result.left).toBeInstanceOf(InvalidAttachmentError)
        }
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should accept zero-byte file", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const attachment = yield* service.upload(
          "empty.txt",
          Buffer.alloc(0),
          "text/plain"
        )

        expect(attachment.filename).toBe("empty.txt")
        expect(attachment.sizeBytes).toBe(0)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should accept file at exact size limit", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const limitBytes = 100
        const service = createAttachmentService(backend, {
          maxSizeBytes: limitBytes,
        })

        const exactData = Buffer.alloc(limitBytes)
        const attachment = yield* service.upload(
          "exact.bin",
          exactData,
          "application/octet-stream"
        )

        expect(attachment.sizeBytes).toBe(limitBytes)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should reject file just over size limit", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const limitBytes = 100
        const service = createAttachmentService(backend, {
          maxSizeBytes: limitBytes,
        })

        const oversizeData = Buffer.alloc(limitBytes + 1)
        const result = yield* Effect.either(
          service.upload("over.bin", oversizeData, "application/octet-stream")
        )

        expect(Either.isLeft(result)).toBe(true)
        if (Either.isLeft(result)) {
          expect(result.left).toBeInstanceOf(AttachmentSizeLimitError)
        }
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should accept MIME type when no restrictions", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend) // No allowedMimeTypes

        const attachment = yield* service.upload(
          "file.exe",
          Buffer.from("data"),
          "application/x-executable"
        )

        expect(attachment.mimeType).toBe("application/x-executable")
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should accept exact MIME type match", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend, {
          allowedMimeTypes: ["image/jpeg", "image/png"],
        })

        const attachment = yield* service.upload(
          "image.jpg",
          Buffer.from("data"),
          "image/jpeg"
        )

        expect(attachment.mimeType).toBe("image/jpeg")
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should reject MIME type not in allowed list", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend, {
          allowedMimeTypes: ["image/jpeg", "image/png"],
        })

        const result = yield* Effect.either(
          service.upload(
            "file.txt",
            Buffer.from("data"),
            "text/plain"
          )
        )

        expect(Either.isLeft(result)).toBe(true)
        if (Either.isLeft(result)) {
          expect(result.left).toBeInstanceOf(UnsupportedAttachmentTypeError)
        }
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should preserve custom metadata (chatId, userId)", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const attachment = yield* service.upload(
          "file.txt",
          Buffer.from("data"),
          "text/plain",
          { chatId: "chat-abc", userId: "user-xyz" }
        )

        expect(attachment.chatId).toBe("chat-abc")
        expect(attachment.userId).toBe("user-xyz")

        // Verify it's preserved in download
        const downloaded = yield* service.download(attachment.id)
        expect(downloaded.chatId).toBe("chat-abc")
        expect(downloaded.userId).toBe("user-xyz")
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should work with custom attachment ID", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)
        const customId = "my-custom-id-123"

        const attachment = yield* service.upload(
          "file.txt",
          Buffer.from("data"),
          "text/plain",
          { id: customId }
        )

        expect(attachment.id).toBe(customId)

        // Verify we can retrieve with custom ID
        const retrieved = yield* service.get(customId)
        expect(retrieved.id).toBe(customId)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("Download edge cases", () => {
    it("should fail to download nonexistent attachment", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const result = yield* Effect.either(
          service.download("nonexistent-id")
        )

        expect(Either.isLeft(result)).toBe(true)
        if (Either.isLeft(result)) {
          expect(result.left).toBeInstanceOf(AttachmentNotFoundError)
        }
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should preserve exact binary data on download", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const originalData = Buffer.from([0, 1, 2, 3, 255, 254, 253])
        const attachment = yield* service.upload(
          "binary.bin",
          originalData,
          "application/octet-stream"
        )

        const downloaded = yield* service.download(attachment.id)
        expect(Buffer.compare(downloaded.data, originalData)).toBe(0)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("List filtering edge cases", () => {
    it("should list attachments with no filters", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        yield* service.upload(
          "file1.txt",
          Buffer.from("data"),
          "text/plain",
          { chatId: "chat-1" }
        )
        yield* service.upload(
          "file2.jpg",
          Buffer.from("data"),
          "image/jpeg",
          { chatId: "chat-2" }
        )

        const result = yield* service.list()
        expect(result.items.length).toBe(2)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should filter by chatId only", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        yield* service.upload(
          "file1.txt",
          Buffer.from("data"),
          "text/plain",
          { chatId: "chat-1" }
        )
        yield* service.upload(
          "file2.txt",
          Buffer.from("data"),
          "text/plain",
          { chatId: "chat-1" }
        )
        yield* service.upload(
          "file3.txt",
          Buffer.from("data"),
          "text/plain",
          { chatId: "chat-2" }
        )

        const result = yield* service.list({ chatId: "chat-1" })
        expect(result.items.length).toBe(2)
        expect(result.items.every((a) => a.chatId === "chat-1")).toBe(true)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should filter by userId only", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        yield* service.upload(
          "file1.txt",
          Buffer.from("data"),
          "text/plain",
          { userId: "user-1" }
        )
        yield* service.upload(
          "file2.txt",
          Buffer.from("data"),
          "text/plain",
          { userId: "user-1" }
        )
        yield* service.upload(
          "file3.txt",
          Buffer.from("data"),
          "text/plain",
          { userId: "user-2" }
        )

        const result = yield* service.list({ userId: "user-1" })
        expect(result.items.length).toBe(2)
        expect(result.items.every((a) => a.userId === "user-1")).toBe(true)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should filter by both chatId and userId", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        yield* service.upload(
          "file1.txt",
          Buffer.from("data"),
          "text/plain",
          { chatId: "chat-1", userId: "user-1" }
        )
        yield* service.upload(
          "file2.txt",
          Buffer.from("data"),
          "text/plain",
          { chatId: "chat-1", userId: "user-2" }
        )
        yield* service.upload(
          "file3.txt",
          Buffer.from("data"),
          "text/plain",
          { chatId: "chat-2", userId: "user-1" }
        )

        const result = yield* service.list({
          chatId: "chat-1",
          userId: "user-1",
        })
        expect(result.items.length).toBe(1)
        expect(result.items[0].chatId).toBe("chat-1")
        expect(result.items[0].userId).toBe("user-1")
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should return empty result when no matches", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        yield* service.upload(
          "file1.txt",
          Buffer.from("data"),
          "text/plain",
          { chatId: "chat-1" }
        )

        const result = yield* service.list({ chatId: "chat-2" })
        expect(result.items.length).toBe(0)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("Delete edge cases", () => {
    it("should fail to delete nonexistent attachment", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const result = yield* Effect.either(
          service.delete("nonexistent-id")
        )

        expect(Either.isLeft(result)).toBe(true)
        if (Either.isLeft(result)) {
          expect(result.left).toBeInstanceOf(AttachmentNotFoundError)
        }
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should make attachment inaccessible after delete", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)

        const attachment = yield* service.upload(
          "temp.txt",
          Buffer.from("data"),
          "text/plain"
        )

        // Verify it exists
        const before = yield* service.get(attachment.id)
        expect(before.id).toBe(attachment.id)

        // Delete it
        yield* service.delete(attachment.id)

        // Verify it's gone
        const after = yield* Effect.either(service.get(attachment.id))
        expect(Either.isLeft(after)).toBe(true)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })

  describe("Metadata preservation", () => {
    it("should preserve uploadedAt timestamp", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)
        const beforeUpload = new Date()

        const attachment = yield* service.upload(
          "file.txt",
          Buffer.from("data"),
          "text/plain"
        )

        const afterUpload = new Date()

        expect(attachment.uploadedAt.getTime()).toBeGreaterThanOrEqual(
          beforeUpload.getTime()
        )
        expect(attachment.uploadedAt.getTime()).toBeLessThanOrEqual(
          afterUpload.getTime()
        )
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })

    it("should preserve MIME type exactly", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend
        const service = createAttachmentService(backend)
        const mimeType = "application/vnd.custom+json; charset=utf-8"

        const attachment = yield* service.upload(
          "file.txt",
          Buffer.from("data"),
          mimeType
        )

        expect(attachment.mimeType).toBe(mimeType)
      }).pipe(Effect.provide(InMemoryBackend.Default))

      await Effect.runPromise(program)
    })
  })
})
