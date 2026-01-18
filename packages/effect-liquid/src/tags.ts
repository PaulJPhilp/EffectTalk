import { Effect } from "effect";
import type { AstNode } from "./ast.js";
import { LiquidTagError } from "./errors.js";
import type { LiquidContext } from "./types.js";
import { resolveVariable } from "./utils/context.js";
import { isTruthy } from "./utils/helpers.js";

/**
 * Resolves a condition value from context if it's a string path.
 */
function resolveCondition(condition: unknown, context: LiquidContext): unknown {
  if (typeof condition === "string") {
    const resolved = Effect.runSync(
      Effect.either(resolveVariable(context, condition))
    );
    if (resolved._tag === "Right") {
      return resolved.right;
    }
  }
  return condition;
}

/**
 * Executes an if tag: {% if condition %}...{% endif %}
 */
export function executeIf(
  condition: unknown,
  body: readonly AstNode[],
  elsif: Array<{ condition: unknown; body: readonly AstNode[] }> | undefined,
  elseBody: readonly AstNode[] | undefined,
  context: LiquidContext,
  render: (
    nodes: readonly AstNode[],
    ctx: LiquidContext
  ) => Effect.Effect<string, LiquidTagError>
): Effect.Effect<string, LiquidTagError> {
  return Effect.gen(function* () {
    if (isTruthy(condition)) {
      return yield* render(body, context);
    }

    if (elsif) {
      for (const branch of elsif) {
        if (isTruthy(branch.condition)) {
          return yield* render(branch.body, context);
        }
      }
    }

    if (elseBody) {
      return yield* render(elseBody, context);
    }

    return "";
  });
}

/**
 * Executes an unless tag: {% unless condition %}...{% endunless %}
 */
export function executeUnless(
  condition: unknown,
  body: readonly AstNode[],
  context: LiquidContext,
  render: (
    nodes: readonly AstNode[],
    ctx: LiquidContext
  ) => Effect.Effect<string, LiquidTagError>
): Effect.Effect<string, LiquidTagError> {
  return Effect.gen(function* () {
    if (!isTruthy(condition)) {
      return yield* render(body, context);
    }
    return "";
  });
}

/**
 * Executes a for loop: {% for item in items %}...{% endfor %}
 */
export function executeFor(
  variable: string,
  collection: string,
  body: readonly AstNode[],
  limit: number | undefined,
  offset: number | undefined,
  reversed: boolean | undefined,
  context: LiquidContext,
  render: (
    nodes: readonly AstNode[],
    ctx: LiquidContext
  ) => Effect.Effect<string, LiquidTagError>
): Effect.Effect<string, LiquidTagError> {
  return Effect.gen(function* () {
    const collectionValue = yield* resolveVariable(context, collection);

    if (!Array.isArray(collectionValue)) {
      return "";
    }

    let items = [...collectionValue];
    if (reversed) {
      items = items.reverse();
    }
    if (offset !== undefined) {
      items = items.slice(offset);
    }
    if (limit !== undefined) {
      items = items.slice(0, limit);
    }

    let result = "";
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const forloop = {
        index: i + 1,
        index0: i,
        first: i === 0,
        last: i === items.length - 1,
        length: items.length,
      };

      const loopContext = {
        ...context,
        [variable]: item,
        forloop,
      };

      result += yield* render(body, loopContext);
    }

    return result;
  }).pipe(
    Effect.mapError(
      (error) =>
        new LiquidTagError({
          message: `For loop error: ${
            error instanceof Error ? error.message : String(error)
          }`,
          tagName: "for",
          cause: error,
        })
    )
  );
}

/**
 * Executes a case statement: {% case value %}...{% endcase %}
 */
export function executeCase(
  expression: unknown,
  when: Array<{ values: readonly unknown[]; body: readonly AstNode[] }>,
  elseBody: readonly AstNode[] | undefined,
  context: LiquidContext,
  render: (
    nodes: readonly AstNode[],
    ctx: LiquidContext
  ) => Effect.Effect<string, LiquidTagError>
): Effect.Effect<string, LiquidTagError> {
  return Effect.gen(function* () {
    for (const branch of when) {
      for (const value of branch.values) {
        if (expression === value) {
          return yield* render(branch.body, context);
        }
      }
    }

    if (elseBody) {
      return yield* render(elseBody, context);
    }

    return "";
  });
}

