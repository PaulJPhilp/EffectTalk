import type { Effect } from "effect";
import type { Block } from "./block.js";

export interface Plugin {
	readonly name: string;
	readonly version: string;
	readonly onBlockComplete?: (block: Block) => Effect.Effect<void>;
	readonly customRenderers?: Record<string, React.FC<{ block: Block }>>;
}
