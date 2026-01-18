import { Effect } from "effect";

import type { PrefixError } from "./errors.js";
import type { PrefixEnforcementOptions } from "./types.js";

export interface PrefixEnforcement {
  readonly enforceClientPrefix: (
    clientKeys: ReadonlyArray<string>,
    options: PrefixEnforcementOptions
  ) => Effect.Effect<void, PrefixError>;
}
