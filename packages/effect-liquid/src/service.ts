import { Effect, Ref } from "effect";
import type { AstNode } from "./ast.js";
import type {
  LiquidContext,
  LiquidOptions,
  LiquidTemplate,
  FilterFunction,
  TagFunction,
} from "./types.js";
import {
  LiquidParseError,
  LiquidRenderError,
  LiquidTagError,
} from "./errors.js";
import { parseTemplate } from "./parser.js";
import { renderNodes } from "./renderer.js";
import { tagExecutors } from "./tags.js";

export interface LiquidServiceSchema {
  readonly parse: (
    template: string
  ) => Effect.Effect<readonly AstNode[], LiquidParseError>;
  readonly render: (
    template: string,
    context: LiquidContext
  ) => Effect.Effect<string, LiquidParseError | LiquidRenderError>;
  readonly compile: (
    template: string
  ) => Effect.Effect<LiquidTemplate, LiquidParseError>;
  readonly renderCompiled: (
    compiled: LiquidTemplate,
    context: LiquidContext
  ) => Effect.Effect<string, LiquidRenderError>;
  readonly registerFilter: (
    name: string,
    fn: FilterFunction
  ) => Effect.Effect<void, never>;
  readonly registerTag: (
    name: string,
    fn: TagFunction
  ) => Effect.Effect<void, never>;
}

export class LiquidService extends Effect.Service<LiquidServiceSchema>()(
  "LiquidService",
  {
    accessors: true,
    dependencies: [],
    effect: Effect.gen(function* () {
      const customFiltersRef = yield* Ref.make<Record<string, FilterFunction>>(
        {}
      );
      const customTagsRef = yield* Ref.make<Record<string, TagFunction>>({});

      const parse = (template: string) => parseTemplate(template);

      const render = (template: string, context: LiquidContext) =>
        Effect.gen(function* () {
          const ast = yield* parseTemplate(template);
          const customFilters = yield* Ref.get(customFiltersRef);
          const customTags = yield* Ref.get(customTagsRef);
          // Convert custom tags to match renderer signature
          const rendererTags: Record<
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
          > = {};
          for (const [name, fn] of Object.entries(customTags)) {
            rendererTags[name] = (args, body, ctx, renderFn) =>
              (
                fn(
                  args,
                  body,
                  ctx,
                  (nodes, renderCtx) =>
                    renderFn(nodes, renderCtx).pipe(
                      Effect.mapError(
                        (error) =>
                          new LiquidTagError({
                            message: `Render error: ${error instanceof Error ? error.message : String(error)}`,
                            tagName: name,
                            cause: error,
                          })
                      )
                    ) as any
                ) as Effect.Effect<string, LiquidTagError>
              ).pipe(
                Effect.mapError(
                  (error) =>
                    new LiquidRenderError({
                      message: `Tag error: ${error instanceof Error ? error.message : String(error)}`,
                      cause: error,
                    })
                )
              );
          }
          // Wrap tagExecutors to return LiquidRenderError
          const wrappedTagExecutors: Record<
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
          > = {};
          for (const [name, fn] of Object.entries(tagExecutors)) {
            wrappedTagExecutors[name] = (args, body, ctx, renderFn) =>
              fn(args, body, ctx, (nodes, renderCtx) =>
                renderFn(nodes, renderCtx).pipe(
                  Effect.mapError(
                    (error) =>
                      new LiquidTagError({
                        message: `Render error: ${error instanceof Error ? error.message : String(error)}`,
                        tagName: name,
                        cause: error,
                      })
                  )
                )
              ).pipe(
                Effect.mapError(
                  (error) =>
                    new LiquidRenderError({
                      message: `Tag error: ${error instanceof Error ? error.message : String(error)}`,
                      cause: error,
                    })
                )
              );
          }
          return yield* renderNodes(ast, context, customFilters, {
            ...wrappedTagExecutors,
            ...rendererTags,
          });
        });

      const compile = (template: string) =>
        Effect.gen(function* () {
          const ast = yield* parseTemplate(template);
          return {
            ast,
            source: template,
          };
        });

      const renderCompiled = (
        compiled: LiquidTemplate,
        context: LiquidContext
      ) =>
        Effect.gen(function* () {
          const customFilters = yield* Ref.get(customFiltersRef);
          const customTags = yield* Ref.get(customTagsRef);
          // Convert custom tags to match renderer signature
          const rendererTags: Record<
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
          > = {};
          for (const [name, fn] of Object.entries(customTags)) {
            rendererTags[name] = (args, body, ctx, renderFn) =>
              (
                fn(
                  args,
                  body,
                  ctx,
                  (nodes, renderCtx) =>
                    renderFn(nodes, renderCtx).pipe(
                      Effect.mapError(
                        (error) =>
                          new LiquidTagError({
                            message: `Render error: ${error instanceof Error ? error.message : String(error)}`,
                            tagName: name,
                            cause: error,
                          })
                      )
                    ) as any
                ) as Effect.Effect<string, LiquidTagError>
              ).pipe(
                Effect.mapError(
                  (error) =>
                    new LiquidRenderError({
                      message: `Tag error: ${error instanceof Error ? error.message : String(error)}`,
                      cause: error,
                    })
                )
              );
          }
          // Wrap tagExecutors to return LiquidRenderError
          const wrappedTagExecutors: Record<
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
          > = {};
          for (const [name, fn] of Object.entries(tagExecutors)) {
            wrappedTagExecutors[name] = (args, body, ctx, renderFn) =>
              fn(args, body, ctx, (nodes, renderCtx) =>
                renderFn(nodes, renderCtx).pipe(
                  Effect.mapError(
                    (error) =>
                      new LiquidTagError({
                        message: `Render error: ${error instanceof Error ? error.message : String(error)}`,
                        tagName: name,
                        cause: error,
                      })
                  )
                )
              ).pipe(
                Effect.mapError(
                  (error) =>
                    new LiquidRenderError({
                      message: `Tag error: ${error instanceof Error ? error.message : String(error)}`,
                      cause: error,
                    })
                )
              );
          }
          return yield* renderNodes(
            compiled.ast as readonly AstNode[],
            context,
            customFilters,
            { ...wrappedTagExecutors, ...rendererTags }
          );
        });

      const registerFilter = (name: string, fn: FilterFunction) =>
        Effect.gen(function* () {
          yield* Ref.update(customFiltersRef, (filters) => ({
            ...filters,
            [name]: fn,
          }));
        });

      const registerTag = (name: string, fn: TagFunction) =>
        Effect.gen(function* () {
          yield* Ref.update(customTagsRef, (tags) => ({
            ...tags,
            [name]: fn,
          }));
        });

      return {
        parse,
        render,
        compile,
        renderCompiled,
        registerFilter,
        registerTag,
      };
    }),
  }
) {}

export const LiquidServiceLayer = LiquidService.Default;
