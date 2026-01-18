export type BlockStatus =
  | "idle"
  | "running"
  | "success"
  | "failure"
  | "interrupted";

export interface Block {
  readonly id: string;
  readonly command: string;
  readonly status: BlockStatus;
  readonly exitCode?: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly metadata: Record<string, any>;
}
