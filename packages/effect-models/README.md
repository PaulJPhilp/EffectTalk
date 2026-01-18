# effect-models

**Part of the [Hume monorepo](../README.md)** - Type-safe, Effect-native services for LLM model providers.

[![CI](https://github.com/PaulJPhilp/effect-models/actions/workflows/ci.yml/badge.svg)](https://github.com/PaulJPhilp/effect-models/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/effect-models.svg)](https://www.npmjs.com/package/effect-models)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Type-safe, Effect-native services for interacting with multiple LLM providers through unified, composable APIs.**

effect-models provides Effect-native abstractions for AI model interactions (chat completions, embeddings, streaming) with comprehensive error handling, automatic retry logic, and provider-agnostic APIs.

> **Status**: Production ready • Published on npm • v1.0.0

## Features

- 🔒 **Type-safe**: Full TypeScript support with Effect.Schema validation
- 🌐 **Multi-provider**: Unified interface for OpenRouter, HuggingFace, Anthropic, and more
- ⚡ **Effect-native**: Built on Effect.Service pattern for composability
- 📡 **Streaming support**: Real-time response streaming with effect-stream
- 🔄 **Automatic retries**: Built-in exponential backoff for transient failures
- ❌ **Precise errors**: Tagged error types with actionable recovery strategies
- 🧪 **Testable**: Mock implementations and test fixtures included

## Installation

```bash
bun add effect-models effect
```

## Quick Start

### Basic Chat Completion

```typescript
import { Effect } from "effect";
import { OpenRouterService } from "effect-models";

const program = Effect.gen(function* () {
  const service = yield* OpenRouterService;

  const response = yield* service.complete({
    model: "anthropic/claude-3-haiku",
    messages: [
      { role: "user", content: "What is TypeScript?" }
    ],
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content;
});

Effect.runPromise(program.pipe(Effect.provide(OpenRouterService.Default)));
```

### Listing Available Models

```typescript
const program = Effect.gen(function* () {
  const service = yield* OpenRouterService;
  const models = yield* service.listModels();

  for (const model of models) {
    console.log(`${model.name} - Context: ${model.contextLength}`);
  }
});
```

### Streaming Responses

```typescript
import { Stream } from "effect";

const program = Effect.gen(function* () {
  const service = yield* OpenRouterService;

  const stream = service.streamComplete({
    model: "anthropic/claude-3-haiku",
    messages: [{ role: "user", content: "Write a poem" }],
  });

  // Process each chunk as it arrives
  yield* Stream.forEach(stream, (chunk) =>
    Effect.log(chunk.delta?.text || "")
  );
});
```

## Supported Providers

### OpenRouter
Unified API for accessing multiple LLM providers (Claude, GPT-4, Llama 2, etc.)

```typescript
import { OpenRouterService } from "effect-models";

const service = yield* OpenRouterService;
const models = yield* service.listModels();
const response = yield* service.complete({ ... });
const stream = service.streamComplete({ ... });
```

### HuggingFace
Access to HuggingFace model hub

```typescript
import { HuggingFaceService } from "effect-models";
```

### Artificial Analysis
Specialized models for analysis tasks

```typescript
import { ArtificialAnalysisService } from "effect-models";
```

## Error Handling

All operations use typed, discriminated error unions:

```typescript
import { Effect } from "effect";
import {
  OpenRouterService,
  AuthenticationError,
  RateLimitError,
  ApiRequestError,
} from "effect-models";

const program = Effect.gen(function* () {
  return yield* service.complete(request).pipe(
    Effect.catchTag("AuthenticationError", (err) =>
      Effect.logError(`Auth failed: ${err.message}`)
    ),
    Effect.catchTag("RateLimitError", (err) =>
      Effect.sleep(`${err.retryAfter}ms`).pipe(
        Effect.flatMap(() => service.complete(request))
      )
    ),
    Effect.catchTag("ApiRequestError", (err) =>
      Effect.logError(`API error: ${err.message}`)
    ),
  );
});
```

### Error Types

- **AuthenticationError**: Invalid or missing credentials
- **RateLimitError**: Provider rate limit exceeded (includes retry-after)
- **ApiRequestError**: General API communication failure
- **InvalidResponseError**: Provider response doesn't match schema
- **InvalidModelError**: Requested model not available

## Advanced Patterns

### Automatic Retries with Exponential Backoff

```typescript
import { Schedule } from "effect";

const program = yield* service.complete(request).pipe(
  Effect.retry(
    Schedule.exponential("100 millis").pipe(
      Schedule.union(Schedule.recurs(3))
    )
  )
);
```

### Fallback to Alternative Model

```typescript
const program = yield* service.complete({
  model: "primary-model",
  messages,
}).pipe(
  Effect.orElse(() =>
    service.complete({
      model: "fallback-model",
      messages,
    })
  )
);
```

### Cost Estimation

```typescript
const program = Effect.gen(function* () {
  const models = yield* service.listModels();
  const gpt4 = models.find(m => m.id === "openai/gpt-4");

  if (gpt4?.pricing) {
    const promptCost = parseInt(gpt4.pricing.prompt) * (promptTokens / 1000);
    const completionCost = parseInt(gpt4.pricing.completion) * (completionTokens / 1000);
    return promptCost + completionCost;
  }
});
```

### Batch Processing

```typescript
import { Effect } from "effect";

const requests = [
  { model: "...", messages: [...] },
  { model: "...", messages: [...] },
];

const results = yield* Effect.all(
  requests.map(req => service.complete(req))
);
```

## Testing

effect-models includes test fixtures and mock implementations:

```typescript
import {
  createTestApiKey,
  mockChatCompletionFixture,
  createMockChatRequest,
} from "effect-models";

const testProgram = Effect.gen(function* () {
  const mockResponse = mockChatCompletionFixture;
  // Use in your tests...
});
```

## Architecture

effect-models follows the Hume three-layer architecture:

1. **Client Layer** (`/clients`) - Low-level HTTP communication with providers
2. **Service Layer** (`/services`) - Business logic, normalization, error handling
3. **Configuration Layer** (`/config`) - Provider credentials and settings

## Configuration

Configure providers via environment variables or explicit config:

```typescript
import { OpenRouterConfig } from "effect-models";

const config = OpenRouterConfig({
  apiKey: process.env.OPENROUTER_API_KEY || "",
  baseUrl: "https://openrouter.ai/api/v1",
  timeout: 30000,
});
```

## Performance Considerations

- Models are cached after first `listModels()` call
- Streaming responses are processed as they arrive (no buffering)
- Rate limit headers are parsed and respected automatically
- Token counts are provided in all responses for cost tracking

## Integration with Other Hume Packages

effect-models works seamlessly with other Hume packages:

```typescript
// With effect-json for schema validation
import { parse } from "effect-json";

// With effect-env for configuration
import { EnvService } from "effect-env";

// With effect-prompt for template management
import { PromptService } from "effect-prompt";
```

See `examples/` directory for complete integration examples.

## API Reference

### OpenRouterService

```typescript
interface OpenRouterServiceSchema {
  listModels(): Effect.Effect<Model[], AuthenticationError | ApiRequestError>

  complete(
    request: ChatCompletionRequest
  ): Effect.Effect<
    ChatCompletionResponse,
    ApiRequestError | AuthenticationError | RateLimitError | InvalidResponseError
  >

  streamComplete(
    request: ChatCompletionRequest
  ): Stream.Stream<
    StreamChunk,
    ApiRequestError | AuthenticationError | RateLimitError | InvalidResponseError
  >
}
```

### Model Type

```typescript
interface Model {
  readonly id: string
  readonly name: string
  readonly provider: "openrouter" | "huggingface" | "anthropic"
  readonly contextLength?: number
  readonly pricing?: {
    readonly prompt: string  // Cost per 1K tokens
    readonly completion: string  // Cost per 1K tokens
  }
}
```

## License

MIT
