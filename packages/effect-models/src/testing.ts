/**
 * Testing utilities for effect-models
 *
 * Provides test fixtures and helpers for testing code that uses effect-models
 *
 * @module testing
 */

/**
 * Mock OpenRouter API response for model listing
 */
export const mockModelsFixture = [
  {
    id: "openai/gpt-4",
    name: "OpenAI GPT-4",
    pricing: {
      prompt: "0.00003",
      completion: "0.00006",
    },
  },
  {
    id: "openai/gpt-3.5-turbo",
    name: "OpenAI GPT-3.5 Turbo",
    pricing: {
      prompt: "0.0005",
      completion: "0.0015",
    },
  },
];

/**
 * Mock OpenRouter API response for chat completion
 */
export const mockChatCompletionFixture = {
  id: "chatcmpl-test-123",
  model: "openai/gpt-4",
  choices: [
    {
      message: {
        role: "assistant",
        content: "This is a test response.",
      },
      finishReason: "stop",
    },
  ],
  usage: {
    promptTokens: 10,
    completionTokens: 5,
    totalTokens: 15,
  },
};

/**
 * Create a mock API key for testing
 *
 * @returns A test API key string
 */
export const createTestApiKey = (): string =>
  "sk-test-key-" + Math.random().toString(36).substring(7);

/**
 * Create a mock chat completion request for testing
 *
 * @param overrides - Optional properties to override defaults
 * @returns A mock chat completion request
 */
export const createMockChatRequest = (overrides?: Record<string, unknown>) => ({
  model: "openai/gpt-4",
  messages: [
    {
      role: "user",
      content: "Hello, assistant!",
    },
  ],
  temperature: 0.7,
  maxTokens: 100,
  ...overrides,
});
