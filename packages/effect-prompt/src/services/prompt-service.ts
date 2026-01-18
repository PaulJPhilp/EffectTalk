import { Effect, Layer } from "effect";
import { LiquidService } from "effect-liquid";
import { PromptConfig, PromptConfigLayer } from "../config/prompt-config.js";
import { PromptRenderError, TokenLimitExceededError } from "../errors.js";
import * as AIFilters from "../filters/ai-filters.js";
import * as ConversationFilters from "../filters/conversation-filters.js";
import { extendsTag, includeTag } from "../tags/index.js";
import type {
  Conversation,
  RenderedPrompt,
  ValidatedPrompt,
} from "../types.js";
import {
  PromptStorageService,
  PromptStorageServiceLayer,
} from "./storage-service.js";
import {
  ValidationService,
  ValidationServiceLayer,
} from "./validation-service.js";

export interface PromptServiceSchema {
  readonly renderPrompt: (
    promptId: string,
    variables: Record<string, unknown>
  ) => Effect.Effect<
    RenderedPrompt,
    PromptRenderError | TokenLimitExceededError | Error
  >;

  readonly validateVariables: (
    promptId: string,
    variables: Record<string, unknown>
  ) => Effect.Effect<ValidatedPrompt, Error>;

  readonly renderConversation: (
    conversation: Conversation,
    format?: "openai" | "anthropic" | "plain"
  ) => Effect.Effect<string, Error>;
}

export class PromptService extends Effect.Service<PromptServiceSchema>()(
  "PromptService",
  {
    accessors: true,
    dependencies: [],
    effect: Effect.gen(function* () {
      const liquid = yield* LiquidService;
      const storage = yield* PromptStorageService;
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

      // Register conversation filters
      yield* liquid.registerFilter(
        "formatConversation",
        ConversationFilters.formatConversation
      );
      yield* liquid.registerFilter(
        "filterByRole",
        ConversationFilters.filterByRole
      );
      yield* liquid.registerFilter(
        "conversationTokens",
        ConversationFilters.conversationTokens
      );

      // Register composition tags
      yield* liquid.registerTag("extends", extendsTag);
      yield* liquid.registerTag("include", includeTag);

      const renderPrompt = (
        promptId: string,
        variables: Record<string, unknown>
      ) =>
        Effect.gen(function* () {
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

          // Render template
          const rendered = yield* liquid
            .render(template.content, variables)
            .pipe(
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
          } satisfies RenderedPrompt;
        });

      const validateVariables = (
        promptId: string,
        variables: Record<string, unknown>
      ) =>
        Effect.gen(function* () {
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
            } satisfies ValidatedPrompt;
          }

          const validationResult = yield* validation.validate(
            variables,
            template.variableSchema
          );

          return {
            template,
            variables,
            validationResult,
          } satisfies ValidatedPrompt;
        });

      const renderConversation = (
        conversation: Conversation,
        format: "openai" | "anthropic" | "plain" = "openai"
      ) =>
        Effect.gen(function* () {
          return yield* ConversationFilters.formatConversation(
            conversation.messages,
            format
          );
        });

      return {
        renderPrompt,
        validateVariables,
        renderConversation,
      } satisfies PromptServiceSchema;
    }),
  }
) {}

export const PromptServiceLayer = Layer.mergeAll(
  PromptStorageServiceLayer,
  ValidationServiceLayer
).pipe(Layer.provide(Layer.service(PromptService)));
