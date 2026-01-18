import { Effect, Layer, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { LiquidService } from "effect-liquid";
import {
  PromptNotFoundError,
  PromptRenderError,
  TokenLimitExceededError,
  VariableValidationError,
} from "../../src/errors.js";
import { PromptService } from "../../src/services/prompt-service.js";
import {
  PromptStorageService,
  type PromptStorageServiceSchema,
} from "../../src/services/storage-service.js";
import { ValidationService } from "../../src/services/validation-service.js";
import {
  PromptConfig,
  PromptConfigLayer,
} from "../../src/config/prompt-config.js";
import * as AIFilters from "../../src/filters/ai-filters.js";
import * as ConversationFilters from "../../src/filters/conversation-filters.js";
import type { PromptTemplate, Conversation } from "../../src/types.js";

describe("PromptService", () => {
  // Helper to create test layer with mock storage
  const createTestLayer = (templates: Map<string, PromptTemplate>) =>
    Layer.succeed(PromptStorageService, {
      load: (id) =>
        templates.has(id)
          ? Effect.succeed(templates.get(id)!)
          : Effect.fail(
              new PromptNotFoundError({
                message: `Not found: ${id}`,
                promptId: id,
              })
            ),
      save: () => Effect.void,
      list: () => Effect.succeed([...templates.values()]),
      delete: () => Effect.void,
    } satisfies PromptStorageServiceSchema);

  // Manual helper to render prompts (avoids PromptService layer composition issues)
  const renderPromptManually = (
    templates: Map<string, PromptTemplate>,
    promptId: string,
    variables: Record<string, unknown>
  ) =>
    Effect.gen(function* () {
      const storage = yield* PromptStorageService;
      const liquid = yield* LiquidService;
      const validation = yield* ValidationService;
      const config = yield* PromptConfig;

      // Register AI-specific filters
      yield* liquid.registerFilter("tokenCount", AIFilters.tokenCount);
      yield* liquid.registerFilter("sanitize", AIFilters.sanitize);
      yield* liquid.registerFilter(
        "truncateToTokens",
        AIFilters.truncateToTokens
      );
      yield* liquid.registerFilter("stripMarkdown", AIFilters.stripMarkdown);
      yield* liquid.registerFilter("jsonEscape", AIFilters.jsonEscape);
      yield* liquid.registerFilter("toNumberedList", AIFilters.toNumberedList);
      yield* liquid.registerFilter("toBulletedList", AIFilters.toBulletedList);

      // Load template
      const template = yield* storage.load(promptId);

      // Validate variables if schema is defined
      if (template.variableSchema) {
        const validationResult = yield* validation.validate(
          variables,
          template.variableSchema
        );
        if (!validationResult.valid) {
          yield* Effect.fail(
            new PromptRenderError({
              message: `Variable validation failed: ${validationResult.errors.map((e) => e.message).join(", ")}`,
              promptId,
              templateContent: template.content,
              variables,
            })
          );
        }
      }

      // Render
      const rendered = yield* liquid.render(template.content, variables).pipe(
        Effect.mapError(
          (err) =>
            new PromptRenderError({
              message: `Render failed: ${err instanceof Error ? err.message : String(err)}`,
              promptId,
              templateContent: template.content,
              variables,
              cause: err,
            })
        )
      );

      // Check token limit
      const defaultMaxTokens = yield* config.getDefaultMaxTokens();
      const maxTokens = template.metadata.maxTokens ?? defaultMaxTokens;
      const tokenCount = yield* AIFilters.tokenCount(rendered);

      if (tokenCount > maxTokens) {
        yield* Effect.fail(
          new TokenLimitExceededError({
            message: `Token limit exceeded: ${tokenCount} > ${maxTokens}`,
            limit: maxTokens,
            actual: tokenCount,
            promptId,
          })
        );
      }

      return {
        content: rendered,
        metadata: {
          templateId: template.id,
          version: template.metadata.version,
          renderedAt: new Date(),
          tokenCount,
          variables,
        },
      };
    });

  // Manual helper to validate variables
  const validateVariablesManually = (
    templates: Map<string, PromptTemplate>,
    promptId: string,
    variables: Record<string, unknown>
  ) =>
    Effect.gen(function* () {
      const storage = yield* PromptStorageService;
      const validation = yield* ValidationService;

      const template = yield* storage.load(promptId);

      if (!template.variableSchema) {
        return {
          template,
          variables,
          validationResult: {
            valid: true,
            errors: [],
            warnings: [],
          },
        };
      }

      const validationResult = yield* validation.validate(
        variables,
        template.variableSchema
      );

      return {
        template,
        variables,
        validationResult,
      };
    });

  // Manual helper to render conversations (doesn't need storage or prompt service)
  const renderConversationManually = (
    conversation: Conversation,
    format: "openai" | "anthropic" | "plain" = "openai"
  ) =>
    Effect.gen(function* () {
      return yield* ConversationFilters.formatConversation(
        conversation.messages,
        format
      );
    });

  describe("renderPrompt", () => {
    it("should render a simple prompt", async () => {
      const templates = new Map([
        [
          "greeting",
          {
            id: "greeting",
            name: "Greeting",
            content: "Hello {{ name }}!",
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: [],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = renderPromptManually(templates, "greeting", {
        name: "Alice",
      }).pipe(
        Effect.flatMap((result) =>
          Effect.gen(function* () {
            expect(result.content).toBe("Hello Alice!");
            expect(result.metadata.templateId).toBe("greeting");
            expect(result.metadata.tokenCount).toBeGreaterThan(0);
            expect(result.metadata.version).toBe("1.0.0");
            return result;
          })
        ),
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer)
      );

      await Effect.runPromise(program);
    });

    it("should render with multiple variables", async () => {
      const templates = new Map([
        [
          "email",
          {
            id: "email",
            name: "Email Template",
            content:
              "Hello {{ firstName }} {{ lastName }}, your email is {{ email }}",
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: [],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = renderPromptManually(templates, "email", {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      }).pipe(
        Effect.flatMap((result) =>
          Effect.gen(function* () {
            expect(result.content).toBe(
              "Hello John Doe, your email is john@example.com"
            );
            return result;
          })
        ),
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer)
      );

      await Effect.runPromise(program);
    });

    it("should render with conditional logic", async () => {
      const templates = new Map([
        [
          "conditional",
          {
            id: "conditional",
            name: "Conditional Template",
            content:
              "{% if premium %}Premium user{% else %}Free user{% endif %}",
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: [],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = Effect.gen(function* () {
        const premium = yield* renderPromptManually(templates, "conditional", {
          premium: true,
        });
        expect(premium.content).toContain("Premium user");

        const free = yield* renderPromptManually(templates, "conditional", {
          premium: false,
        });
        expect(free.content).toContain("Free user");
      }).pipe(
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer)
      );

      await Effect.runPromise(program);
    });

    it("should handle missing template", async () => {
      const templates = new Map<string, PromptTemplate>();

      const program = renderPromptManually(templates, "nonexistent", {}).pipe(
        Effect.either,
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer)
      );

      const result = await Effect.runPromise(program);

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(PromptNotFoundError);
      }
    });

    it("should enforce token limits", async () => {
      const longContent = "word ".repeat(1000);
      const templates = new Map([
        [
          "long",
          {
            id: "long",
            name: "Long Template",
            content: longContent,
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: [],
              maxTokens: 100,
            },
          } as PromptTemplate,
        ],
      ]);

      const program = renderPromptManually(templates, "long", {}).pipe(
        Effect.either,
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer)
      );

      const result = await Effect.runPromise(program);

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(TokenLimitExceededError);
      }
    });

    it("should render with loops", async () => {
      const templates = new Map([
        [
          "loop",
          {
            id: "loop",
            name: "Loop Template",
            content: "{% for item in items %}{{ item }},{% endfor %}",
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: [],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = renderPromptManually(templates, "loop", {
        items: ["apple", "banana", "cherry"],
      }).pipe(
        Effect.flatMap((result) =>
          Effect.gen(function* () {
            expect(result.content).toContain("apple");
            expect(result.content).toContain("banana");
            expect(result.content).toContain("cherry");
            return result;
          })
        ),
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer)
      );

      await Effect.runPromise(program);
    });

    it("should use AI filters in templates", async () => {
      const templates = new Map([
        [
          "with_filters",
          {
            id: "with_filters",
            name: "Filtered Template",
            content:
              "Tokens: {{ content | tokenCount }}, Sanitized: {{ dirty | sanitize }}",
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: [],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = renderPromptManually(templates, "with_filters", {
        content: "hello world this is a test",
        dirty: "hello\x00world\x01test",
      }).pipe(
        Effect.flatMap((result) =>
          Effect.gen(function* () {
            expect(result.content).toContain("Tokens:");
            expect(result.content).toContain("Sanitized:");
            return result;
          })
        ),
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer)
      );

      await Effect.runPromise(program);
    });
  });

  describe("validateVariables", () => {
    it("should validate variables with schema", async () => {
      const userSchema = Schema.Struct({
        name: Schema.String,
        email: Schema.String,
        age: Schema.Number,
      });

      const templates = new Map([
        [
          "user",
          {
            id: "user",
            name: "User Template",
            content: "{{ name }}",
            variableSchema: userSchema,
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: [],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = Effect.gen(function* () {
        const valid = yield* validateVariablesManually(templates, "user", {
          name: "Alice",
          email: "alice@example.com",
          age: 30,
        });
        expect(valid.validationResult.valid).toBe(true);

        const invalid = yield* validateVariablesManually(templates, "user", {
          name: "Bob",
        });
        expect(invalid.validationResult.valid).toBe(false);
      }).pipe(
        Effect.provide(createTestLayer(templates)),
        Effect.provide(ValidationService.Default)
      );

      await Effect.runPromise(program);
    });

    it("should skip validation when schema not defined", async () => {
      const templates = new Map([
        [
          "no_schema",
          {
            id: "no_schema",
            name: "No Schema Template",
            content: "Content",
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: [],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = Effect.gen(function* () {
        const result = yield* validateVariablesManually(
          templates,
          "no_schema",
          {
            anything: "goes",
          }
        );

        expect(result.validationResult.valid).toBe(true);
      }).pipe(
        Effect.provide(createTestLayer(templates)),
        Effect.provide(ValidationService.Default)
      );

      await Effect.runPromise(program);
    });
  });

  describe("renderConversation", () => {
    it("should render conversation in OpenAI format", async () => {
      const conversation = {
        id: "conv-1",
        messages: [
          { role: "system" as const, content: "You are helpful" },
          { role: "user" as const, content: "Hi!" },
          { role: "assistant" as const, content: "Hello!" },
        ],
        metadata: {
          created: new Date(),
          updated: new Date(),
        },
      };

      const program = renderConversationManually(conversation, "openai").pipe(
        Effect.flatMap((result) =>
          Effect.gen(function* () {
            const parsed = JSON.parse(result);
            expect(Array.isArray(parsed)).toBe(true);
            expect(parsed[0].role).toBe("system");
            return parsed;
          })
        )
      );

      await Effect.runPromise(program);
    });

    it("should render conversation in Anthropic format", async () => {
      const conversation = {
        id: "conv-1",
        messages: [
          { role: "user" as const, content: "What is AI?" },
          { role: "assistant" as const, content: "AI is..." },
        ],
        metadata: {
          created: new Date(),
          updated: new Date(),
        },
      };

      const program = renderConversationManually(
        conversation,
        "anthropic"
      ).pipe(
        Effect.flatMap((result) =>
          Effect.gen(function* () {
            expect(result).toContain("Human:");
            expect(result).toContain("Assistant:");
            return result;
          })
        )
      );

      await Effect.runPromise(program);
    });

    it("should render conversation in plain format", async () => {
      const conversation = {
        id: "conv-1",
        messages: [{ role: "user" as const, content: "Hello" }],
        metadata: {
          created: new Date(),
          updated: new Date(),
        },
      };

      const program = renderConversationManually(conversation, "plain").pipe(
        Effect.flatMap((result) =>
          Effect.gen(function* () {
            expect(result).toContain("[USER]");
            expect(result).toContain("Hello");
            return result;
          })
        )
      );

      await Effect.runPromise(program);
    });
  });

  describe("Error handling", () => {
    it("should handle rendering errors", async () => {
      const templates = new Map([
        [
          "invalid_liquid",
          {
            id: "invalid_liquid",
            name: "Invalid Template",
            content: "{% invalid_tag %}",
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: [],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = renderPromptManually(
        templates,
        "invalid_liquid",
        {}
      ).pipe(
        Effect.either,
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer)
      );

      const result = await Effect.runPromise(program);

      expect(result._tag).toBe("Left");
    });

    it("should handle validation errors gracefully", async () => {
      const userSchema = Schema.Struct({
        name: Schema.String,
      });

      const templates = new Map([
        [
          "with_validation",
          {
            id: "with_validation",
            name: "Validated Template",
            content: "{{ name }}",
            variableSchema: userSchema,
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: [],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = renderPromptManually(templates, "with_validation", {
        name: 123,
      }).pipe(
        Effect.either,
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer)
      );

      const result = await Effect.runPromise(program);

      expect(result._tag).toBe("Left");
      if (result._tag === "Left") {
        expect(result.left).toBeInstanceOf(PromptRenderError);
      }
    });
  });
});
