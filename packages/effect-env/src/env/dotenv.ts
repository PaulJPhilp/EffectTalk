import dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";

export interface LoadEnvFilesOptions {
  readonly cwd?: string;
}

export const loadEnvFiles = (
  env: string,
  options?: LoadEnvFilesOptions
): void => {
  const cwd = options?.cwd ?? process.cwd();

  const files = [
    path.join(cwd, ".env"),
    path.join(cwd, ".env.local"),
    path.join(cwd, `.env.${env}`),
    path.join(cwd, `.env.${env}.local`),
  ];

  files.forEach((file, idx) => {
    if (fs.existsSync(file)) {
      dotenv.config({ path: file, override: idx > 0 });
    }
  });
};
