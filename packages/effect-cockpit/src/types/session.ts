import type { Block } from "./block.js";

export interface RetentionConfig {
  readonly fullContentBlocks: number;
  readonly maxTotalBlocks: number;
}

export interface Session {
  readonly id: string;
  readonly blocks: Array<Block>;
  readonly activeBlockId: string | null;
  readonly focusedBlockId: string | null;
  readonly workingDirectory: string;
  readonly environment: Record<string, string>;
  readonly retentionConfig: RetentionConfig;
}
