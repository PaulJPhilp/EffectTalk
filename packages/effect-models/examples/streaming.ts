/**
 * Streaming responses with effect-models
 *
 * This example demonstrates:
 * - Using streamComplete for real-time responses
 * - Processing streaming chunks
 * - Error handling during streaming
 * - Building complete response from stream
 */

import { Effect, Stream } from "effect";
import { OpenRouterService } from "../src/index.js";

const program = Effect.gen(function* () {
  const service = yield* OpenRouterService;

  // Streaming request
  const request = {
    model: "anthropic/claude-3-haiku",
    messages: [
      {
        role: "user" as const,
        content:
          "Write a short poem about TypeScript (3 lines). Please stream the response.",
      },
    ],
    temperature: 0.8,
  };

  yield* Effect.log("Starting streaming request...");

  // Create stream of chunks
  const stream = service.streamComplete(request);

  // Collect all chunks into a complete message
  const completeResponse = yield* Stream.runFold(
    stream,
    "",
    (accumulated, chunk) => {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta?.type === "text_delta"
      ) {
        return accumulated + (chunk.delta.text || "");
      }
      return accumulated;
    }
  );

  yield* Effect.log("Complete streamed response:");
  yield* Effect.log(completeResponse);

  // Alternative: Process chunks as they arrive
  yield* Effect.log("\nProcessing chunks individually:");
  yield* Stream.forEach(service.streamComplete(request), (chunk) =>
    Effect.gen(function* () {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta?.type === "text_delta"
      ) {
        yield* Effect.log("Chunk:", chunk.delta.text || "(no text)");
      }
    })
  );
});

Effect.runPromise(
  program.pipe(Effect.provide(OpenRouterService.Default))
).catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
