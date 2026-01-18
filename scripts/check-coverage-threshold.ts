#!/usr/bin/env bun

import { readdir, readFile } from "fs/promises"
import { join } from "path"

const THRESHOLD = 85

interface CoverageSummary {
  lines: { total: number; covered: number; skipped: number; pct: number }
  statements: { total: number; covered: number; skipped: number; pct: number }
  functions: { total: number; covered: number; skipped: number; pct: number }
  branches: { total: number; covered: number; skipped: number; pct: number }
}

async function checkCoverageThreshold(): Promise<void> {
  const packagesDir = join(import.meta.dir, "..", "packages")
  const entries = await readdir(packagesDir, { withFileTypes: true })

  const failedPackages: string[] = []
  let totalLines = 0
  let totalStatements = 0
  let totalFunctions = 0
  let totalBranches = 0
  let packageCount = 0

  // Check each package's coverage
  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const packageName = entry.name

    // Skip documentation packages
    if (packageName === "effect-models-website") {
      continue
    }

    const coveragePath = join(packagesDir, packageName, "coverage", "coverage-summary.json")

    try {
      const content = await readFile(coveragePath, "utf-8")
      const data = JSON.parse(content)

      if (data.total) {
        const summary = data.total as CoverageSummary
        const lines = Math.round(summary.lines.pct)
        const statements = Math.round(summary.statements.pct)
        const functions = Math.round(summary.functions.pct)
        const branches = Math.round(summary.branches.pct)

        totalLines += lines
        totalStatements += statements
        totalFunctions += functions
        totalBranches += branches
        packageCount++

        // Check if package meets threshold
        const meetsThreshold = lines >= THRESHOLD && statements >= THRESHOLD && functions >= THRESHOLD && branches >= THRESHOLD

        if (!meetsThreshold) {
          failedPackages.push(
            `${packageName} (Lines: ${lines}%, Statements: ${statements}%, Functions: ${functions}%, Branches: ${branches}%)`
          )
        }
      }
    } catch {
      // No coverage file - this is a failure
      failedPackages.push(`${packageName} (no coverage data)`)
    }
  }

  const avgLines = Math.round(totalLines / packageCount)
  const avgStatements = Math.round(totalStatements / packageCount)
  const avgFunctions = Math.round(totalFunctions / packageCount)
  const avgBranches = Math.round(totalBranches / packageCount)

  console.log("\n" + "=".repeat(80))
  console.log("🔍 Coverage Threshold Check")
  console.log("=".repeat(80) + "\n")

  console.log(`Threshold: ${THRESHOLD}%\n`)

  console.log("Average Coverage:")
  console.log(`  Lines:      ${avgLines}%`)
  console.log(`  Statements: ${avgStatements}%`)
  console.log(`  Functions:  ${avgFunctions}%`)
  console.log(`  Branches:   ${avgBranches}%\n`)

  if (failedPackages.length === 0) {
    console.log(`✅ All packages meet ${THRESHOLD}% coverage threshold!`)
    console.log("=".repeat(80) + "\n")
    process.exit(0)
  } else {
    console.log(`❌ ${failedPackages.length} package(s) below ${THRESHOLD}% threshold:\n`)
    for (const pkg of failedPackages) {
      console.log(`   - ${pkg}`)
    }
    console.log("\n" + "=".repeat(80) + "\n")
    process.exit(1)
  }
}

checkCoverageThreshold().catch((err) => {
  console.error("❌ Error checking coverage threshold:", err)
  process.exit(1)
})
