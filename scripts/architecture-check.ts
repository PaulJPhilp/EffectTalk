import * as fs from "node:fs";
import * as path from "node:path";

const REPO_ROOT = process.cwd();
const PACKAGES_DIR = path.join(REPO_ROOT, "packages");

const EXCLUDED_DIRS = new Set(["node_modules", "dist", "coverage"]);

const FORBIDDEN_SUBSTRINGS = ["Context.Tag", "Context.GenericTag"];

const FORBIDDEN_EXPORTED_IDENTIFIER =
	/\bexport\s+(?:const|let|var|class|function|type|interface)\s+\w+(Live|Impl|Implementation)\b/;

function isTypeScriptFile(filePath: string): boolean {
	return filePath.endsWith(".ts") || filePath.endsWith(".tsx");
}

function walk(dirPath: string, out: string[]): void {
	for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
		if (entry.isDirectory()) {
			if (EXCLUDED_DIRS.has(entry.name)) continue;
			walk(path.join(dirPath, entry.name), out);
			continue;
		}

		const filePath = path.join(dirPath, entry.name);
		if (isTypeScriptFile(filePath)) out.push(filePath);
	}
}

function checkFile(filePath: string): string[] {
	const text = fs.readFileSync(filePath, "utf8");
	const rel = path.relative(REPO_ROOT, filePath);
	const violations: string[] = [];

	for (const forbidden of FORBIDDEN_SUBSTRINGS) {
		if (text.includes(forbidden)) {
			violations.push(`${rel}: contains '${forbidden}'`);
		}
	}

	const match = text.match(FORBIDDEN_EXPORTED_IDENTIFIER);
	if (match) {
		violations.push(
			`${rel}: exports forbidden identifier ending with '${match[1]}'`,
		);
	}

	return violations;
}

function main(): void {
	if (!fs.existsSync(PACKAGES_DIR)) {
		throw new Error("Missing packages/ directory");
	}

	const files: string[] = [];
	walk(PACKAGES_DIR, files);

	const violations = files.flatMap(checkFile);
	if (violations.length > 0) {
		for (const v of violations) console.error(v);
		process.exit(1);
	}
}

main();
