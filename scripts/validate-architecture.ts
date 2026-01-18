#!/usr/bin/env bun
/**
 * Validate layer architecture constraints
 *
 * Enforces:
 * 1. Layer 1 (Resources): Zero workspace dependencies (except lateral)
 * 2. Layer 2 (Content): Can depend on Layer 1 only
 * 3. Layer 3 (Services): Can depend on Layer 1 and 2
 * 4. No upward dependencies (strict downward only)
 *
 * Layer Classification:
 * - Layer 1: effect-json, effect-env, effect-regex (zero external deps)
 * - Layer 2: Format libraries (effect-yaml, effect-toml, etc.) + orchestration (effect-prompt, effect-models)
 * - Layer 3: External services (effect-repository, effect-git, etc.)
 */

import { join } from "path";
import { readFileSync } from "fs";

interface LayerDefinition {
  packages: string[];
  name: string;
  allowedDeps: number[]; // Layer numbers allowed to depend on
}

interface PackageInfo {
  name: string;
  layer: number;
  deps: string[];
}

interface ValidationResult {
  package: string;
  layer: number;
  issues: string[];
}

const LAYERS: LayerDefinition[] = [
  {
    name: "Layer 1 (Resources)",
    packages: ["effect-json", "effect-env", "effect-regex"],
    allowedDeps: [1], // Only same layer (lateral)
  },
  {
    name: "Layer 2 (Content Capabilities)",
    packages: [
      "effect-yaml",
      "effect-toml",
      "effect-xml",
      "effect-xmp",
      "effect-csv",
      "effect-mdx",
      "effect-liquid",
      "effect-models",
      "effect-prompt",
      "effect-attachment",
      "effect-image",
      "effect-html",
    ],
    allowedDeps: [1, 2], // Layer 1 and same layer
  },
  {
    name: "Layer 3 (Service Providers)",
    packages: [
      "effect-repository",
      "effect-prompt-cli",
      "effect-telemetry",
      "effect-pdf",
    ],
    allowedDeps: [1, 2, 3], // Any layer
  },
];

function classifyPackage(name: string): number {
  for (let i = 0; i < LAYERS.length; i++) {
    if (LAYERS[i].packages.includes(name)) {
      return i + 1;
    }
  }
  return -1; // Unknown package
}

function getPackageJson(packagePath: string): any {
  try {
    const content = readFileSync(join(packagePath, "package.json"), "utf-8");
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function getWorkspaceDependencies(packageJson: any): string[] {
  const deps = new Set<string>();

  // Check all dependency types
  for (const depType of ["dependencies", "devDependencies", "peerDependencies"]) {
    const section = packageJson[depType] || {};
    for (const [name, version] of Object.entries(section)) {
      if (typeof version === "string" && version.includes("workspace:")) {
        // Extract package name (remove @scope/ prefix if present)
        const baseName = name.includes("/") ? name.split("/")[1] : name;
        deps.add(baseName);
      }
    }
  }

  return Array.from(deps);
}

function validatePackage(
  packageName: string,
  packagePath: string
): ValidationResult {
  const packageLayer = classifyPackage(packageName);
  const result: ValidationResult = {
    package: packageName,
    layer: packageLayer,
    issues: [],
  };

  if (packageLayer === -1) {
    // Unknown package - might be website or special package
    return result;
  }

  const packageJson = getPackageJson(packagePath);
  const deps = getWorkspaceDependencies(packageJson);
  const layerDef = LAYERS[packageLayer - 1];

  for (const dep of deps) {
    const depLayer = classifyPackage(dep);

    if (depLayer === -1) {
      // Unknown package - skip validation
      continue;
    }

    if (!layerDef.allowedDeps.includes(depLayer)) {
      result.issues.push(
        `Depends on ${dep} (Layer ${depLayer}) but ${layerDef.name} can only depend on Layers ${layerDef.allowedDeps.join(", ")}`
      );
    }
  }

  return result;
}

function main() {
  const rootPath = process.cwd();

  console.log("\n🏗️  Validating layer architecture...\n");

  // Print layer definitions
  for (const layer of LAYERS) {
    console.log(`${layer.name}: ${layer.packages.join(", ")}`);
  }
  console.log("");

  let hasIssues = false;
  const results: ValidationResult[] = [];

  for (const layer of LAYERS) {
    for (const pkg of layer.packages) {
      const packagePath = join(rootPath, "packages", pkg);
      const result = validatePackage(pkg, packagePath);
      results.push(result);

      if (result.issues.length > 0) {
        hasIssues = true;
        console.log(`❌ ${pkg}`);
        for (const issue of result.issues) {
          console.log(`   └─ ${issue}`);
        }
      }
    }
  }

  // Summary
  const packagesWithIssues = results.filter((r) => r.issues.length > 0);

  console.log("\n" + "=".repeat(70));
  console.log(`✅ Packages with correct dependencies: ${results.length - packagesWithIssues.length}`);
  if (packagesWithIssues.length > 0) {
    console.log(`❌ Packages with violations: ${packagesWithIssues.length}`);
  }
  console.log("=".repeat(70) + "\n");

  if (hasIssues) {
    console.log("📖 Architecture rules:");
    console.log(`
  Layer 1 (Resources) - Zero external dependencies
    ├─ effect-json
    ├─ effect-env
    └─ effect-regex

  Layer 2 (Content) - Depend on Layer 1 only
    ├─ effect-yaml, effect-toml, effect-xml, etc. (Format libraries)
    ├─ effect-liquid (Template engine)
    ├─ effect-mdx (Content processing)
    ├─ effect-models (LLM integration)
    └─ effect-prompt (Prompt management)

  Layer 3 (Services) - Depend on Layer 1 and 2
    ├─ effect-repository
    ├─ effect-prompt-cli
    └─ effect-telemetry
    `);
    process.exit(1);
  }

  console.log("✨ Architecture constraints satisfied!\n");
}

main();
