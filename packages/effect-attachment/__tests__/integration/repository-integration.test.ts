/**
 * Integration tests for effect-attachment with repository backend
 *
 * Tests complete workflows and repository integration scenarios.
 */

import { describe, expect, it } from "vitest";
import { Effect } from "effect";
import { InMemoryBackend } from "effect-repository";
import {
  createAttachmentService,
  type Attachment,
  type AttachmentWithData,
} from "../../src/index.js";

describe("AttachmentService - Repository Integration", () => {
  it("should handle complete workflow: upload, list, download, delete", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend);

      // Step 1: Upload attachments
      const att1 = yield* service.upload(
        "document.pdf",
        Buffer.from("PDF data"),
        "application/pdf",
        { chatId: "conv-123" }
      );

      const att2 = yield* service.upload(
        "image.jpg",
        Buffer.from("JPEG data"),
        "image/jpeg",
        { chatId: "conv-123" }
      );

      const att3 = yield* service.upload(
        "other.txt",
        Buffer.from("text data"),
        "text/plain",
        { chatId: "conv-456" }
      );

      // Step 2: List all attachments
      const allResult = yield* service.list();
      expect(allResult.items.length).toBe(3);

      // Step 3: List by chat ID
      const chatResult = yield* service.list({ chatId: "conv-123" });
      expect(chatResult.items.length).toBe(2);
      expect(chatResult.items.some((a) => a.filename === "document.pdf")).toBe(
        true
      );

      // Step 4: Download and verify data
      const downloaded = yield* service.download(att1.id);
      expect(downloaded.filename).toBe("document.pdf");
      expect(downloaded.data.toString()).toBe("PDF data");

      // Step 5: Delete one attachment
      yield* service.delete(att2.id);

      // Step 6: Verify deletion
      const afterDelete = yield* service.list({ chatId: "conv-123" });
      expect(afterDelete.items.length).toBe(1);
      expect(afterDelete.items[0].filename).toBe("document.pdf");

      return { success: true, stages: 6 };
    }).pipe(Effect.provide(InMemoryBackend.Default));

    const result = await Effect.runPromise(program);
    expect(result.success).toBe(true);
    expect(result.stages).toBe(6);
  });

  it("should maintain data consistency across operations", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend);

      const originalData = Buffer.from([1, 2, 3, 255, 254, 253]);
      const mimeType = "application/octet-stream";
      const filename = "binary.bin";

      // Upload
      const attachment = yield* service.upload(
        filename,
        originalData,
        mimeType,
        { chatId: "chat-1", userId: "user-1" }
      );

      // Verify metadata consistency
      expect(attachment.filename).toBe(filename);
      expect(attachment.mimeType).toBe(mimeType);
      expect(attachment.sizeBytes).toBe(originalData.length);
      expect(attachment.chatId).toBe("chat-1");
      expect(attachment.userId).toBe("user-1");

      // Get metadata only
      const metadata = yield* service.get(attachment.id);
      expect(metadata.filename).toBe(filename);
      expect(metadata.mimeType).toBe(mimeType);
      expect(metadata.sizeBytes).toBe(originalData.length);

      // Download and verify data matches original
      const downloaded = yield* service.download(attachment.id);
      expect(Buffer.compare(downloaded.data, originalData)).toBe(0);
      expect(downloaded.filename).toBe(filename);
      expect(downloaded.mimeType).toBe(mimeType);

      return { consistency: true };
    }).pipe(Effect.provide(InMemoryBackend.Default));

    const result = await Effect.runPromise(program);
    expect(result.consistency).toBe(true);
  });

  it("should support multiple concurrent uploads", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend);

      // Upload multiple attachments in sequence
      const uploads = yield* Effect.all([
        service.upload("file1.txt", Buffer.from("data1"), "text/plain"),
        service.upload("file2.txt", Buffer.from("data2"), "text/plain"),
        service.upload("file3.txt", Buffer.from("data3"), "text/plain"),
      ]);

      expect(uploads.length).toBe(3);
      expect(uploads[0].filename).toBe("file1.txt");
      expect(uploads[1].filename).toBe("file2.txt");
      expect(uploads[2].filename).toBe("file3.txt");

      // Verify all are retrievable
      const result = yield* service.list();
      expect(result.items.length).toBe(3);
    }).pipe(Effect.provide(InMemoryBackend.Default));

    await Effect.runPromise(program);
  });

  it("should handle config constraints across operations", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend, {
        maxSizeBytes: 100,
        allowedMimeTypes: ["text/plain", "text/csv"],
      });

      // Successful uploads within constraints
      const file1 = yield* service.upload(
        "data.txt",
        Buffer.from("small text file"),
        "text/plain"
      );

      expect(file1.filename).toBe("data.txt");

      // Verify it's in the list
      const result = yield* service.list();
      expect(result.items.length).toBe(1);

      return { constrained: true };
    }).pipe(Effect.provide(InMemoryBackend.Default));

    const result = await Effect.runPromise(program);
    expect(result.constrained).toBe(true);
  });

  it("should correctly handle filtering combinations", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend);

      // Create a diverse set of attachments
      yield* Effect.all([
        // Chat 1, User 1
        service.upload("file1.txt", Buffer.from("data"), "text/plain", {
          chatId: "chat-1",
          userId: "user-1",
        }),
        service.upload("file2.jpg", Buffer.from("data"), "image/jpeg", {
          chatId: "chat-1",
          userId: "user-1",
        }),

        // Chat 1, User 2
        service.upload("file3.txt", Buffer.from("data"), "text/plain", {
          chatId: "chat-1",
          userId: "user-2",
        }),

        // Chat 2, User 1
        service.upload("file4.jpg", Buffer.from("data"), "image/jpeg", {
          chatId: "chat-2",
          userId: "user-1",
        }),

        // No chat or user
        service.upload("file5.txt", Buffer.from("data"), "text/plain"),
      ]);

      // Test all combinations
      const byChat1 = yield* service.list({ chatId: "chat-1" });
      expect(byChat1.items.length).toBe(3);

      const byUser1 = yield* service.list({ userId: "user-1" });
      expect(byUser1.items.length).toBe(3);

      const byBoth = yield* service.list({
        chatId: "chat-1",
        userId: "user-1",
      });
      expect(byBoth.items.length).toBe(2);

      const all = yield* service.list();
      expect(all.items.length).toBe(5);

      return { combinations: true };
    }).pipe(Effect.provide(InMemoryBackend.Default));

    const result = await Effect.runPromise(program);
    expect(result.combinations).toBe(true);
  });

  it("should preserve state between service instances with same backend", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;

      // Create first service instance and upload
      const service1 = createAttachmentService(backend);
      const attachment = yield* service1.upload(
        "shared.txt",
        Buffer.from("shared data"),
        "text/plain"
      );

      // Create second service instance with same backend
      const service2 = createAttachmentService(backend);

      // Verify second instance can access the data
      const retrieved = yield* service2.get(attachment.id);
      expect(retrieved.id).toBe(attachment.id);
      expect(retrieved.filename).toBe("shared.txt");

      const downloaded = yield* service2.download(attachment.id);
      expect(downloaded.data.toString()).toBe("shared data");

      return { shared: true };
    }).pipe(Effect.provide(InMemoryBackend.Default));

    const result = await Effect.runPromise(program);
    expect(result.shared).toBe(true);
  });

  it("should handle large collections efficiently", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend);

      // Create many attachments
      const count = 20;
      const uploads = yield* Effect.all(
        Array.from({ length: count }, (_, i) =>
          service.upload(
            `file-${i}.txt`,
            Buffer.from(`data-${i}`),
            "text/plain",
            { chatId: "chat-1" }
          )
        )
      );

      expect(uploads.length).toBe(count);

      // Verify all are retrievable
      const result = yield* service.list({ chatId: "chat-1" });
      expect(result.items.length).toBe(count);

      // Verify random access
      const middle = uploads[10];
      const retrieved = yield* service.get(middle.id);
      expect(retrieved.id).toBe(middle.id);

      return { count, success: true };
    }).pipe(Effect.provide(InMemoryBackend.Default));

    const result = await Effect.runPromise(program);
    expect(result.count).toBe(20);
    expect(result.success).toBe(true);
  });

  it("should handle metadata variations", async () => {
    const program = Effect.gen(function* () {
      const backend = yield* InMemoryBackend;
      const service = createAttachmentService(backend);

      // Upload with no metadata
      const a1 = yield* service.upload(
        "no-meta.txt",
        Buffer.from("data"),
        "text/plain"
      );

      // Upload with chatId only
      const a2 = yield* service.upload(
        "chat-only.txt",
        Buffer.from("data"),
        "text/plain",
        { chatId: "chat-1" }
      );

      // Upload with userId only
      const a3 = yield* service.upload(
        "user-only.txt",
        Buffer.from("data"),
        "text/plain",
        { userId: "user-1" }
      );

      // Upload with both
      const a4 = yield* service.upload(
        "both.txt",
        Buffer.from("data"),
        "text/plain",
        { chatId: "chat-2", userId: "user-2" }
      );

      // Upload with custom ID
      const customId = "my-custom-id";
      const a5 = yield* service.upload(
        "custom-id.txt",
        Buffer.from("data"),
        "text/plain",
        { id: customId }
      );

      // Verify all variations
      expect(a1.chatId).toBeUndefined();
      expect(a1.userId).toBeUndefined();

      expect(a2.chatId).toBe("chat-1");
      expect(a2.userId).toBeUndefined();

      expect(a3.chatId).toBeUndefined();
      expect(a3.userId).toBe("user-1");

      expect(a4.chatId).toBe("chat-2");
      expect(a4.userId).toBe("user-2");

      expect(a5.id).toBe(customId);

      return { variations: 5 };
    }).pipe(Effect.provide(InMemoryBackend.Default));

    const result = await Effect.runPromise(program);
    expect(result.variations).toBe(5);
  });
});
