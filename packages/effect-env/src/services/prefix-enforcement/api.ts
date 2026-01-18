import { Effect } from "effect";

import type { PrefixError } from "@/effect-env/services/prefix-enforcement/errors.js";
import type { PrefixEnforcementOptions } from "@/effect-env/services/prefix-enforcement/types.js";

export interface PrefixEnforcement {
  readonly enforceClientPrefix: (
    clientKeys: ReadonlyArray<string>,
    options: PrefixEnforcementOptions
  ) => Effect.Effect<void, PrefixError>;
}