/**
 * Executes an assign tag: {% assign var = value %}
 */
export function executeAssign(
  variable: string,
  value: unknown,
  context: LiquidContext
): Effect.Effect<string, LiquidTagError> {
  return Effect.try({
    try: () => {
      (context as Record<string, unknown>)[variable] = value;
      return "";
    },
    catch: (error) =>
      new LiquidTagError({
        message: `Assign error: ${
          error instanceof Error ? error.message : String(error)
        }`,
        tagName: "assign",
        cause: error,
      }),
  });
}

/**
 * Executes a capture tag: {% capture var %}...{% endcapture %}
 */
export function executeCapture(
  variable: string,
  body: readonly AstNode[],
  context: LiquidContext,
  render: (
    nodes: readonly AstNode[],
    ctx: LiquidContext
  ) => Effect.Effect<string, LiquidTagError>
): Effect.Effect<string, LiquidTagError> {
  return Effect.gen(function* () {
    const captured = yield* render(body, context);
    (context as Record<string, unknown>)[variable] = captured;
    return "";
  }).pipe(
    Effect.mapError(
      (error) =>
        new LiquidTagError({
          message: `Capture error: ${
            error instanceof Error ? error.message : String(error)
          }`,
          tagName: "capture",
          cause: error,
        })
    )
  );
}

/**
 * Executes a comment tag: {% comment %}...{% endcomment %}
 */
export function executeComment(): Effect.Effect<string, LiquidTagError> {
  return Effect.succeed("");
}

/**
 * Executes an include tag: {% include 'template' %}
 * Note: This is a placeholder - full implementation would require template loading
 */
export function executeInclude(
  template: string,
  withContext: LiquidContext | undefined,
  forContext: string | undefined,
  context: LiquidContext
): Effect.Effect<string, LiquidTagError> {
  // Placeholder - would need template loading mechanism
  return Effect.fail(
    new LiquidTagError({
      message: "Include tag not yet implemented",
      tagName: "include",
    })
  );
}

/**
 * Executes a render tag: {% render 'template' %}
 * Note: This is a placeholder - full implementation would require template loading
 */
export function executeRender(
  template: string,
  withContext: LiquidContext | undefined,
  context: LiquidContext
): Effect.Effect<string, LiquidTagError> {
  // Placeholder - would need template loading mechanism
  return Effect.fail(
    new LiquidTagError({
      message: "Render tag not yet implemented",
      tagName: "render",
    })
  );
}

/**
 * Registry of tag execution functions.
 */
export const tagExecutors: Record<
  string,
  (
    args: readonly unknown[],
    body: readonly AstNode[],
    context: LiquidContext,
    render: (
      nodes: readonly AstNode[],
      ctx: LiquidContext
    ) => Effect.Effect<string, LiquidTagError>
  ) => Effect.Effect<string, LiquidTagError>
