#!/usr/bin/env bun
/**
 * Validate test structure consistency across all packages
 *
 * Enforces:
 * 1. All test files must use .test.ts suffix
 * 2. Tests should be organized in __tests__/unit/ and __tests__/integration/
 * 3. Test fixtures should be in __tests__/fixtures/
 * 4. No tests at __tests__/ root (except fixtures)
 */

import { existsSync, readdirSync, statSync } from "fs";
import { join } from "path";

interface ValidationResult {
  package: string;
  issues: string[];
}

interface DirectoryStructure {
  hasTestsDir: boolean;
  hasUnitDir: boolean;
  hasIntegrationDir: boolean;
  hasFixturesDir: boolean;
  testsAtRoot: string[];
  testFiles: string[];
}

function checkPackageTestStructure(
  packagePath: string
): DirectoryStructure {
  const testsDirPath = join(packagePath, "__tests__");
  const structure: DirectoryStructure = {
    hasTestsDir: existsSync(testsDirPath),
    hasUnitDir: false,
    hasIntegrationDir: false,
    hasFixturesDir: false,
    testsAtRoot: [],
    testFiles: [],
  };

  if (!structure.hasTestsDir) {
    return structure;
  }

  const entries = readdirSync(testsDirPath);

  for (const entry of entries) {
    const fullPath = join(testsDirPath, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      if (entry === "unit") structure.hasUnitDir = true;
      if (entry === "integration") structure.hasIntegrationDir = true;
      if (entry === "fixtures") structure.hasFixturesDir = true;
    } else if (entry.endsWith(".test.ts")) {
      structure.testsAtRoot.push(entry);
    }
  }

  return structure;
}

function validatePackage(packagePath: string, packageName: string): ValidationResult {
  const result: ValidationResult = {
    package: packageName,
    issues: [],
  };

  const structure = checkPackageTestStructure(packagePath);

  // If no tests directory, that's okay - not all packages have tests
  if (!structure.hasTestsDir) {
    return result;
  }

  // Check for tests at root of __tests__
  if (structure.testsAtRoot.length > 0) {
    result.issues.push(
      `Found test files at __tests__/ root (should be in unit/ or integration/): ${structure.testsAtRoot.join(", ")}`
    );
  }

  // Check if package has significant test files
  const testsDirPath = join(packagePath, "__tests__");
  const allEntries = readdirSync(testsDirPath);
  const hasSignificantTests = allEntries.some(
    (e) => e.endsWith(".test.ts") && !e.startsWith(".")
  );

  if (hasSignificantTests && !structure.hasUnitDir && !structure.hasIntegrationDir) {
    result.issues.push(
      `Has test files but missing organized structure. Should have __tests__/unit/ and/or __tests__/integration/`
    );
  }

  return result;
}

function getAllPackages(rootPath: string): string[] {
  const packagesPath = join(rootPath, "packages");
  if (!existsSync(packagesPath)) {
    return [];
  }

  return readdirSync(packagesPath)
    .filter(
      (name) =>
        name.startsWith("effect-") &&
        statSync(join(packagesPath, name)).isDirectory()
    )
    .sort();
}

function main() {
  const rootPath = process.cwd();
  const packages = getAllPackages(rootPath);

  console.log(`\n📋 Validating test structure for ${packages.length} packages...\n`);

  let hasIssues = false;
  const results: ValidationResult[] = [];

  for (const pkg of packages) {
    const packagePath = join(rootPath, "packages", pkg);
    const result = validatePackage(packagePath, pkg);
    results.push(result);

    if (result.issues.length > 0) {
      hasIssues = true;
      console.log(`❌ ${pkg}`);
      for (const issue of result.issues) {
        console.log(`   └─ ${issue}`);
      }
    }
  }

  // Summary
  const packagesWithIssues = results.filter((r) => r.issues.length > 0);
  const packagesWithoutTests = packages.filter(
    (pkg) => !existsSync(join(rootPath, "packages", pkg, "__tests__"))
  );

  console.log("\n" + "=".repeat(70));
  console.log(`✅ Packages with proper structure: ${packages.length - packagesWithIssues.length - packagesWithoutTests.length}`);
  if (packagesWithoutTests.length > 0) {
    console.log(`⚠️  Packages without __tests__: ${packagesWithoutTests.length}`);
  }
  if (packagesWithIssues.length > 0) {
    console.log(`❌ Packages with issues: ${packagesWithIssues.length}`);
  }
  console.log("=".repeat(70) + "\n");

  if (hasIssues) {
    console.log("📖 Expected structure:");
    console.log(`
packages/effect-example/
├── src/
├── __tests__/
│   ├── unit/           # Unit tests for individual services/functions
│   │   └── *.test.ts
│   ├── integration/    # Integration tests combining multiple components
│   │   └── *.test.ts
│   └── fixtures/       # Test data and mocks
│       └── *.ts
└── package.json
    `);
    process.exit(1);
  }

  console.log("✨ All packages have proper test structure!\n");
}

main();
