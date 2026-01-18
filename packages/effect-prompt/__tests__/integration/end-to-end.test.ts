import { Effect, Layer, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { LiquidService } from "effect-liquid";
import {
  CommonVariableSchemas,
  PromptTemplateSchema,
} from "../../src/schemas.js";
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

describe("End-to-End Integration Tests", () => {
  // Helper to create test layer with mock storage
  const createTestLayer = (templates: Map<string, PromptTemplate>) =>
    Layer.succeed(PromptStorageService, {
      load: (id) =>
        templates.has(id)
          ? Effect.succeed(templates.get(id)!)
          : Effect.fail(new Error(`Prompt not found: ${id}`)),
      save: () => Effect.void,
      list: () => Effect.succeed([...templates.values()]),
      delete: () => Effect.void,
    } satisfies PromptStorageServiceSchema);

  // Complete manual helper to render prompts with all features
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
            new Error(
              `Variable validation failed: ${validationResult.errors.map((e) => e.message).join(", ")}`
            )
          );
        }
      }

      // Render
      const rendered = yield* liquid.render(template.content, variables);

      // Check token limit
      const defaultMaxTokens = yield* config.getDefaultMaxTokens();
      const maxTokens = template.metadata.maxTokens ?? defaultMaxTokens;
      const tokenCount = yield* AIFilters.tokenCount(rendered);

      if (tokenCount > maxTokens) {
        yield* Effect.fail(
          new Error(`Token limit exceeded: ${tokenCount} > ${maxTokens}`)
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

  // Manual helper to render conversations
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

  describe("Simple prompt rendering workflow", () => {
    it("should handle a complete greeting flow", async () => {
      const templates = new Map([
        [
          "greeting",
          {
            id: "greeting",
            name: "Simple Greeting",
            content: "Hello {{ name }}, welcome!",
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: ["greeting", "simple"],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = renderPromptManually(templates, "greeting", {
        name: "Alice",
      }).pipe(
        Effect.flatMap((result) =>
          Effect.gen(function* () {
            // Verify the output
            expect(result.content).toBe("Hello Alice, welcome!");
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

      const result = await Effect.runPromise(program);
      expect(result.content).toBe("Hello Alice, welcome!");
    });
  });

  describe("Advanced template workflow", () => {
    it("should handle complex template with conditionals and loops", async () => {
      const templates = new Map([
        [
          "report",
          {
            id: "report",
            name: "Report Template",
            content: `
Report for {{ name }}
{% if isPremium %}
Status: Premium Member
{% endif %}
Items:
{% for item in items %}
  - {{ item }}
{% endfor %}
Total: {{ items | size }} items
`.trim(),
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: ["report"],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = renderPromptManually(templates, "report", {
        name: "Alice",
        isPremium: true,
        items: ["Item 1", "Item 2", "Item 3"],
      }).pipe(
        Effect.flatMap((result) =>
          Effect.gen(function* () {
            expect(result.content).toContain("Report for Alice");
            expect(result.content).toContain("Status: Premium Member");
            expect(result.content).toContain("Item 1");
            expect(result.content).toContain("Item 2");
            expect(result.content).toContain("Item 3");
            expect(result.content).toContain("Total: 3 items");

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

  describe("Variable validation workflow", () => {
    it("should validate and render with schema", async () => {
      const userSchema = Schema.Struct({
        username: CommonVariableSchemas.text,
        email: CommonVariableSchemas.email,
        age: CommonVariableSchemas.number(0, 150),
      });

      const templates = new Map([
        [
          "user_profile",
          {
            id: "user_profile",
            name: "User Profile",
            content: `
User: {{ username }}
Email: {{ email }}
Age: {{ age }}
`.trim(),
            variableSchema: userSchema,
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: ["user", "profile"],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = Effect.gen(function* () {
        // First validate the variables
        const validated = yield* validateVariablesManually(
          templates,
          "user_profile",
          {
            username: "alice",
            email: "alice@example.com",
            age: 30,
          }
        );

        expect(validated.validationResult.valid).toBe(true);

        // Then render with valid variables
        const result = yield* renderPromptManually(templates, "user_profile", {
          username: "alice",
          email: "alice@example.com",
          age: 30,
        });

        expect(result.content).toContain("User: alice");
        expect(result.content).toContain("Email: alice@example.com");
        expect(result.content).toContain("Age: 30");

        return result;
      }).pipe(
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer)
      );

      await Effect.runPromise(program);
    });

    it("should fail on invalid variables", async () => {
      const userSchema = Schema.Struct({
        username: CommonVariableSchemas.text,
        email: CommonVariableSchemas.email,
      });

      const templates = new Map([
        [
          "user_profile",
          {
            id: "user_profile",
            name: "User Profile",
            content: "User: {{ username }}",
            variableSchema: userSchema,
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: ["user"],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = renderPromptManually(templates, "user_profile", {
        username: "alice",
        email: "invalid-email",
      }).pipe(
        Effect.either,
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer)
      );

      const result = await Effect.runPromise(program);
      expect(result._tag).toBe("Left");
    });
  });

  describe("Conversation rendering workflow", () => {
    it("should handle multi-format conversation rendering", async () => {
      const conversation = {
        id: "conversation",
        messages: [
          { role: "system" as const, content: "You are a helpful assistant." },
          { role: "user" as const, content: "What is 2+2?" },
          { role: "assistant" as const, content: "2+2 equals 4." },
          { role: "user" as const, content: "What about 3+3?" },
          { role: "assistant" as const, content: "3+3 equals 6." },
        ],
        metadata: {
          created: new Date(),
          updated: new Date(),
          totalTokens: 50,
          model: "gpt-4",
        },
      };

      const program = Effect.gen(function* () {
        // Render in OpenAI format
        const openai = yield* renderConversationManually(
          conversation,
          "openai"
        );
        const parsed = JSON.parse(openai);
        expect(Array.isArray(parsed)).toBe(true);
        expect(parsed).toHaveLength(5);
        expect(parsed[0].role).toBe("system");

        // Render in Anthropic format
        const anthropic = yield* renderConversationManually(
          conversation,
          "anthropic"
        );
        expect(anthropic).toContain("Human:");
        expect(anthropic).toContain("Assistant:");

        // Render in plain format
        const plain = yield* renderConversationManually(conversation, "plain");
        expect(plain).toContain("[SYSTEM]");
        expect(plain).toContain("[USER]");
        expect(plain).toContain("[ASSISTANT]");

        return { openai: parsed, anthropic, plain };
      });

      const result = await Effect.runPromise(program);
      expect(result.openai).toBeDefined();
      expect(result.anthropic).toBeDefined();
      expect(result.plain).toBeDefined();
    });
  });

  describe("Token management workflow", () => {
    it("should respect token limits during rendering", async () => {
      const longContent = "This is a test. ".repeat(500); // ~1200 tokens

      const templates = new Map([
        [
          "long_prompt",
          {
            id: "long_prompt",
            name: "Long Prompt",
            content: longContent,
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: ["long"],
              maxTokens: 500, // Limit to 500 tokens
            },
          } as PromptTemplate,
        ],
      ]);

      const program = renderPromptManually(templates, "long_prompt", {}).pipe(
        Effect.either,
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer)
      );

      const result = await Effect.runPromise(program);
      // Should fail due to token limit
      expect(result._tag).toBe("Left");
    });

    it("should allow rendering within token limits", async () => {
      const shortContent = "Hello world.";

      const templates = new Map([
        [
          "short_prompt",
          {
            id: "short_prompt",
            name: "Short Prompt",
            content: shortContent,
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: ["short"],
              maxTokens: 100, // Generous limit
            },
          } as PromptTemplate,
        ],
      ]);

      const program = renderPromptManually(templates, "short_prompt", {}).pipe(
        Effect.flatMap((result) =>
          Effect.gen(function* () {
            expect(result.content).toBe("Hello world.");
            expect(result.metadata.tokenCount).toBeLessThanOrEqual(100);
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

  describe("AI filter workflow", () => {
    it("should use AI filters in template rendering", async () => {
      const templates = new Map([
        [
          "filtered",
          {
            id: "filtered",
            name: "Filtered Template",
            content: `
Items (numbered): {{ items | toNumberedList }}
Items (bulleted): {{ items | toBulletedList: "*" }}
Tokens: {{ content | tokenCount }}
Sanitized: {{ dirty | sanitize }}
Markdown stripped: {{ markdown | stripMarkdown }}
`.trim(),
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: ["filters"],
            },
          } as PromptTemplate,
        ],
      ]);

      const program = renderPromptManually(templates, "filtered", {
        items: ["apple", "banana", "cherry"],
        content: "hello world this is a test",
        dirty: "hello\x00world\x01test",
        markdown: "# Title\n**bold** and *italic*",
      }).pipe(
        Effect.flatMap((result) =>
          Effect.gen(function* () {
            expect(result.content).toContain("1. apple");
            expect(result.content).toContain("* banana");
            expect(result.content).toContain("Tokens:");
            expect(result.content).toContain("Sanitized: helloworldtest");
            expect(result.content).not.toContain("# Title");

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

  describe("Error recovery workflow", () => {
    it("should handle missing prompts gracefully", async () => {
      const templates = new Map<string, PromptTemplate>();

      const program = renderPromptManually(templates, "nonexistent", {}).pipe(
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer),
        Effect.catchAll(() =>
          Effect.succeed({
            content: "Default prompt content",
            metadata: {
              templateId: "default",
              version: "0.0.0",
              renderedAt: new Date(),
              variables: {},
            },
          })
        )
      );

      const result = await Effect.runPromise(program);
      expect(result.content).toBe("Default prompt content");
    });
  });

  describe("Complex workflow combining multiple features", () => {
    it("should handle comprehensive workflow", async () => {
      const templates = new Map([
        [
          "comprehensive",
          {
            id: "comprehensive",
            name: "Comprehensive Template",
            content: `
Welcome {{ user.name }}!

Your Information:
- Email: {{ user.email }}
- Age: {{ user.age }}

Activities:
{% for activity in activities %}
  {{ forloop.index }}. {{ activity }}
{% endfor %}

Estimated tokens: {{ description | tokenCount }}
`.trim(),
            variableSchema: Schema.Struct({
              user: Schema.Struct({
                name: CommonVariableSchemas.text,
                email: CommonVariableSchemas.email,
                age: CommonVariableSchemas.number(0, 150),
              }),
              activities: Schema.Array(Schema.String),
              description: Schema.String,
            }),
            metadata: {
              version: "1.0.0",
              created: new Date(),
              updated: new Date(),
              tags: ["comprehensive", "user"],
              maxTokens: 500,
            },
          } as PromptTemplate,
        ],
      ]);

      const program = Effect.gen(function* () {
        // Validate variables first
        const validated = yield* validateVariablesManually(
          templates,
          "comprehensive",
          {
            user: {
              name: "Alice",
              email: "alice@example.com",
              age: 30,
            },
            activities: ["Reading", "Coding", "Gaming"],
            description: "User activity description",
          }
        );

        expect(validated.validationResult.valid).toBe(true);

        // Then render
        const result = yield* renderPromptManually(templates, "comprehensive", {
          user: {
            name: "Alice",
            email: "alice@example.com",
            age: 30,
          },
          activities: ["Reading", "Coding", "Gaming"],
          description: "User activity description",
        });

        expect(result.content).toContain("Welcome Alice!");
        expect(result.content).toContain("alice@example.com");
        expect(result.content).toContain("30");
        expect(result.content).toContain("1. Reading");
        expect(result.content).toContain("2. Coding");
        expect(result.content).toContain("3. Gaming");
        expect(result.content).toContain("Estimated tokens:");

        return result;
      }).pipe(
        Effect.provide(createTestLayer(templates)),
        Effect.provide(LiquidService.Default),
        Effect.provide(ValidationService.Default),
        Effect.provide(PromptConfigLayer)
      );

      const result = await Effect.runPromise(program);
      expect(result.content).toContain("Welcome Alice!");
    });
  });
});
