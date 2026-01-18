/**
 * Integration tests for effect-storage
 * @packageDocumentation
 */

import { describe, expect, it } from "vitest";
import { Effect, Schema } from "effect";
import { createMemoryStorage } from "../../src/index.js";

describe("Storage Service Integration", () => {
  const ContentSchema = Schema.String;
  const MetadataSchema = Schema.Struct({
    title: Schema.String,
    version: Schema.Number,
    tags: Schema.Array(Schema.String),
  });

  it("should perform full CRUD operations", async () => {
    const program = Effect.gen(function* () {
      const storage = yield* createMemoryStorage({
        contentExtension: "txt",
        contentSchema: ContentSchema,
        metadataSchema: MetadataSchema,
      });

      // Create
      const content = "# My Document";
      const metadata = {
        title: "My Document",
        version: 1,
        tags: ["important", "draft"],
      };

      yield* storage.save("doc-1", content, metadata);

      // Read
      const loaded = yield* storage.load("doc-1");
      expect(loaded.content).toBe(content);
      expect(loaded.metadata.title).toBe("My Document");

      // Update
      const newContent = "# My Document (Updated)";
      const newMetadata = {
        title: "My Document",
        version: 2,
        tags: ["important", "final"],
      };

      yield* storage.save("doc-1", newContent, newMetadata);

      const updated = yield* storage.load("doc-1");
      expect(updated.content).toBe(newContent);
      expect(updated.metadata.version).toBe(2);

      // Delete
      yield* storage.delete("doc-1");

      const exists = yield* storage.exists("doc-1");
      expect(exists).toBe(false);
    });

    await Effect.runPromise(program);
  });

  it("should support caching", async () => {
    const program = Effect.gen(function* () {
      const storage = yield* createMemoryStorage({
        contentExtension: "txt",
        contentSchema: ContentSchema,
        metadataSchema: MetadataSchema,
        enableCaching: true,
      });

      // Save initial data
      yield* storage.save("doc-1", "Original content", {
        title: "Doc 1",
        version: 1,
        tags: ["test"],
      });

      // First load (from backend, cached)
      const first = yield* storage.load("doc-1");
      expect(first.content).toBe("Original content");

      // Subsequent loads should come from cache
      const second = yield* storage.load("doc-1");
      expect(second.content).toBe("Original content");

      // Clear cache
      yield* storage.clearCache();

      // Load after cache clear still works
      const third = yield* storage.load("doc-1");
      expect(third.content).toBe("Original content");
    });

    await Effect.runPromise(program);
  });

  it("should list multiple items", async () => {
    const program = Effect.gen(function* () {
      const storage = yield* createMemoryStorage({
        contentExtension: "txt",
        contentSchema: ContentSchema,
        metadataSchema: MetadataSchema,
      });

      // Save multiple items
      const docs = [
        {
          id: "doc-1",
          content: "First document",
          metadata: { title: "Doc 1", version: 1, tags: ["a"] },
        },
        {
          id: "doc-2",
          content: "Second document",
          metadata: { title: "Doc 2", version: 1, tags: ["b"] },
        },
        {
          id: "doc-3",
          content: "Third document",
          metadata: { title: "Doc 3", version: 1, tags: ["c"] },
        },
      ];

      for (const doc of docs) {
        yield* storage.save(doc.id, doc.content, doc.metadata);
      }

      // List all IDs
      const ids = yield* storage.list();
      expect(ids).toHaveLength(3);
      expect(ids).toContain("doc-1");
      expect(ids).toContain("doc-2");
      expect(ids).toContain("doc-3");

      // List with metadata
      const items = yield* storage.listWithMetadata();
      expect(items).toHaveLength(3);

      const doc1Meta = items.find((item) => item.id === "doc-1");
      expect(doc1Meta?.metadata.title).toBe("Doc 1");
    });

    await Effect.runPromise(program);
  });

  it("should handle load metadata and load content separately", async () => {
    const program = Effect.gen(function* () {
      const storage = yield* createMemoryStorage({
        contentExtension: "txt",
        contentSchema: ContentSchema,
        metadataSchema: MetadataSchema,
      });

      yield* storage.save("doc-1", "Test content", {
        title: "Test Document",
        version: 1,
        tags: ["test"],
      });

      // Load only metadata
      const metadata = yield* storage.loadMetadata("doc-1");
      expect(metadata.title).toBe("Test Document");

      // Load only content
      const content = yield* storage.loadContent("doc-1");
      expect(content).toBe("Test content");
    });

    await Effect.runPromise(program);
  });

  it("should handle error cases properly", async () => {
    const program = Effect.gen(function* () {
      const storage = yield* createMemoryStorage({
        contentExtension: "txt",
        contentSchema: ContentSchema,
        metadataSchema: MetadataSchema,
      });

      // Try to load non-existent item
      const result = yield* Effect.either(storage.load("nonexistent"));

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left._tag).toBe("NotFoundError");
      }

      // Try to delete non-existent item
      const deleteResult = yield* Effect.either(storage.delete("nonexistent"));

      expect(deleteResult._tag).toBe("Left");
    });

    await Effect.runPromise(program);
  });

  it("should support concurrent operations", async () => {
    const program = Effect.gen(function* () {
      const storage = yield* createMemoryStorage({
        contentExtension: "txt",
        contentSchema: ContentSchema,
        metadataSchema: MetadataSchema,
      });

      // Save multiple items concurrently
      yield* Effect.all(
        Array.from({ length: 10 }, (_, i) =>
          storage.save(`doc-${i}`, `Content ${i}`, {
            title: `Document ${i}`,
            version: 1,
            tags: ["concurrent"],
          })
        ),
        { concurrency: "unbounded" }
      );

      // Verify all items were saved
      const ids = yield* storage.list();
      expect(ids).toHaveLength(10);

      // Load all items concurrently
      const loaded = yield* Effect.all(
        ids.map((id) => storage.load(id)),
        { concurrency: "unbounded" }
      );

      expect(loaded).toHaveLength(10);
      expect(loaded[0].metadata.title).toMatch(/Document \d/);
    });

    await Effect.runPromise(program);
  });
});