> = {
  if: (args, body, context, render) => {
    const condition = resolveCondition(args[0], context);
    // Parse body for elsif/else blocks
    const elsifBlocks: Array<{ condition: unknown; body: readonly AstNode[] }> =
      [];
    let elseBody: readonly AstNode[] | undefined;
    const ifBody: AstNode[] = [];
    let currentSection: AstNode[] = ifBody;
    let currentElsif: { condition: unknown; body: AstNode[] } | undefined;

    for (const node of body) {
      if (node.type === "tag") {
        const tagNode = node as import("./ast.js").TagNode;
        if (tagNode.name === "elsif") {
          // Save current section and start new elsif
          if (currentElsif) {
            elsifBlocks.push(currentElsif);
          }
          currentElsif = {
            condition: resolveCondition(tagNode.args[0], context),
            body: [],
          };
          currentSection = currentElsif.body;
          // Skip the elsif tag itself, but include its body if it has one
          if (tagNode.body.length > 0) {
            currentSection.push(...tagNode.body);
          }
        } else if (tagNode.name === "else") {
          // Save current section and start else
          if (currentElsif) {
            elsifBlocks.push(currentElsif);
            currentElsif = undefined;
          }
          const elseNodes: AstNode[] = [];
          elseBody = elseNodes;
          currentSection = elseNodes;
          // Skip the else tag itself, but include its body if it has one
          if (tagNode.body.length > 0) {
            currentSection.push(...tagNode.body);
          }
        } else if (tagNode.name === "endif") {
          // End of if block - save current elsif if any
          if (currentElsif) {
            elsifBlocks.push(currentElsif);
          }
          break;
        } else {
          // Regular tag - add to current section
          currentSection.push(node);
        }
      } else {
        // Regular node - add to current section
        currentSection.push(node);
      }
    }

    // Save any remaining elsif
    if (currentElsif) {
      elsifBlocks.push(currentElsif);
    }

    return executeIf(
      condition,
      ifBody,
      elsifBlocks.length > 0 ? elsifBlocks : undefined,
      elseBody,
      context,
      render
    );
  },
  unless: (args, body, context, render) => {
    const condition = args[0];
    return executeUnless(condition, body, context, render);
  },
  for: (args, body, context, render) => {
    // Parse: for item in collection
    const variable = typeof args[0] === "string" ? args[0] : "";
    const collection = typeof args[2] === "string" ? args[2] : "";
    return executeFor(
      variable,
      collection,
      body,
      undefined,
      undefined,
      undefined,
      context,
      render
    );
  },
  case: (args, body, context, render) => {
    const expression = resolveCondition(args[0], context);
    // Parse body for when/else blocks
    const whenBlocks: Array<{
      values: readonly unknown[];
      body: readonly AstNode[];
    }> = [];
    let elseBody: readonly AstNode[] | undefined;
    let currentWhen:
      | { values: readonly unknown[]; body: readonly AstNode[] }
      | undefined;

    for (const node of body) {
      if (node.type === "tag") {
        const tagNode = node as import("./ast.js").TagNode;
        if (tagNode.name === "when") {
          // Save previous when if exists
          if (currentWhen) {
            whenBlocks.push(currentWhen);
          }
          // Start new when block - values are in args, body is in tagNode.body
          const values = tagNode.args.length > 0 ? tagNode.args : [];
          currentWhen = {
            values,
            body: tagNode.body, // Use the when tag's body directly
          };
        } else if (tagNode.name === "else") {
          // Save current when if exists
          if (currentWhen) {
            whenBlocks.push(currentWhen);
            currentWhen = undefined;
          }
          // Start else block - use else tag's body
          elseBody = tagNode.body.length > 0 ? tagNode.body : [];
        } else if (tagNode.name === "endcase") {
          // Ignore endcase tag - it's just a marker, parser should have consumed it
          continue;
        } else if (currentWhen) {
          // Regular tag - add to current when's body
          // This shouldn't happen if parser is correct, but handle it
          currentWhen = {
            values: currentWhen.values,
            body: [...currentWhen.body, node],
          };
        }
      } else if (currentWhen) {
        // Regular node - add to current when's body
        currentWhen = {
          values: currentWhen.values,
          body: [...currentWhen.body, node],
        };
      } else if (elseBody) {
        // Add to else body
        elseBody = [...elseBody, node];
      }
      // If no current section, ignore (shouldn't happen in well-formed templates)
    }

    // Save any remaining when
    if (currentWhen) {
      whenBlocks.push(currentWhen);
    }

    return executeCase(expression, whenBlocks, elseBody, context, render);
  },
  assign: (args, body, context) => {
    const variable = typeof args[0] === "string" ? args[0] : "";
    const value = args[1]; // Parser provides [variable, value], not [variable, "=", value]
    return executeAssign(variable, value, context);
  },
  capture: (args, body, context, render) => {
    const variable = typeof args[0] === "string" ? args[0] : "";
    return executeCapture(variable, body, context, render);
  },
  comment: () => executeComment(),
  else: () => Effect.succeed(""), // else is handled within if tag
  elsif: () => Effect.succeed(""), // elsif is handled within if tag
  endif: () => Effect.succeed(""), // endif is just a marker
  include: (args) => {
    const template = typeof args[0] === "string" ? args[0] : "";
    return executeInclude(template, undefined, undefined, {});
  },
  render: (args) => {
    const template = typeof args[0] === "string" ? args[0] : "";
    return executeRender(template, undefined, {});
  },
};
