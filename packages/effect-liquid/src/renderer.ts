import { Effect } from "effect";
import type { AstNode, FilterNode } from "./ast.js";
import { LiquidRenderError, LiquidTagError } from "./errors.js";
import { builtInFilters } from "./filters.js";
import { executeCase, tagExecutors } from "./tags.js";
import type { FilterFunction, LiquidContext } from "./types.js";
import { resolveVariable, toString } from "./utils/context.js";

/**
 * Applies filters to a value.
 */
function applyFilters(
  value: unknown,
  filters: readonly FilterNode[],
  customFilters: Record<string, FilterFunction>
): Effect.Effect<unknown, LiquidRenderError> {
  return Effect.gen(function* () {
    let result = value;

    for (const filter of filters) {
      const filterFn =
        customFilters[filter.name] ?? builtInFilters[filter.name];

      if (!filterFn) {
        return yield* Effect.fail(
          new LiquidRenderError({
            message: `Unknown filter: ${filter.name}`,
            cause: undefined,
          })
        );
      }

      const filterResult = yield* filterFn(result, ...filter.args);
      result = filterResult;
    }

    return result;
  }).pipe(
    Effect.mapError((error) =>
      error instanceof LiquidRenderError
        ? error
        : new LiquidRenderError({
            message: `Filter error: ${
              error instanceof Error ? error.message : String(error)
            }`,
            cause: error,
          })
    )
  );
}

/**
 * Renders a single AST node.
 */
