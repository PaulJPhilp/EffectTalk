import { Effect } from "effect";

import type { PrefixEnforcement } from "./api.js";
import type {
  PrefixEnforcementConfig,
  PrefixEnforcementOptions,
} from "./types.js";
import { PrefixError } from "./errors.js";

const makePrefixEnforcement = (
  _config: PrefixEnforcementConfig
): PrefixEnforcement => ({
  enforceClientPrefix: (clientKeys, options) => {
    const violations = clientKeys.filter(
      (key) => !key.startsWith(options.clientPrefix)
    );

    if (violations.length > 0) {
      return Effect.fail(
        new PrefixError({
          mode: "client",
          keys: violations,
          message: `Client variables must start with "${options.clientPrefix}": ${violations.join(", ")}`,
        })
      );
    }

    return Effect.void;
  },
});

export const PrefixEnforcementService = Effect.Service<PrefixEnforcement>()(
  "PrefixEnforcementService",
  {
    accessors: true,
    effect: (config: PrefixEnforcementConfig) =>
      Effect.succeed(makePrefixEnforcement(config)),
  }
);
