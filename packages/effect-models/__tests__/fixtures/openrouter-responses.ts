/**
 * Test fixtures for OpenRouter API responses
 */

import type {
  ModelApi,
  ChatCompletionResponseApi,
  StreamChunk,
} from "../../src/schemas/openrouter.js";

/**
 * Mock OpenRouter models response
 */
export const mockModelsResponse: ModelApi[] = [
  {
    id: "openai/gpt-4",
    name: "GPT-4 (OpenAI)",
    description: "GPT-4 by OpenAI",
    context_length: 8192,
    pricing: {
      prompt: 0.03,
      completion: 0.06,
    },
  },
  {
    id: "openai/gpt-3.5-turbo",
    name: "GPT-3.5 Turbo (OpenAI)",
    description: "GPT-3.5 Turbo by OpenAI",
    context_length: 4096,
    pricing: {
      prompt: 0.0005,
      completion: 0.0015,
    },
  },
  {
    id: "anthropic/claude-3-opus",
    name: "Claude 3 Opus (Anthropic)",
    description: "Claude 3 Opus by Anthropic",
    context_length: 200000,
    pricing: {
      prompt: 0.015,
      completion: 0.075,
    },
  },
];

/**
 * Mock successful chat completion response
 */
export const mockChatCompletionResponse: ChatCompletionResponseApi = {
  id: "chatcmpl-8MxUBYOCO0T0qfGdGBu0w-NvUs3iN",
  model: "openai/gpt-4",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "Hello! I'm Claude, an AI assistant made by Anthropic.",
      },
      finish_reason: "stop",
    },
  ],
  usage: {
    prompt_tokens: 10,
    completion_tokens: 21,
    total_tokens: 31,
  },
  created: 1699564200,
};

/**
 * Mock chat completion response without usage
 */
export const mockChatCompletionResponseNoUsage: ChatCompletionResponseApi = {
  id: "chatcmpl-abc123",
  model: "openai/gpt-3.5-turbo",
  choices: [
    {
      index: 0,
      message: {
        role: "assistant",
        content: "This is a test response.",
      },
      finish_reason: "stop",
    },
  ],
  created: 1699564200,
};

/**
 * Mock chat completion response with multiple choices
 */
export const mockChatCompletionResponseMultipleChoices: ChatCompletionResponseApi =
  {
    id: "chatcmpl-multi-choice",
    model: "openai/gpt-4",
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: "First choice response.",
        },
        finish_reason: "stop",
      },
      {
        index: 1,
        message: {
          role: "assistant",
          content: "Second choice response.",
        },
        finish_reason: "stop",
      },
    ],
    usage: {
      prompt_tokens: 10,
      completion_tokens: 30,
      total_tokens: 40,
    },
    created: 1699564200,
  };

/**
 * Mock streaming chunk responses
 */
export const mockStreamChunks: StreamChunk[] = [
  {
    id: "chatcmpl-stream-1",
    model: "openai/gpt-4",
    choices: [
      {
        index: 0,
        delta: { content: "Hello" },
        finish_reason: null,
      },
    ],
  },
  {
    id: "chatcmpl-stream-1",
    model: "openai/gpt-4",
    choices: [
      {
        index: 0,
        delta: { content: " " },
        finish_reason: null,
      },
    ],
  },
  {
    id: "chatcmpl-stream-1",
    model: "openai/gpt-4",
    choices: [
      {
        index: 0,
        delta: { content: "world" },
        finish_reason: null,
      },
    ],
  },
  {
    id: "chatcmpl-stream-1",
    model: "openai/gpt-4",
    choices: [
      {
        index: 0,
        delta: { content: "!" },
        finish_reason: "stop",
      },
    ],
  },
];

/**
 * Mock error response
 */
export const mockErrorResponse = {
  error: {
    message: "Unauthorized",
    type: "invalid_request_error",
    code: "invalid_api_key",
  },
};

/**
 * Mock rate limit response
 */
export const mockRateLimitResponse = {
  error: {
    message: "Rate limit exceeded",
    type: "rate_limit_error",
  },
};
