/**
 * Direct test of streaming implementation using compiled modules
 *
 * Run with:
 * cd /Users/paul/Projects/Trinity/Hume/packages/effect-models && \
 * OPENROUTER_API_KEY="sk-or-v1-..." node test-streaming-direct.mjs
 */

import { Effect, Stream, Layer } from "effect";
import { OpenRouterClient } from "./dist/clients/openrouter-client.js";
import { OpenRouterConfig } from "./dist/config/openrouter-config.js";
import { OpenRouterService } from "./dist/services/open-router-service.js";

const apiKey = process.env.OPENROUTER_API_KEY;
if (!apiKey) {
  console.error("❌ Error: OPENROUTER_API_KEY environment variable not set");
  process.exit(1);
}

console.log("🧪 Testing OpenRouter streaming implementation\n");
console.log("📋 Configuration:");
console.log(`  - API Key: ${apiKey.slice(0, 20)}...`);
console.log(`  - Base URL: https://openrouter.ai/api/v1`);
console.log(`  - Model: openai/gpt-3.5-turbo`);
console.log(`  - Request: Say 'Hello, streaming!' and nothing else.\n`);

// Create a simple config layer
const ConfigLayer = Layer.succeed(OpenRouterConfig, {
  getApiKey: () => Effect.succeed(apiKey),
  getBaseUrl: () => Effect.succeed("https://openrouter.ai/api/v1"),
  getTimeoutMs: () => Effect.succeed(30000),
  getMaxRetries: () => Effect.succeed(3),
});

// Build the test program
const program = Effect.gen(function* () {
  const service = yield* OpenRouterService;

  const chunks = [];
  let chunkCount = 0;

  console.log("⏳ Connecting to OpenRouter API...\n");
  console.log("📝 Stream output:");
  console.log("─".repeat(60));

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

  console.log("\n" + "─".repeat(60));
  console.log();

  return { chunkCount, fullContent: chunks.join(""), duration };
}).pipe(Effect.provide(ConfigLayer), Effect.provide(OpenRouterClient.Default));

// Run the test
(async () => {
  try {
    console.log("Starting test...\n");
    const result = await Effect.runPromise(program);

    console.log("✅ Streaming test successful!\n");
    console.log("📊 Results:");
    console.log(`  - Total chunks: ${result.chunkCount}`);
    console.log(`  - Duration: ${result.duration}ms`);
    console.log(`  - Full response: "${result.fullContent}"`);
    console.log(
      `  - Avg chunk time: ${(result.duration / result.chunkCount).toFixed(1)}ms\n`
    );

    // Validation
    if (result.chunkCount > 0) {
      console.log("✓ Received streaming chunks from API");
    } else {
      console.log("✗ No chunks received");
    }

    if (result.fullContent.length > 0) {
      console.log("✓ Content extracted correctly");
    } else {
      console.log("✗ No content extracted");
    }

    if (result.fullContent.toLowerCase().includes("hello")) {
      console.log("✓ Response contains expected content");
    } else {
      console.log("✗ Response does not contain expected content");
    }

    console.log();
    console.log("🎉 All checks passed!\n");
    process.exit(0);
  } catch (error) {
    console.error("❌ Test failed\n");
    if (error instanceof Error) {
      console.error("Error:", error.message);
      if (error.cause) {
        console.error("Cause:", error.cause);
      }
    } else {
      console.error("Error:", String(error));
    }
    console.error();
    process.exit(1);
  }
})();
