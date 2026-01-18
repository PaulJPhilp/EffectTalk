/**
 * Span naming convention: {package}.{layer}.{operation}
 * Used for naming spans in OpenTelemetry tracing.
 */
export const SPANS = {
  // LLM Operations
  LLM_COMPLETE: "llm.complete",
  LLM_STREAM: "llm.stream",
  LLM_EMBED: "llm.embed",

  // Prompt Operations
  PROMPT_RENDER: "prompt.render",
  PROMPT_VALIDATE: "prompt.validate",

  // Parse Operations
  JSON_PARSE: "json.parse",
  JSON_STRINGIFY: "json.stringify",
  YAML_PARSE: "yaml.parse",

  // Generic
  HTTP_REQUEST: (method: string) => `http.${method.toLowerCase()}`,
} as const

/**
 * Attribute naming convention: {namespace}.{attribute_name}
 * Used for naming span attributes in OpenTelemetry.
 */
export const ATTRIBUTES = {
  // LLM Attributes
  LLM_MODEL: "llm.model",
  LLM_PROVIDER: "llm.provider",
  LLM_PROMPT_TOKENS: "llm.prompt_tokens",
  LLM_COMPLETION_TOKENS: "llm.completion_tokens",
  LLM_TOTAL_TOKENS: "llm.total_tokens",
  LLM_TEMPERATURE: "llm.temperature",
  LLM_MAX_TOKENS: "llm.max_tokens",
  LLM_FINISH_REASON: "llm.finish_reason",

  // Request Attributes
  REQUEST_ID: "request.id",
  REQUEST_DURATION_MS: "request.duration_ms",

  // Error Attributes
  ERROR_TYPE: "error.type",
  ERROR_MESSAGE: "error.message",
  ERROR_STACK: "error.stack",
} as const
