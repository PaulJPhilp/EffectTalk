/**
 * Service Layer Tests
 *
 * Tests for the Effect-based service layer architecture.
 * Demonstrates how to use services via Context and Layer composition.
 */

import { describe, expect, it } from "@effect/vitest";
import { Effect } from "effect";
import { RegexBuilder } from "../src/core/builder.js";
import {
  RegexBuilderService,
  ValidationService,
} from "../src/services/index.js";

describe("Service Layer", () => {
  describe("RegexBuilderService", () => {
    it("should emit patterns through service", () => {
      const program = Effect.gen(function* () {
        const service = yield* RegexBuilderService;
        const pattern = RegexBuilder.lit("test").then("123");
        const result = yield* service.emit(pattern, "js", false);
        return result.pattern;
      });

      expect(
        program.pipe(
          Effect.provide(RegexBuilderService.Default),
          Effect.runSync
        )
      ).toBe("test123");
    });

    it("should lint patterns through service", () => {
      const program = Effect.gen(function* () {
        const service = yield* RegexBuilderService;
        const pattern = RegexBuilder.lit("test");
        const ast = pattern.getAst();
        const result = service.lint(ast, "js");
        return result.valid;
      });

      expect(
        program.pipe(
          Effect.provide(RegexBuilderService.Default),
          Effect.runSync
        )
      ).toBe(true);
    });

    it("should optimize patterns through service", () => {
      const program = Effect.gen(function* () {
        const service = yield* RegexBuilderService;
        const pattern = RegexBuilder.lit("hello")
          .then(RegexBuilder.lit(" "))
          .then(RegexBuilder.lit("world"));
        const ast = pattern.getAst();
        const result = service.optimize(ast); // Pure function call
        return result.nodesReduced > 0;
      });

      expect(
        program.pipe(
          Effect.provide(RegexBuilderService.Default),
          Effect.runSync
        )
      ).toBe(true);
    });
  });

  describe("ValidationService", () => {
    it("should test patterns through service", async () => {
      const program = Effect.gen(function* () {
        const service = yield* ValidationService;
        const result = yield* service.test(
          "\\d+",
          [
            { input: "123", shouldMatch: true },
            { input: "abc", shouldMatch: false },
          ],
          "js",
          100
        );
        return result.passed;
      });

      expect(
        await program.pipe(
          Effect.provide(ValidationService.Default),
          Effect.runPromise
        )
      ).toBe(2);
    });

    it("should validate dialect compatibility through service", () => {
      const program = Effect.gen(function* () {
        const service = yield* ValidationService;
        const pattern = RegexBuilder.digit().oneOrMore();
        const result = yield* service.validateForDialect(pattern, "js");
        return result.valid;
      });

      expect(
        program.pipe(Effect.provide(ValidationService.Default), Effect.runSync)
      ).toBe(true);
    });
  });

  describe("Service Composition", () => {
    it("should compose multiple services", async () => {
      const program = Effect.gen(function* () {
        const regexService = yield* RegexBuilderService;
        const validationService = yield* ValidationService;

        // Build a pattern
        const pattern = RegexBuilder.digit().oneOrMore();

        // Emit it
        const emitted = yield* regexService.emit(pattern, "js");

        // Test it
        const tested = yield* validationService.test(
          emitted.pattern,
          [
            { input: "123", shouldMatch: true },
            { input: "abc", shouldMatch: false },
          ],
          "js"
        );

        return tested.passed === 2;
      });

      // Provide both layers
      expect(
        await program.pipe(
          Effect.provide(RegexBuilderService.Default),
          Effect.provide(ValidationService.Default),
          Effect.runPromise
        )
      ).toBe(true);
    });
  });
});
