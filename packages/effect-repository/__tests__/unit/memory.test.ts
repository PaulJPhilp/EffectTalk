/**
 * Unit tests for InMemoryBackend
 */

import { describe, expect, it } from "vitest";
import { Effect, Either } from "effect";
import { InMemoryBackend } from "../../src/index.js";
import { BlobNotFoundError, BlobAlreadyExistsError } from "../../src/errors.js";

describe("InMemoryBackend", () => {
  describe("save and get", () => {
    it("should save and retrieve a blob", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend;

        const data = Buffer.from("test data");
        const metadata = yield* backend.save(data, "text/plain");

        const blob = yield* backend.get(metadata.id);

        expect(blob.data.toString()).toBe("test data");
        expect(blob.metadata.mimeType).toBe("text/plain");
      }).pipe(Effect.provide(InMemoryBackend.Default));

      await Effect.runPromise(program);
    });

    it("should store custom metadata", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend;

        const metadata = yield* backend.save(
          Buffer.from("data"),
          "application/json",
          { customMetadata: { key: "value" } }
        );

        expect(metadata.customMetadata).toEqual({ key: "value" });
      }).pipe(Effect.provide(InMemoryBackend.Default));

      await Effect.runPromise(program);
    });
  });

  describe("error handling", () => {
    it("should fail when blob not found", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend;
        const result = yield* Effect.either(backend.get("nonexistent"));

        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
          expect(result.left).toBeInstanceOf(BlobNotFoundError);
        }
      }).pipe(Effect.provide(InMemoryBackend.Default));

      await Effect.runPromise(program);
    });

    it("should fail when saving duplicate without overwrite", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend;

        yield* backend.save(Buffer.from("data"), "text/plain", {
          id: "test-id",
        });
        const result = yield* Effect.either(
          backend.save(Buffer.from("new data"), "text/plain", { id: "test-id" })
        );

        expect(Either.isLeft(result)).toBe(true);
        if (Either.isLeft(result)) {
          expect(result.left).toBeInstanceOf(BlobAlreadyExistsError);
        }
      }).pipe(Effect.provide(InMemoryBackend.Default));

      await Effect.runPromise(program);
    });
  });

  describe("list", () => {
    it("should list blobs", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend;

        yield* backend.save(Buffer.from("data1"), "text/plain");
        yield* backend.save(Buffer.from("data2"), "image/png");

        const result = yield* backend.list();

        expect(result.items.length).toBe(2);
      }).pipe(Effect.provide(InMemoryBackend.Default));

      await Effect.runPromise(program);
    });

    it("should filter by MIME type prefix", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend;

        yield* backend.save(Buffer.from("data1"), "text/plain");
        yield* backend.save(Buffer.from("data2"), "image/png");

        const result = yield* backend.list({ mimeTypePrefix: "image/" });

        expect(result.items.length).toBe(1);
        expect(result.items[0].mimeType).toBe("image/png");
      }).pipe(Effect.provide(InMemoryBackend.Default));

      await Effect.runPromise(program);
    });
  });

  describe("exists", () => {
    it("should check if blob exists", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend;

        const metadata = yield* backend.save(Buffer.from("data"), "text/plain");
        const exists = yield* backend.exists(metadata.id);
        const notExists = yield* backend.exists("nonexistent");

        expect(exists).toBe(true);
        expect(notExists).toBe(false);
      }).pipe(Effect.provide(InMemoryBackend.Default));

      await Effect.runPromise(program);
    });
  });

  describe("delete", () => {
    it("should delete a blob", async () => {
      const program = Effect.gen(function* () {
        const backend = yield* InMemoryBackend;

        const metadata = yield* backend.save(Buffer.from("data"), "text/plain");
        yield* backend.delete(metadata.id);

        const exists = yield* backend.exists(metadata.id);
        expect(exists).toBe(false);
      }).pipe(Effect.provide(InMemoryBackend.Default));

      await Effect.runPromise(program);
    });
  });
});
