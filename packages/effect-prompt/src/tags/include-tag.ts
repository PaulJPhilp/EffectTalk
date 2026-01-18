import type { AstNode } from "effect-liquid";
import { Effect } from "effect";
import {
  LiquidTagError,
  LiquidRenderError,
  type TagFunction,
} from "effect-liquid";

/**
 * {% include "template-id" %}
 *
 * Placeholder tag for template inclusion.
 * Note: Full file-based inclusion requires access to PromptStorageService.
 * For now, this is a placeholder that renders its body.
 * Users should compose templates via renderPrompt with template variables.
 */
export const includeTag = (
  args: readonly unknown[],
  body: readonly AstNode[],
  context: Record<string, unknown>,
  render: (
    ast: readonly AstNode[],
    ctx: Record<string, unknown>
  ) => Effect.Effect<string, LiquidRenderError>
): Effect.Effect<string, LiquidTagError> =>
  Effect.gen(function* () {
    if (args.length === 0) {
      yield* Effect.fail(
        new LiquidTagError({
          message: "include tag requires a template ID argument",
          tagName: "include",
        })
      );
    }

    // For now, just render the body
    // Full inclusion would require access to storage service
    return yield* render(body, context).pipe(
      Effect.mapError(
        (err) =>
          new LiquidTagError({
            message: `Render error in include tag: ${err.message}`,
            tagName: "include",
            cause: err,
          })
      )
    );
  });
