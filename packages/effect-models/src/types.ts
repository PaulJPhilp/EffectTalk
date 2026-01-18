/**
 * Core types for effect-models package
 */

/**
 * Model provider identifier
 */
export type ModelProvider =
  | "openrouter"
  | "huggingface"
  | "artificial-analysis"
  | "anthropic"
  | "openai";

/**
 * Base model configuration
 */
export type ModelConfig = {
  readonly provider: ModelProvider;
  readonly modelId: string;
  readonly apiKey?: string;
};

/**
 * Model metadata
 */
export type Model = {
  readonly id: string;
  readonly name: string;
  readonly provider: ModelProvider;
  readonly contextLength?: number;
  readonly pricing?: {
    readonly prompt: number;
    readonly completion: number;
  };
};

/**
 * Chat message role
 */
export type MessageRole = "system" | "user" | "assistant";

/**
 * Chat message
 */
export type ChatMessage = {
  readonly role: MessageRole;
  readonly content: string;
};

/**
 * Chat completion request
 */
export type ChatCompletionRequest = {
  readonly model: string;
  readonly messages: readonly ChatMessage[];
  readonly temperature?: number;
  readonly maxTokens?: number;
  readonly stream?: boolean;
};

/**
 * Chat completion response
 */
export type ChatCompletionResponse = {
  readonly id: string;
  readonly model: string;
  readonly choices: readonly {
    readonly message: ChatMessage;
    readonly finishReason: string;
  }[];
  readonly usage?: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };
};
