import { Effect, Schema } from "effect";
import { describe, expect, it } from "vitest";
import { parse, stringify } from "../src/api.js";
import usersFixture from "./fixtures/users.js";
import productsFixture from "./fixtures/products.js";

const fixtures = {
  users: usersFixture,
  products: productsFixture,
};

describe("CSV Golden Tests", () => {
  Object.entries(fixtures).forEach(([fixtureName, fixture]) => {
    describe(fixtureName, () => {
      Object.entries(fixture).forEach(([testName, testCase]) => {
        const { data, raw, __metadata } = testCase;
        // biome-ignore lint/suspicious/noExplicitAny: schema is properly typed in fixtures
        const schema = (testCase as any).schema;
        const { should_parse, should_validate, round_trip } = __metadata;

        if (should_parse && should_validate) {
          it(`should parse and validate: ${testName}`, async () => {
            const result = await Effect.runPromise(parse(schema, raw));
            expect(result).toEqual(data);
          });
        }

        if (round_trip) {
          it(`should round-trip: ${testName}`, async () => {
            const csv = await Effect.runPromise(stringify(schema, data));
            const parsed = await Effect.runPromise(parse(schema, csv));
            expect(parsed).toEqual(data);
          });
        }
      });
    });
  });
});
