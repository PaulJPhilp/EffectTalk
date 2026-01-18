/**
 * effect-models - Type-safe, Effect-native services for LLM model providers
 *
 * @packageDocumentation
 */

// Services (Dependency Injection)
export {
  OpenRouterService,
  type OpenRouterServiceSchema,
} from "./services/index.js";

// Configuration
export * from "./config/index.js";

// Types and Schemas
export type {
  Model,
  ChatCompletionRequest,
  ChatCompletionResponse,
  ChatMessage,
} from "./types.js";

export * from "./schemas/index.js";

// Errors
export {
  AuthenticationError,
  RateLimitError,
  ApiRequestError,
  InvalidResponseError,
} from "./errors.js";

// Testing utilities
export {
  mockModelsFixture,
  mockChatCompletionFixture,
  createTestApiKey,
  createMockChatRequest,
} from "./testing.js";

// HTTP Clients (for advanced usage)
export { OpenRouterClient } from "./clients/index.js";

// Utilities (for advanced usage)
export * from "./utils/index.js";
