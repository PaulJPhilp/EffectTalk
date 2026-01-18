# effect-prompt

**Part of the [Hume monorepo](../README.md)** - Type-safe AI prompt management system with templating, validation, and composition.

[![Status: Beta](https://img.shields.io/badge/Status-Beta-blue.svg)](https://github.com/PaulJPhilp/trinity-hume)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Effect 3.x](https://img.shields.io/badge/Effect-3.x-blueviolet.svg)](https://effect.website)

## Overview

`effect-prompt` is a comprehensive prompt management library built on top of `effect-liquid`. It provides:

- **Schema-based variable validation** - Validate prompt variables using Effect Schema
- **Template composition & inheritance** - Inherit from parent templates via `{% extends %}` tags
- **AI-specific filters** - Token counting, sanitization, conversation formatting
- **Prompt versioning** - Track versions with metadata
- **File-based storage** - Load/save prompts as `.liquid` files with `.meta.json` metadata
- **Type-safe API** - Full TypeScript support with discriminated union errors

## Installation

```bash
bun add effect-prompt
```

## Quick Start

### Basic Rendering

```typescript
import { Effect } from "effect"
import { renderPrompt } from "effect-prompt"

const program = Effect.gen(function* () {
  const result = yield* renderPrompt("greeting", {
    name: "Alice",
  })
  console.log(result.content) // "Hello Alice!"
  console.log(result.metadata.tokenCount) // ~2
})

Effect.runSync(program)
```

### Variable Validation

```typescript
import { Effect, Schema } from "effect"
import { validateVariables, CommonVariableSchemas } from "effect-prompt"

const userSchema = Schema.Struct({
  name: CommonVariableSchemas.text,
  email: CommonVariableSchemas.email,
  age: CommonVariableSchemas.number(0, 150),
})

const program = Effect.gen(function* () {
  const validated = yield* validateVariables("user-profile", {
    name: "Alice",
    email: "alice@example.com",
    age: 30,
  })

  if (validated.validationResult.valid) {
    console.log("Variables are valid!")
  }
})

Effect.runSync(program)
```

### Conversation Rendering

```typescript
import { Effect } from "effect"
import { renderConversation } from "effect-prompt"

const conversation = {
  id: "conv-1",
  messages: [
    { role: "system" as const, content: "You are a helpful assistant" },
    { role: "user" as const, content: "What is 2+2?" },
    { role: "assistant" as const, content: "4" },
  ],
  metadata: {
    created: new Date(),
    updated: new Date(),
  },
}

const program = Effect.gen(function* () {
  // Format as OpenAI chat format
  const openai = yield* renderConversation(conversation, "openai")

  // Or Anthropic format
  const anthropic = yield* renderConversation(conversation, "anthropic")

  // Or plain text
  const plain = yield* renderConversation(conversation, "plain")
})

Effect.runSync(program)
```

### Template Composition

Create a parent template (`prompts/base.liquid`):

```liquid
System prompt: {{ system_instruction }}

{% block additional_context %}
Default context here.
{% endblock %}

User query: {{ user_query }}
```

Create a child template (`prompts/custom.liquid`):

```liquid
{% extends "base" %}

{% block additional_context %}
You are an expert in {{ domain }}.
Provide detailed, accurate responses.
{% endblock %}
```

Render with inheritance:

```typescript
const result = yield* renderPrompt("custom", {
  system_instruction: "Be helpful and accurate",
  domain: "software engineering",
  user_query: "How do I use Effect?",
})
```

## Storage Format

Prompts are stored as files in a directory (default: `./prompts/`):

```
prompts/
├── greeting.liquid           # Template content
├── greeting.meta.json        # Metadata (version, tags, author, etc.)
├── base.liquid
└── base.meta.json
```

Metadata file example (`greeting.meta.json`):

```json
{
  "name": "Greeting Prompt",
  "description": "A simple greeting template",
  "version": "1.0.0",
  "created": "2024-12-21T10:00:00Z",
  "updated": "2024-12-21T10:00:00Z",
  "tags": ["greeting", "production"],
  "author": "user@example.com",
  "maxTokens": 100
}
```

## AI-Specific Filters

### tokenCount

Count approximate tokens in text:

```liquid
{% assign tokens = content | tokenCount %}
```

### sanitize

Remove control characters and normalize whitespace:

```liquid
{{ raw_input | sanitize }}
```

### truncateToTokens

Truncate text to a token budget:

```liquid
{{ long_text | truncateToTokens: 1000 }}
```

### stripMarkdown

Convert markdown to plain text:

```liquid
{{ markdown_content | stripMarkdown }}
```

### toNumberedList / toBulletedList

Convert arrays to formatted lists:

```liquid
{{ items | toNumberedList }}
{{ items | toBulletedList }}
{{ items | toBulletedList: "*" }}
```

### formatConversation

Format conversation messages:

```liquid
{{ messages | formatConversation: "openai" }}
{{ messages | formatConversation: "anthropic" }}
{{ messages | formatConversation: "plain" }}
```

## Configuration

Configure via environment variables:

```bash
# Prompts directory (default: ./prompts)
PROMPTS_DIR=/path/to/prompts

# Default max tokens (default: 4000)
DEFAULT_MAX_TOKENS=2000

# Enable caching (default: true)
ENABLE_PROMPT_CACHING=true

# Cache TTL in seconds (default: 3600)
PROMPT_CACHE_TTL=7200
```

## Error Handling

All errors use discriminated unions via `catchTag`:

```typescript
import { Effect } from "effect"
import { PromptNotFoundError, TokenLimitExceededError } from "effect-prompt"

const program = renderPrompt("prompt-id", variables).pipe(
  Effect.catchTag("PromptNotFoundError", (err) => {
    console.error(`Prompt not found: ${err.promptId}`)
    return Effect.succeed(fallbackPrompt)
  }),
  Effect.catchTag("TokenLimitExceededError", (err) => {
    console.error(`Token limit exceeded: ${err.actual} > ${err.limit}`)
    return Effect.succeed(truncatedPrompt)
  })
)
```

## Error Types

- `PromptNotFoundError` - Prompt template not found
- `VariableValidationError` - Variable validation failed
- `PromptRenderError` - Rendering failed
- `TokenLimitExceededError` - Token limit exceeded
- `StorageError` - File storage operation failed
- `InheritanceError` - Template inheritance failed

## Advanced Usage

### Custom Filters

```typescript
import { Effect } from "effect"
import { PromptService, LiquidService } from "effect-prompt"
import { LiquidFilterError } from "effect-liquid"

const program = Effect.gen(function* () {
  const liquid = yield* LiquidService

  // Register custom filter
  yield* liquid.registerFilter("uppercase", (input) =>
    Effect.succeed(String(input).toUpperCase())
  )

  // Now use it in templates: {{ name | uppercase }}
})
```

### Custom Tags

```typescript
import { Effect } from "effect"
import { LiquidService } from "effect-prompt"

const program = Effect.gen(function* () {
  const liquid = yield* LiquidService

  // Register custom tag
  yield* liquid.registerTag("repeat", (args, body, context, render) =>
    Effect.gen(function* () {
      const count = Number(args[0]) || 1
      let result = ""
      for (let i = 0; i < count; i++) {
        result += yield* render(body, context)
      }
      return result
    })
  )

  // Now use it: {% repeat 3 %}Hello {% endrepeat %}
})
```

## Service API

### PromptService

```typescript
// Render a prompt
renderPrompt(promptId: string, variables: Record<string, unknown>)
  : Effect<RenderedPrompt, PromptRenderError | TokenLimitExceededError>

// Validate variables
validateVariables(promptId: string, variables: Record<string, unknown>)
  : Effect<ValidatedPrompt, Error>

// Render conversation
renderConversation(conversation: Conversation, format?: "openai" | "anthropic" | "plain")
  : Effect<string, Error>
```

### PromptStorageService

```typescript
// Load prompt from storage
load(promptId: string): Effect<PromptTemplate, PromptNotFoundError | StorageError>

// Save prompt to storage
save(template: PromptTemplate): Effect<void, StorageError>

// List prompts with optional filters
list(options?: QueryOptions): Effect<readonly PromptTemplate[], StorageError>

// Delete prompt
delete(promptId: string): Effect<void, PromptNotFoundError | StorageError>
```

### ValidationService

```typescript
// Validate variables against schema
validate(variables: unknown, schema: Schema<unknown>)
  : Effect<ValidationResult, never>
```

## Philosophy

`effect-prompt` follows the Hume philosophy:

1. **Empiricism** - All knowledge comes from data. Validate everything.
2. **Skepticism** - Nothing is taken on faith. All errors are explicit and typed.
3. **Causality** - Effects are clearly linked to causes. Error handling is first-class.

## Architecture

The package is organized in three layers:

1. **Config Layer** - Environment-based configuration
2. **Storage & Validation Layer** - File operations and schema validation
3. **Service Layer** - Business logic orchestration

All layers use Effect's service pattern with type-safe error handling.

## License

MIT
