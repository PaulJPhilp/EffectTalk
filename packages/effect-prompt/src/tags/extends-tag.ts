import type { AstNode } from "effect-liquid";
import { Effect } from "effect";
import {
	LiquidTagError,
	LiquidRenderError,
	type TagFunction,
} from "effect-liquid";

/**
 * {% extends "parent-template-id" %}
 *
 * Placeholder tag for template inheritance.
 * Note: Full block-override inheritance requires parser modifications.
 * For now, this is a placeholder that renders its body.
 * Users should compose templates via renderPrompt with conditional logic.
 */
export const extendsTag = (
	args: readonly unknown[],
	body: readonly AstNode[],
	context: Record<string, unknown>,
	render: (
		ast: readonly AstNode[],
		ctx: Record<string, unknown>,
	) => Effect.Effect<string, LiquidRenderError>,
): Effect.Effect<string, LiquidTagError> =>
	Effect.gen(function* () {
		if (args.length === 0) {
			yield* Effect.fail(
				new LiquidTagError({
					message: "extends tag requires a template ID argument",
					tagName: "extends",
				}),
			);
		}

		// For now, just render the body
		// Full inheritance would require parser-level support
		return yield* render(body, context).pipe(
			Effect.mapError(
				(err) =>
					new LiquidTagError({
						message: `Render error in extends tag: ${err.message}`,
						tagName: "extends",
						cause: err,
					}),
			),
		);
	});
