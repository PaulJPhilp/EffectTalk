/**
 * Unit tests for OpenRouter schemas
 */

import { Schema } from "effect";
import { describe, it, expect } from "vitest";
import {
  MessageSchema,
  ChatCompletionRequestSchema,
  ChatCompletionResponseSchema,
  ModelSchema,
} from "../../src/schemas/openrouter.js";

describe("OpenRouter Schemas", () => {
  describe("MessageSchema", () => {
    it("should validate valid message", async () => {
      const message = {
        role: "user" as const,
        content: "Hello, world!",
      };

      const result = Schema.decodeUnknownSync(MessageSchema)(message);

      expect(result).toEqual(message);
    });

    it("should reject invalid role", () => {
      const message = {
        role: "invalid",
        content: "Hello, world!",
      };

      expect(() => Schema.decodeUnknownSync(MessageSchema)(message)).toThrow();
    });

    it("should reject missing content", () => {
      const message = {
        role: "user",
      };

      expect(() => Schema.decodeUnknownSync(MessageSchema)(message)).toThrow();
    });
  });

  describe("ChatCompletionRequestSchema", () => {
    it("should validate minimal valid request", async () => {
      const request = {
        model: "gpt-4",
        messages: [
          {
            role: "user" as const,
            content: "Hello",
          },
        ],
      };

      const result = Schema.decodeUnknownSync(ChatCompletionRequestSchema)(
        request
      );

      expect(result.model).toBe("gpt-4");
      expect(result.messages).toHaveLength(1);
    });

    it("should validate request with optional fields", async () => {
      const request = {
        model: "gpt-4",
        messages: [
          {
            role: "user" as const,
            content: "Hello",
          },
        ],
        temperature: 0.7,
        max_tokens: 100,
        stream: false,
      };

      const result = Schema.decodeUnknownSync(ChatCompletionRequestSchema)(
        request
      );

      expect(result.temperature).toBe(0.7);
      expect(result.max_tokens).toBe(100);
      expect(result.stream).toBe(false);
    });

    it("should reject request without model", () => {
      const request = {
        messages: [
          {
            role: "user",
            content: "Hello",
          },
        ],
      };

      expect(() =>
        Schema.decodeUnknownSync(ChatCompletionRequestSchema)(request)
      ).toThrow();
    });

    it("should reject request without messages", () => {
      const request = {
        model: "gpt-4",
      };

      expect(() =>
        Schema.decodeUnknownSync(ChatCompletionRequestSchema)(request)
      ).toThrow();
    });
  });

  describe("ChatCompletionResponseSchema", () => {
    it("should validate valid response", async () => {
      const response = {
        id: "chatcmpl-123",
        model: "gpt-4",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant" as const,
              content: "Hello! How can I help?",
            },
            finish_reason: "stop",
          },
        ],
      };

      const result = Schema.decodeUnknownSync(ChatCompletionResponseSchema)(
        response
      );

      expect(result.id).toBe("chatcmpl-123");
      expect(result.choices).toHaveLength(1);
    });

    it("should validate response with usage", async () => {
      const response = {
        id: "chatcmpl-123",
        model: "gpt-4",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant" as const,
              content: "Hello!",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
      };

      const result = Schema.decodeUnknownSync(ChatCompletionResponseSchema)(
        response
      );

      expect(result.usage?.prompt_tokens).toBe(10);
      expect(result.usage?.total_tokens).toBe(15);
    });

    it("should validate response with multiple choices", async () => {
      const response = {
        id: "chatcmpl-123",
        model: "gpt-4",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant" as const,
              content: "First choice",
            },
            finish_reason: "stop",
          },
          {
            index: 1,
            message: {
              role: "assistant" as const,
              content: "Second choice",
            },
            finish_reason: "stop",
          },
        ],
      };

      const result = Schema.decodeUnknownSync(ChatCompletionResponseSchema)(
        response
      );

      expect(result.choices).toHaveLength(2);
    });

    it("should reject response without id", () => {
      const response = {
        model: "gpt-4",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Hello!",
            },
            finish_reason: "stop",
          },
        ],
      };

      expect(() =>
        Schema.decodeUnknownSync(ChatCompletionResponseSchema)(response)
      ).toThrow();
    });
  });

  describe("ModelSchema", () => {
    it("should validate minimal valid model", async () => {
      const model = {
        id: "gpt-4",
        name: "GPT-4",
      };

      const result = Schema.decodeUnknownSync(ModelSchema)(model);

      expect(result.id).toBe("gpt-4");
      expect(result.name).toBe("GPT-4");
    });

    it("should validate model with all fields", async () => {
      const model = {
        id: "gpt-4",
        name: "GPT-4",
        description: "Latest GPT-4 model",
        context_length: 8192,
        pricing: {
          prompt: 0.03,
          completion: 0.06,
        },
      };

      const result = Schema.decodeUnknownSync(ModelSchema)(model);

      expect(result.id).toBe("gpt-4");
      expect(result.context_length).toBe(8192);
      expect(result.pricing?.prompt).toBe(0.03);
    });

    it("should validate model without optional fields", async () => {
      const model = {
        id: "custom-model",
        name: "Custom Model",
        // No context_length, pricing, etc.
      };

      const result = Schema.decodeUnknownSync(ModelSchema)(model);

      expect(result.id).toBe("custom-model");
      expect(result.context_length).toBeUndefined();
      expect(result.pricing).toBeUndefined();
    });

    it("should reject model without name", () => {
      const model = {
        id: "gpt-4",
      };

      expect(() => Schema.decodeUnknownSync(ModelSchema)(model)).toThrow();
    });
  });
});
