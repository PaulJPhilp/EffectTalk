/**
 * Service Layer Type Definitions
 *
 * This module defines the service interfaces for the Effect-based architecture.
 * Services provide dependency injection and composable layers for core functionality.
 */

import { Effect } from "effect";
import type { Ast } from "@/effect-regex/core/ast.js";
import type { RegexBuilder, RegexPattern } from "@/effect-regex/core/builder.js";
import type { LintResult } from "@/effect-regex/core/linter.js";
import type {
  OptimizationOptions,
  OptimizationResult,
} from "@/effect-regex/core/optimizer.js";
import type { RegexTestCase, TestResult } from "@/effect-regex/core/tester.js";
import { EmitError, TestExecutionError } from "@/effect-regex/errors/types.js";
import { emit as coreEmit } from "@/effect-regex/core/emitter.js";
import { lint as coreLint } from "@/effect-regex/core/linter.js";
import { optimize as coreOptimize } from "@/effect-regex/core/optimizer.js";
import { testRegex as coreTestRegex } from "@/effect-regex/core/tester.js";

/**
 * Service for regex pattern building and emission
 *
 * Provides core regex operations: emit, lint, optimize
 */
export class RegexBuilderService extends Effect.Service<RegexBuilderService>()(
  "RegexBuilderService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      return {
        /**
         * Emit a regex pattern from builder
         *
         * @throws EmitError when pattern emission fails
         */
        emit: (
          builder: RegexBuilder,
          dialect: "js" | "re2" | "pcre" = "js",
          anchor: boolean = false
        ): Effect.Effect<RegexPattern, EmitError> =>
          Effect.try({
            try: () => coreEmit(builder, dialect, anchor),
            catch: (error) =>
              new EmitError({
                builder,
                dialect,
                cause: error,
              }),
          }),

        /**
         * Lint a pattern AST for dialect compatibility
         *
         * Note: Linting never fails - it returns validation results
         */
        lint: (ast: Ast, dialect: "js" | "re2" | "pcre" = "js"): LintResult =>
          coreLint(ast, dialect),

        /**
         * Optimize pattern AST for performance
         *
         * Note: Optimization never fails - it returns optimized result
         */
        optimize: (
          ast: Ast,
          options?: OptimizationOptions
        ): OptimizationResult => coreOptimize(ast, options),
      };
    }),
  }
) {}

/**
 * Service for pattern validation and testing
 *
 * Provides testing and validation operations with timeout protection
 */
export class ValidationService extends Effect.Service<ValidationService>()(
  "ValidationService",
  {
    accessors: true,
    effect: Effect.gen(function* () {
      return {
        /**
         * Test regex against test cases
         *
         * @throws TestExecutionError when pattern execution fails or times out
         */
        test: (
          pattern: string,
          cases: readonly RegexTestCase[],
          dialect: "js" | "re2-sim" | "re2" = "js",
          timeoutMs: number = 100
        ): Effect.Effect<TestResult, TestExecutionError> =>
          coreTestRegex(pattern, cases, dialect, timeoutMs).pipe(
            Effect.mapError(
              (error: unknown) =>
                new TestExecutionError({
                  pattern,
                  reason:
                    error instanceof Error ? error.message : String(error),
                  timedOut:
                    error instanceof Error && error.message.includes("timeout"),
                })
            )
          ),

        /**
         * Validate pattern for dialect compatibility
         *
         * Note: Never fails - returns validation results
         */
        validateForDialect: (
          pattern: RegexBuilder,
          dialect: "js" | "re2" | "pcre"
        ): Effect.Effect<
          { valid: boolean; issues: readonly string[] },
          never
        > =>
          Effect.gen(function* () {
            const result = coreEmit(pattern, dialect);
            const lintResult = coreLint(result.ast, dialect);
            return {
              valid: lintResult.valid,
              issues: lintResult.issues.map((issue) => issue.message),
            };
          }),
      };
    }),
  }
) {}
