# Contributing to EffectTalk

Thank you for your interest in contributing to EffectTalk! This document outlines the development workflow, code standards, and release process.

## Development Workflow

### Prerequisites

- **Bun 1.1.33+** - Get it at https://bun.sh
- **Node.js 18.18+** - Required for compatibility checks
- **Git** - For version control

### Setup

```bash
# Clone the repository
git clone https://github.com/PaulJPhilp/EffectTalk.git
cd EffectTalk

# Install dependencies
bun install

# Verify setup
bun run verify
```

### Making Changes

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**
   - Edit files in appropriate `packages/` directories
   - Follow the code standards outlined below

3. **Test locally**
   ```bash
   # Test specific package
   bun run --filter effect-json test:watch

   # Test all packages
   bun run test

   # Full verification
   bun run verify
   ```

4. **Add a changeset** (before committing)
   ```bash
   # Prompts you to select changed packages and version bump
   bun run changeset:add

   # View status of pending changesets
   bun run changeset:status
   ```

5. **Commit changes**
   ```bash
   # Use conventional commit format
   git commit -m "feat(effect-json): Add support for streaming large files"
   # or
   git commit -m "fix(effect-cli-tui): Fix color output in dark terminals"
   ```

6. **Push and create a Pull Request**
   ```bash
   git push origin feature/your-feature-name
   ```

## Code Standards

### TypeScript

- **Strict mode enabled**: `noUncheckedIndexedAccess: true`, `exactOptionalPropertyTypes: true`
- **No implicit `any`**: Always provide explicit types
- **Import `.js` extensions**: Required for ESM compatibility
- **No double casts**: `as unknown as Type` is forbidden

### Services & Architecture

**All services must use Effect.Service pattern:**
```typescript
export class MyService extends Effect.Service<MyService>()(
  "MyService",
  {
    effect: Effect.fn(function* (config: ConfigType) {
      return {
        method: (arg) => Effect.sync(() => { /* ... */ }),
      } satisfies MyServiceApi;
    }),
  }
) {}
```

**Error handling with Data.TaggedError:**
```typescript
export class MyError extends Data.TaggedError("MyError")<{
  readonly field: string;
  readonly cause?: Error;
}> {}
```

### Validation

- **Use Effect.Schema** (not Zod) for all input validation
- **Prefer Schema.Class** over Schema.Struct for entity definitions
- **Test error paths** with `Effect.catchTag()`

### Testing

- **No mocking external dependencies** - Use real implementations or skip gracefully
- **Organize tests** in `__tests__/unit/`, `__tests__/integration/`, `__tests__/fixtures/`
- **Aim for 85% coverage** (validate with `bun run test:coverage:check`)
- **Test structure validation** via `bun run check:test-structure`

### Code Quality

- **Biome** handles formatting and linting automatically
- **Run before committing**: `bun run format:fix && bun run lint`
- **No manual formatting needed** - Biome enforces consistency

## Pull Request Process

1. **Ensure tests pass**
   ```bash
   bun run verify
   ```

2. **Include a changeset**
   ```bash
   bun run changeset:add
   ```
   - Follow the prompts to select packages and version bump type

3. **Write a clear PR description**
   - Explain the problem being solved
   - Describe the solution
   - Reference related issues (if any)

4. **Link changesets in PR description**
   - Mention the changeset files created
   - Example: "Changesets: `.changeset/cool-monkeys-34.md`"

5. **Wait for CI checks to pass**
   - All tests must pass
   - All linting checks must pass
   - Coverage thresholds must be met

## Changeset Format

When you run `bun run changeset:add`, you'll be prompted to:

1. **Select changed packages** - Check the boxes for packages that changed
2. **Choose version bump type** - Select semver increment:
   - **patch** (e.g., 1.0.1) - Bug fixes, small improvements
   - **minor** (e.g., 1.1.0) - New features, backwards compatible
   - **major** (e.g., 2.0.0) - Breaking changes

3. **Add a summary** - Describe the change in one line

**Example changeset file** (`.changeset/cool-monkeys-34.md`):
```markdown
---
"effect-json": minor
"effect-yaml": patch
---

Add streaming parser support for large JSON files
```

## Release Process

### Automated Releases (CI/CD)

1. **Merge PR with changesets** to main branch
2. **GitHub Action automatically**:
   - Creates "Version Packages" PR
   - Updates package versions based on changesets
   - Generates changelogs
   - Tags releases on GitHub

3. **Merge "Version Packages" PR**:
   - GitHub Action publishes to npm
   - Creates GitHub Release
   - Sends notifications

### Manual Release (if needed)

```bash
# Create version bumps
bun run version

# Publish to npm
bun run publish
```

## Common Tasks

### Run a single package

```bash
# Test
bun run --filter effect-json test

# Build
bun run --filter effect-json build

# Watch tests
bun run --filter effect-json test:watch

# Lint
bun run --filter effect-json lint
```

### Check test coverage

```bash
# Generate coverage for all packages
bun run test:coverage

# Check if coverage meets thresholds
bun run test:coverage:check

# View detailed coverage
bun run test:coverage:aggregate
```

### Validate architecture

```bash
# Check layer dependencies (McLuhan → Hume only)
bun run check:architecture

# Validate test structure
bun run check:test-structure

# Check for dependency violations
bun run check:dependencies
```

### Type check without building

```bash
bun run typecheck
```

### Format code

```bash
# Auto-fix formatting issues
bun run format:fix

# Check without fixing
bun run format
```

## Commit Message Convention

Use conventional commit format for consistency:

```
type(scope): description

[optional body]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Code style changes (not affecting logic)
- `refactor` - Code refactoring without feature changes
- `test` - Adding or updating tests
- `chore` - Build, dependencies, tooling

**Examples:**
```
feat(effect-json): Add streaming JSON parser

fix(effect-cli-tui): Resolve color output in dark terminals

docs: Update installation instructions

chore: Update dependencies
```

## Questions or Issues?

- Check existing issues on GitHub
- Review CLAUDE.md for architecture guidance
- Check package-specific CLAUDE.md files
- Open a new issue to discuss proposed changes

## License

By contributing to EffectTalk, you agree that your contributions will be licensed under the MIT License.

---

Happy contributing! 🚀
