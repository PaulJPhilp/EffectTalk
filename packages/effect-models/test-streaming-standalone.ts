/**
 * Standalone streaming test - bypasses monorepo dependency resolution issues
 *
 * Run with:
 * cd /Users/paul/Projects/Trinity/Hume/packages/effect-models && \
 * OPENROUTER_API_KEY="sk-or-v1-..." bun run test-streaming-standalone.ts
 */

import { Effect, Stream } from "effect";
import { OpenRouterClient } from "./src/clients/openrouter-client.js";
import { OpenRouterConfig } from "./src/config/openrouter-config.js";
import { OpenRouterService } from "./src/services/open-router-service.js";
import { Layer } from "effect";

// Test the streaming implementation directly
const testStreaming = async () => {
  console.log("🧪 Testing OpenRouter streaming...\n");

  // Create a simple config layer that reads from environment
  const ConfigLayer = Layer.succeed(OpenRouterConfig, {
    getApiKey: () => {
      const key = process.env.OPENROUTER_API_KEY;
      if (!key) {
        throw new Error("OPENROUTER_API_KEY environment variable not set");
      }
      return Effect.succeed(key);
    },
    getBaseUrl: () => Effect.succeed("https://openrouter.ai/api/v1"),
    getTimeoutMs: () => Effect.succeed(30000),
    getMaxRetries: () => Effect.succeed(3),
  });

  // Create the full effect program
  const program = Effect.gen(function* () {
    const service = yield* OpenRouterService;

    const chunks: string[] = [];
    let chunkCount = 0;

    console.log(
      "📡 Streaming request: Say 'Hello, streaming!' and nothing else."
    );
    console.log("⏳ Waiting for response...\n");

    const startTime = Date.now();

    yield* service
      .streamComplete({
        model: "openai/gpt-3.5-turbo",
        messages: [
          {
            role: "user",
            content: "Say 'Hello, streaming!' and nothing else.",
          },
        ],
        maxTokens: 20,
      })
      .pipe(
        Stream.runForEach((chunk) => {
          chunkCount++;
          const content = chunk.choices[0]?.delta.content;
          if (content) {
            chunks.push(content);
            process.stdout.write(content);
          }
          return Effect.void;
        })
      );

    const duration = Date.now() - startTime;

    console.log("\n");
    return { chunkCount, fullContent: chunks.join(""), duration };
  }).pipe(
    Effect.provide(ConfigLayer),
    Effect.provide(OpenRouterClient.Default)
  );

  try {
    const result = await Effect.runPromise(program);
    console.log("✅ Streaming successful!");
    console.log(`  - Chunks received: ${result.chunkCount}`);
    console.log(`  - Duration: ${result.duration}ms`);
    console.log(`  - Full response: "${result.fullContent}"`);
    console.log();
    return true;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`❌ Error: ${error.message}`);
      if (error.cause) {
        console.error(`   Cause: ${error.cause}`);
      }
    } else {
      console.error(`❌ Error: ${String(error)}`);
    }
    console.error();
    return false;
  }
};

// Run the test
testStreaming()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error("Unhandled error:", err);
    process.exit(1);
  });
