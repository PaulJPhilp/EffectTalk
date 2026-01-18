#!/usr/bin/env bun

import { readdir, readFile } from "fs/promises"
import { join } from "path"

interface CoverageSummary {
  lines: { total: number; covered: number; skipped: number; pct: number }
  statements: { total: number; covered: number; skipped: number; pct: number }
  functions: { total: number; covered: number; skipped: number; pct: number }
  branches: { total: number; covered: number; skipped: number; pct: number }
}

interface PackageCoverage {
  name: string
  lines: number
  statements: number
  functions: number
  branches: number
}

async function aggregateCoverage(): Promise<void> {
  const packagesDir = join(import.meta.dir, "..", "packages")
  const entries = await readdir(packagesDir, { withFileTypes: true })

  const results: PackageCoverage[] = []
  const errors: string[] = []

  // Read coverage-summary.json from each package
  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const packageName = entry.name
    const coveragePath = join(packagesDir, packageName, "coverage", "coverage-summary.json")

    try {
      const content = await readFile(coveragePath, "utf-8")
      const data = JSON.parse(content)

      // coverage-summary.json has a "total" key with the aggregate
      if (data.total) {
        const summary = data.total as CoverageSummary
        results.push({
          name: packageName,
          lines: Math.round(summary.lines.pct),
          statements: Math.round(summary.statements.pct),
          functions: Math.round(summary.functions.pct),
          branches: Math.round(summary.branches.pct),
        })
      }
    } catch {
      // No coverage file found, skip this package
    }
  }

  // Sort by package name
  results.sort((a, b) => a.name.localeCompare(b.name))

  // Calculate aggregate
  if (results.length === 0) {
    console.log("❌ No coverage data found. Run 'bun run test:coverage' first.")
    process.exit(1)
  }

  const totalLines = results.reduce((sum, r) => sum + r.lines, 0) / results.length
  const totalStatements = results.reduce((sum, r) => sum + r.statements, 0) / results.length
  const totalFunctions = results.reduce((sum, r) => sum + r.functions, 0) / results.length
  const totalBranches = results.reduce((sum, r) => sum + r.branches, 0) / results.length

  // Display results
  console.log("\n" + "=".repeat(80))
  console.log("📊 Test Coverage Aggregate Report")
  console.log("=".repeat(80) + "\n")

  console.log("Package-Level Coverage:\n")
  console.log("Package                          Lines  Statements  Functions  Branches")
  console.log("-".repeat(80))

  for (const result of results) {
    const name = result.name.padEnd(30)
    const lines = String(result.lines).padStart(5) + "%"
    const statements = String(result.statements).padStart(10) + "%"
    const functions = String(result.functions).padStart(10) + "%"
    const branches = String(result.branches).padStart(10) + "%"

    console.log(`${name} ${lines} ${statements} ${functions} ${branches}`)
  }

  console.log("\n" + "-".repeat(80))
  console.log(
    `${"AGGREGATE".padEnd(30)} ${String(Math.round(totalLines)).padStart(5)}% ${String(Math.round(totalStatements)).padStart(10)}% ${String(Math.round(totalFunctions)).padStart(10)}% ${String(Math.round(totalBranches)).padStart(10)}%`
  )
  console.log("=".repeat(80) + "\n")

  // Summary
  const threshold = 85
  const meetsThreshold =
    totalLines >= threshold && totalStatements >= threshold && totalFunctions >= threshold && totalBranches >= threshold

  if (meetsThreshold) {
    console.log(`✅ Coverage meets ${threshold}% threshold across all metrics`)
    process.exit(0)
  } else {
    console.log(`⚠️  Coverage below ${threshold}% threshold:`)
    if (totalLines < threshold) console.log(`   - Lines: ${Math.round(totalLines)}% (need ${threshold}%)`)
    if (totalStatements < threshold) console.log(`   - Statements: ${Math.round(totalStatements)}% (need ${threshold}%)`)
    if (totalFunctions < threshold) console.log(`   - Functions: ${Math.round(totalFunctions)}% (need ${threshold}%)`)
    if (totalBranches < threshold) console.log(`   - Branches: ${Math.round(totalBranches)}% (need ${threshold}%)`)
    process.exit(1)
  }
}

aggregateCoverage().catch((err) => {
  console.error("❌ Error aggregating coverage:", err)
  process.exit(1)
})