function renderNode(
  node: AstNode,
  context: LiquidContext,
  customFilters: Record<string, FilterFunction>,
  customTags: Record<
    string,
    (
      args: readonly unknown[],
      body: readonly AstNode[],
      context: LiquidContext,
      render: (
        nodes: readonly AstNode[],
        ctx: LiquidContext
      ) => Effect.Effect<string, LiquidRenderError>
    ) => Effect.Effect<string, LiquidRenderError>
  >
): Effect.Effect<string, LiquidRenderError> {
  return Effect.gen(function* () {
    switch (node.type) {
      case "text": {
        const textNode = node as import("./ast.js").TextNode;
        return textNode.value;
      }

      case "variable": {
        const varNode = node as import("./ast.js").VariableNode;
        // Check if the name is a numeric literal
        const numValue = Number.parseFloat(varNode.name);
        let value: unknown;
        if (!Number.isNaN(numValue) && varNode.name === String(numValue)) {
          // It's a numeric literal
          value = numValue;
        } else {
          // It's a variable name, resolve from context
          value = yield* resolveVariable(context, varNode.name);
        }
        const filtered = varNode.filters
          ? yield* applyFilters(value, varNode.filters, customFilters)
          : value;
        return toString(filtered);
      }

      case "tag": {
        const tagNode = node as import("./ast.js").TagNode;
        const tagFn = customTags[tagNode.name] ?? tagExecutors[tagNode.name];

        if (!tagFn) {
          return yield* Effect.fail(
            new LiquidRenderError({
              message: `Unknown tag: ${tagNode.name}`,
              cause: undefined,
            })
          );
        }

        const result = yield* tagFn(
          tagNode.args,
          tagNode.body,
          context,
          (nodes, ctx) => renderNodes(nodes, ctx, customFilters, customTags)
        ).pipe(
          Effect.mapError(
            (error) =>
              new LiquidRenderError({
                message: `Tag error: ${
                  error instanceof Error ? error.message : String(error)
                }`,
                cause: error,
              })
          )
        );

        // Handle whitespace trimming
        let trimmed = result;
        if (tagNode.trimLeft) {
          trimmed = trimmed.replace(/^\s+/, "");
        }
        if (tagNode.trimRight) {
          trimmed = trimmed.replace(/\s+$/, "");
        }

        return trimmed;
      }

      case "if": {
        // Simplified if handling - would need more complex parsing
        return "";
      }

      case "unless": {
        // Simplified unless handling
        return "";
      }

      case "for": {
        const forNode = node as import("./ast.js").ForNode;
        const tagFn = customTags.for ?? tagExecutors.for;
        if (!tagFn) {
          return yield* Effect.fail(
            new LiquidRenderError({
              message: "For tag executor not found",
              cause: undefined,
            })
          );
        }
        return yield* tagFn(
          [forNode.variable, "in", forNode.collection],
          forNode.body,
          context,
          (nodes, ctx) => renderNodes(nodes, ctx, customFilters, customTags)
        ).pipe(
          Effect.mapError(
            (error) =>
              new LiquidRenderError({
                message: `For loop error: ${
                  error instanceof Error ? error.message : String(error)
                }`,
                cause: error,
              })
          )
        );
      }

      case "case": {
        const caseNode = node as import("./ast.js").CaseNode;
        return yield* executeCase(
          caseNode.expression,
          caseNode.when.map((w) => ({ values: w.values, body: w.body })),
          caseNode.elseBody,
          context,
          (nodes, ctx) =>
            renderNodes(nodes, ctx, customFilters, customTags).pipe(
              Effect.mapError(
                (error) =>
                  new LiquidTagError({
                    message: `Render error: ${
                      error instanceof Error ? error.message : String(error)
                    }`,
                    tagName: "case",
                    cause: error,
                  })
              )
            )
        ).pipe(
          Effect.mapError(
            (error) =>
              new LiquidRenderError({
                message: `Case error: ${
                  error instanceof Error ? error.message : String(error)
                }`,
                cause: error,
              })
          )
        );
      }

      case "assign": {
        const assignNode = node as import("./ast.js").AssignNode;
        const tagFn = customTags.assign ?? tagExecutors.assign;
        if (!tagFn) {
          return yield* Effect.fail(
            new LiquidRenderError({
              message: "Assign tag executor not found",
              cause: undefined,
            })
          );
        }
        yield* tagFn(
          [assignNode.variable, "=", assignNode.value],
          [],
          context,
          () => Effect.succeed("")
        ).pipe(
          Effect.mapError(
            (error) =>
              new LiquidRenderError({
                message: `Assign error: ${
                  error instanceof Error ? error.message : String(error)
                }`,
                cause: error,
              })
          )
        );
        return "";
      }

      case "capture": {
        const captureNode = node as import("./ast.js").CaptureNode;
        const tagFn = customTags.capture ?? tagExecutors.capture;
        if (!tagFn) {
          return yield* Effect.fail(
            new LiquidRenderError({
              message: "Capture tag executor not found",
              cause: undefined,
            })
          );
        }
        return yield* tagFn(
          [captureNode.variable],
          captureNode.body,
          context,
          (nodes, ctx) => renderNodes(nodes, ctx, customFilters, customTags)
        ).pipe(
          Effect.mapError(
            (error) =>
              new LiquidRenderError({
                message: `Capture error: ${
                  error instanceof Error ? error.message : String(error)
                }`,
                cause: error,
              })
          )
        );
      }

      case "comment": {
        return "";
      }

      case "include": {
        const includeNode = node as import("./ast.js").IncludeNode;
        const tagFn = customTags.include ?? tagExecutors.include;
        if (!tagFn) {
          return yield* Effect.fail(
            new LiquidRenderError({
              message: "Include tag executor not found",
              cause: undefined,
            })
          );
        }
        return yield* tagFn([includeNode.template], [], context, () =>
          Effect.succeed("")
        ).pipe(
          Effect.mapError(
            (error) =>
              new LiquidRenderError({
                message: `Include error: ${
                  error instanceof Error ? error.message : String(error)
                }`,
                cause: error,
              })
          )
        );
      }

      case "render": {
        const renderNode = node as import("./ast.js").RenderNode;
        const tagFn = customTags.render ?? tagExecutors.render;
        if (!tagFn) {
          return yield* Effect.fail(
            new LiquidRenderError({
              message: "Render tag executor not found",
              cause: undefined,
            })
          );
        }
        return yield* tagFn([renderNode.template], [], context, () =>
          Effect.succeed("")
        ).pipe(
          Effect.mapError(
            (error) =>
              new LiquidRenderError({
                message: `Render error: ${
                  error instanceof Error ? error.message : String(error)
                }`,
                cause: error,
              })
          )
        );
      }

      default: {
        return yield* Effect.fail(
          new LiquidRenderError({
            message: `Unknown node type: ${(node as { type: string }).type}`,
            cause: undefined,
          })
        );
      }
    }
  }).pipe(
    Effect.mapError((error) =>
      error instanceof LiquidRenderError
        ? error
        : new LiquidRenderError({
            message: `Render error: ${
              error instanceof Error ? error.message : String(error)
            }`,
            position: node.position,
            cause: error,
          })
    )
  );
}

/**
 * Renders a sequence of AST nodes.
 */
export function renderNodes(
  nodes: readonly AstNode[],
  context: LiquidContext,
  customFilters: Record<string, FilterFunction> = {},
  customTags: Record<
    string,
    (
      args: readonly unknown[],
      body: readonly AstNode[],
      context: LiquidContext,
      render: (
        nodes: readonly AstNode[],
        ctx: LiquidContext
      ) => Effect.Effect<string, LiquidRenderError>
    ) => Effect.Effect<string, LiquidRenderError>
  > = {}
): Effect.Effect<string, LiquidRenderError> {
  return Effect.gen(function* () {
    let result = "";

    for (const node of nodes) {
      result += yield* renderNode(node, context, customFilters, customTags);
    }

    return result;
  });
}
