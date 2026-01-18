import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

type WorkspacePackage = {
	name: string;
	workspacePath: string;
	packageJsonPath: string;
};

function run(
	command: string,
	args: ReadonlyArray<string>,
	cwd: string,
): void {
	const result = spawnSync(command, [...args], {
		cwd,
		stdio: "inherit",
		env: process.env,
	});

	if (result.status !== 0) {
		throw new Error(
			`Command failed: ${command} ${args.join(" ")}`,
		);
	}
}

function runCapture(
	command: string,
	args: ReadonlyArray<string>,
	cwd: string,
): string {
	const result = spawnSync(command, [...args], {
		cwd,
		stdio: ["ignore", "pipe", "inherit"],
		env: process.env,
		encoding: "utf8",
	});

	if (result.status !== 0) {
		throw new Error(
			`Command failed: ${command} ${args.join(" ")}`,
		);
	}

	return (result.stdout ?? "").trim();
}

function readJsonFile<T>(filePath: string): T {
	return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function getWorkspacePackages(repoRoot: string): Array<WorkspacePackage> {
	const rootPkg = readJsonFile<{ workspaces?: Array<string> }>(
		path.join(repoRoot, "package.json"),
	);

	const workspaces = rootPkg.workspaces ?? [];
	return workspaces.map((workspacePath) => {
		const packageJsonPath = path.join(repoRoot, workspacePath, "package.json");
		const pkg = readJsonFile<{ name: string }>(packageJsonPath);

		return {
			name: pkg.name,
			workspacePath,
			packageJsonPath,
		};
	});
}

function writeFile(filePath: string, contents: string): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, contents, "utf8");
}

function main(): void {
	const repoRoot = process.cwd();

	const tscBin = path.join(repoRoot, "node_modules", ".bin", "tsc");
	if (!fs.existsSync(tscBin)) {
		throw new Error(
			"Missing TypeScript binary. Run `bun install` at repo root.",
		);
	}

	const packages = getWorkspacePackages(repoRoot);

	const tmpBase = fs.mkdtempSync(
		path.join(os.tmpdir(), "hume-consumer-smoke-"),
	);
	const tarballsDir = path.join(tmpBase, "tarballs");
	fs.mkdirSync(tarballsDir, { recursive: true });

	try {
		run("npm", ["--version"], repoRoot);
	} catch {
		throw new Error(
			"Missing npm. Install Node.js/npm to run consumer smoke tests.",
		);
	}

	try {
		const tarballByName = new Map<string, string>();
		for (const pkg of packages) {
			const absPkgPath = path.join(repoRoot, pkg.workspacePath);
			const tarballName = runCapture(
				"npm",
				[
					"pack",
					"--silent",
					"--pack-destination",
					tarballsDir,
				],
				absPkgPath,
			);
			const tarballPath = path.join(tarballsDir, tarballName);
			if (!fs.existsSync(tarballPath)) {
				throw new Error(
					`Pack output missing: ${tarballPath}`,
				);
			}
			tarballByName.set(pkg.name, tarballPath);
		}

		const allWorkspaceDeps: Record<string, string> = {};
		for (const [name, tarballPath] of tarballByName.entries()) {
			allWorkspaceDeps[name] = `file:${tarballPath}`;
		}

		for (const pkg of packages) {
			const consumerDir = path.join(tmpBase, pkg.name);
			fs.mkdirSync(consumerDir, { recursive: true });
			const tarballPath = tarballByName.get(pkg.name);
			if (tarballPath === undefined) {
				throw new Error(`Missing tarball for ${pkg.name}`);
			}

			writeFile(
				path.join(consumerDir, "package.json"),
				JSON.stringify(
					{
						name: "consumer-smoke",
						private: true,
						type: "module",
						devDependencies: {
							"@types/node": "^20.19.25",
						},
						dependencies: {
							...allWorkspaceDeps,
							[pkg.name]: `file:${tarballPath}`,
						},
					},
					null,
					2,
				) + "\n",
			);

			writeFile(
				path.join(consumerDir, "tsconfig.json"),
				JSON.stringify(
					{
						compilerOptions: {
							target: "ES2022",
							module: "NodeNext",
							moduleResolution: "NodeNext",
							types: ["node"],
							strict: true,
							skipLibCheck: false,
							noEmit: true,
						},
						include: ["index.ts"],
					},
					null,
					2,
				) + "\n",
			);

			writeFile(
				path.join(consumerDir, "index.ts"),
				`import * as mod from "${pkg.name}";\n` +
				"void mod;\n",
			);

			writeFile(
				path.join(consumerDir, "index.mjs"),
				`import * as mod from "${pkg.name}";\n` +
				"if (!mod) throw new Error(\"Import failed\");\n" +
				"console.log(\"ok\");\n",
			);

			console.log(`\n[consumer-smoke] Installing ${pkg.name}`);
			run("npm", ["install", "--silent"], consumerDir);

			console.log(`[consumer-smoke] Runtime import ${pkg.name}`);
			run("node", ["index.mjs"], consumerDir);

			console.log(`[consumer-smoke] Typecheck ${pkg.name}`);
			run(tscBin, ["--pretty", "false"], consumerDir);
		}
	} finally {
		fs.rmSync(tmpBase, { recursive: true, force: true });
	}
}

main();
