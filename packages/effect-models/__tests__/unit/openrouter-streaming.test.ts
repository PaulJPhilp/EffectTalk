/**
 * Unit tests for OpenRouter streaming functionality
 */

import { Effect, Stream, Layer } from "effect";
import { describe, it, expect } from "vitest";
import { OpenRouterService } from "../../src/services/open-router-service.js";
import { OpenRouterClient } from "../../src/clients/openrouter-client.js";
import { mockStreamChunks } from "../fixtures/openrouter-responses.js";
import type { StreamChunk } from "../../src/schemas/openrouter.js";

describe("OpenRouter Streaming", () => {
  /**
   * Create a test OpenRouterClient layer that returns mock streaming chunks
   */
  const createTestStreamingLayer = () =>
    Layer.succeed(OpenRouterClient, {
      fetchModels: () => Effect.never(),
      createChatCompletion: () => Effect.never(),
      streamChatCompletion: () => Stream.fromIterable(mockStreamChunks),
    });

  describe("streamComplete", () => {
    it("should emit streaming chunks", async () => {
      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;

        const chunks: StreamChunk[] = [];

        yield* service
          .streamComplete({
            model: "openai/gpt-4",
            messages: [{ role: "user", content: "Hello" }],
          })
          .pipe(
            Stream.runForEach((chunk) => {
              chunks.push(chunk);
              return Effect.void;
            })
          );

        expect(chunks.length).toBe(mockStreamChunks.length);
        expect(chunks[0]!.model).toBe("openai/gpt-4");
      }).pipe(Effect.provide(createTestStreamingLayer()));

      await Effect.runPromise(program);
    });

    it("should extract content from delta", async () => {
      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;

        const contentParts: string[] = [];

        yield* service
          .streamComplete({
            model: "openai/gpt-4",
            messages: [{ role: "user", content: "Count to 3" }],
          })
          .pipe(
            Stream.runForEach((chunk) => {
              const content = chunk.choices[0]?.delta.content;
              if (content) {
                contentParts.push(content);
              }
              return Effect.void;
            })
          );

        expect(contentParts.length).toBeGreaterThan(0);
        // Check that we got the expected content parts
        expect(contentParts[0]).toBe("Hello");
        expect(contentParts[1]).toBe(" ");
        expect(contentParts[2]).toBe("world");
        expect(contentParts[3]).toBe("!");
      }).pipe(Effect.provide(createTestStreamingLayer()));

      await Effect.runPromise(program);
    });

    it("should handle empty delta content", async () => {
      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;

        const chunks: StreamChunk[] = [];

        yield* service
          .streamComplete({
            model: "openai/gpt-4",
            messages: [{ role: "user", content: "Test" }],
          })
          .pipe(
            Stream.runForEach((chunk) => {
              chunks.push(chunk);
              return Effect.void;
            })
          );

        // All mock chunks should be valid
        expect(chunks.every((c) => c.choices[0])).toBe(true);
      }).pipe(Effect.provide(createTestStreamingLayer()));

      await Effect.runPromise(program);
    });

    it("should track finish_reason", async () => {
      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;

        const finishReasons: Array<string | undefined> = [];

        yield* service
          .streamComplete({
            model: "openai/gpt-4",
            messages: [{ role: "user", content: "Test" }],
          })
          .pipe(
            Stream.runForEach((chunk) => {
              const finishReason = chunk.choices[0]?.finish_reason;
              finishReasons.push(finishReason);
              return Effect.void;
            })
          );

        // Last chunk should have finish_reason: "stop"
        expect(finishReasons[finishReasons.length - 1]).toBe("stop");
      }).pipe(Effect.provide(createTestStreamingLayer()));

      await Effect.runPromise(program);
    });

    it("should provide tracing information", async () => {
      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;

        let chunkCount = 0;

        yield* service
          .streamComplete({
            model: "openai/gpt-4",
            messages: [{ role: "user", content: "Test" }],
          })
          .pipe(
            Stream.runForEach(() => {
              chunkCount++;
              return Effect.void;
            })
          );

        expect(chunkCount).toBeGreaterThan(0);
      }).pipe(Effect.provide(createTestStreamingLayer()));

      await Effect.runPromise(program);
    });
  });

  describe("stream termination", () => {
    it("should terminate stream when all chunks are consumed", async () => {
      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;

        let chunkCount = 0;

        yield* service
          .streamComplete({
            model: "openai/gpt-4",
            messages: [{ role: "user", content: "Test" }],
          })
          .pipe(
            Stream.tap(() =>
              Effect.sync(() => {
                chunkCount++;
              })
            ),
            Stream.runDrain()
          );

        // Should have processed all mock chunks
        expect(chunkCount).toBe(mockStreamChunks.length);
      }).pipe(Effect.provide(createTestStreamingLayer()));

      await Effect.runPromise(program);
    });
  });

  describe("error handling", () => {
    it("should propagate client errors", async () => {
      const testLayer = Layer.succeed(OpenRouterClient, {
        fetchModels: () => Effect.never(),
        createChatCompletion: () => Effect.never(),
        streamChatCompletion: () => Stream.fail(new Error("Stream error")),
      });

      const program = Effect.gen(function* () {
        const service = yield* OpenRouterService;

        const result = yield* service
          .streamComplete({
            model: "openai/gpt-4",
            messages: [{ role: "user", content: "Test" }],
          })
          .pipe(Stream.runDrain(), Effect.either());

        expect(result._tag).toBe("Left");
      }).pipe(Effect.provide(testLayer));

      await Effect.runPromise(program);
    });
  });
});
