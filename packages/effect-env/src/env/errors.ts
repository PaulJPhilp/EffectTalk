import { Data } from "effect";

export class EnvError extends Data.TaggedError("EnvError")<{
  readonly message: string;
  readonly key?: string;
  readonly cause?: Error;
}> {
  get [Symbol.toStringTag]() {
    return this.message;
  }

  constructor(
    input:
      | string
      | {
          readonly message: string;
          readonly key?: string;
          readonly cause?: Error;
        }
  ) {
    if (typeof input === "string") {
      super({ message: input });
    } else {
      super(input);
    }
  }
}

export class MissingVarError extends Data.TaggedError("MissingVarError")<{
  readonly key: string;
  readonly cause?: Error;
}> {
  override get message(): string {
    return `Missing required environment variable: ${this.key}`;
  }

  get [Symbol.toStringTag]() {
    return this.message;
  }

  constructor(
    input: string | { readonly key: string; readonly cause?: Error }
  ) {
    if (typeof input === "string") {
      super({ key: input });
    } else {
      super(input);
    }
  }
}
