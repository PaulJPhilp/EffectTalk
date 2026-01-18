import { Effect } from "effect";
import { describe, expect, it } from "vitest";
import { TypeDetectionService } from "../../src/services/type-detection-service.js";

describe("TypeDetectionService", () => {
  it("should detect TypeScript code with filename hint", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TypeDetectionService;

      const type = yield* service.detectType(
        "function greet(name: string): string { return `Hello, ${name}!`; }",
        { filename: "greet.ts" }
      );

      return type;
    });

    const type = await Effect.runPromise(
      program.pipe(Effect.provide(TypeDetectionService.Default))
    );

    expect(type.category).toBe("code");
  });

  it("should detect Python code with filename hint", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TypeDetectionService;

      const type = yield* service.detectType(
        "def greet(name: str) -> str:\n  return f'Hello, {name}!'",
        { filename: "greet.py" }
      );

      return type;
    });

    const type = await Effect.runPromise(
      program.pipe(Effect.provide(TypeDetectionService.Default))
    );

    expect(type.category).toBe("code");
  });

  it("should detect JSON data", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TypeDetectionService;

      const type = yield* service.detectType('{"name": "John", "age": 30}');

      return type;
    });

    const type = await Effect.runPromise(
      program.pipe(Effect.provide(TypeDetectionService.Default))
    );

    expect(type.category).toBe("data");
  });

  it("should detect diagram with filename hint", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TypeDetectionService;

      const type = yield* service.detectType(
        "graph TD\n  A[Start] --> B[Process]\n  B --> C[End]",
        { filename: "flow.mmd" }
      );

      return type;
    });

    const type = await Effect.runPromise(
      program.pipe(Effect.provide(TypeDetectionService.Default))
    );

    expect(type.category).toBe("diagram");
  });

  it("should detect markdown document", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TypeDetectionService;

      const type = yield* service.detectType(
        "# Heading\n\nThis is a paragraph with **bold** text."
      );

      return type;
    });

    const type = await Effect.runPromise(
      program.pipe(Effect.provide(TypeDetectionService.Default))
    );

    expect(type.category).toBe("document");
  });

  it("should detect HTML markup", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TypeDetectionService;

      const type = yield* service.detectType(
        "<div><h1>Hello</h1><p>World</p></div>"
      );

      return type;
    });

    const type = await Effect.runPromise(
      program.pipe(Effect.provide(TypeDetectionService.Default))
    );

    expect(type.category).toBe("markup");
  });

  it("should detect plain text as document", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TypeDetectionService;

      const type = yield* service.detectType("This is just plain text content");

      return type;
    });

    const type = await Effect.runPromise(
      program.pipe(Effect.provide(TypeDetectionService.Default))
    );

    expect(type.category).toBe("document");
  });

  it("should use filename hint for type detection", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TypeDetectionService;

      const type = yield* service.detectType("some content", {
        filename: "script.py",
      });

      return type;
    });

    const type = await Effect.runPromise(
      program.pipe(Effect.provide(TypeDetectionService.Default))
    );

    expect(type.category).toBe("code");
    expect(type.language).toBe("python");
  });

  it("should detect language from content", async () => {
    const program = Effect.gen(function* () {
      const service = yield* TypeDetectionService;

      const rustCode = 'fn main() { println!("Hello, World!"); }';
      const language = yield* service.detectLanguage(rustCode);

      return language;
    });

    const language = await Effect.runPromise(
      program.pipe(Effect.provide(TypeDetectionService.Default))
    );

    expect(language).toBeDefined();
  });
});
