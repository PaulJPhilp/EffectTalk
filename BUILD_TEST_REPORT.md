# EffectTalk Monorepo - Build Test Report

**Date:** 2026-01-18  
**Total Packages:** 27  
**Passing:** 23  
**Failing:** 4  
**Success Rate:** 85.2%

---

## Summary

This report documents pre-existing build failures identified by systematically testing each package in the EffectTalk monorepo.

---

## Passing Packages (23)

All of these packages build successfully:

1. ✓ effect-ai-sdk
2. ✓ effect-artifact
3. ✓ effect-attachment
4. ✓ effect-csv
5. ✓ effect-env
6. ✓ effect-html
7. ✓ effect-image
8. ✓ effect-json
9. ✓ effect-mdx
10. ✓ effect-models
11. ✓ effect-models-website
12. ✓ effect-pdf
13. ✓ effect-prompt
14. ✓ effect-regex
15. ✓ effect-repository
16. ✓ effect-schema-utils
17. ✓ effect-storage
18. ✓ effect-supermemory
19. ✓ effect-telemetry
20. ✓ effect-toml
21. ✓ effect-xml
22. ✓ effect-xmp
23. ✓ effect-yaml

---

## Failing Packages (4)

### 1. effect-actor

**Status:** ✗ FAIL  
**Error Type:** TypeScript compilation error

**Error Details:**
```
src/actor/service.test.ts(93,18): error TS2769: No overload matches this call.
  The last overload gave the following error.
    Argument of type '() => Layer<ActorService, never, StorageProvider | SpecRegistry | AuditLog>' 
    is not assignable to parameter of type 'ManagedRuntime<unknown, unknown>'.
```

**Issue:** Service test file has incompatible type signatures. The layer function being passed doesn't match the expected ManagedRuntime type parameter.

**Location:** `/Users/paul/Projects/EffectTalk/packages/effect-actor/src/actor/service.test.ts:93`

---

### 2. effect-cli-tui

**Status:** ✗ FAIL  
**Error Type:** TypeScript compilation error - Missing file extensions

**Error Details:**
```
src/index.ts(2,27): error TS2835: Relative import paths need explicit file extensions 
  in ECMAScript imports when '--moduleResolution' is 'node16' or 'nodenext'. 
  Did you mean './cli.js'?
src/index.ts(10,8): error TS2835: Relative import paths need explicit file extensions...
[Multiple similar errors across index.ts]
```

**Issue:** Missing `.js` file extensions in relative imports throughout src/index.ts. The DTS (TypeScript Declaration) build fails due to ESM module resolution requirements.

**Root Cause:** ESM compliance issue - relative imports in src/index.ts lack required `.js` extensions for proper node16/nodenext module resolution.

**Location:** `/Users/paul/Projects/EffectTalk/packages/effect-cli-tui/src/index.ts` (multiple lines)

**Files Affected:**
- src/index.ts - 24+ import statements missing `.js` extensions

---

### 3. effect-cockpit

**Status:** ✗ FAIL  
**Error Type:** TypeScript compilation error

**Error Details:**
```
src/index.ts(59,6): error TS2345: Argument of type 'Effect<void, Error, any>' 
  is not assignable to parameter of type 'Effect<void, Error, never>'.
    Type 'any' is not assignable to type 'never'.
```

**Issue:** Type safety violation. An Effect with `any` requirement context is being passed where `never` (no requirements) is expected. This violates the strict type safety constraints.

**Location:** `/Users/paul/Projects/EffectTalk/packages/effect-cockpit/src/index.ts:59`

**Root Cause:** Effect.Service context requirements are too permissive (using `any` instead of being properly typed).

---

### 4. effect-liquid

**Status:** ✗ FAIL  
**Error Type:** TypeScript compilation error - Complex type incompatibilities

**Error Details:**
```
src/renderer.ts(71,3): error TS2375: Type 'Effect<any, LiquidRenderError, unknown>' 
  is not assignable to type 'Effect<string, LiquidRenderError, never>' 
  with 'exactOptionalPropertyTypes: true'.
    Type 'unknown' is not assignable to type 'never'.

src/renderer.ts(108,31): error TS2488: Type 'never' must have a '[Symbol.iterator]()' method...

src/renderer.ts(118,19): error TS2358: The left-hand side of an 'instanceof' expression 
  must be of type 'any', an object type or a type parameter.
```

**Issue:** Multiple TypeScript strict mode violations:
1. Effect context requirements use `unknown` instead of `never`
2. Error type union handling (LiquidRenderError & LiquidTagError) creates `never` type
3. Conditional logic on reduced `never` types is invalid
4. Type narrowing issues with discriminated union errors

**Location:** `/Users/paul/Projects/EffectTalk/packages/effect-liquid/src/renderer.ts` (multiple lines: 71, 108, 112, 114, 118, 157, 161, 163, 167, 218, 224, 228, 247, 251, 253)

**Root Cause:** Error type design flaw - conflicting error types (LiquidRenderError vs LiquidTagError) with incompatible discriminators cause type system to reduce to `never`. The renderer attempts to handle both error types in the same context, leading to type incompatibility.

---

## Error Classification

### By Category

| Category | Count | Packages |
|----------|-------|----------|
| ESM Module Resolution | 1 | effect-cli-tui |
| Service Type Mismatch | 1 | effect-actor |
| Effect Context Type Safety | 1 | effect-cockpit |
| Error Type Union | 1 | effect-liquid |

### By Severity

| Severity | Count | Packages |
|----------|-------|----------|
| High (Breaks build) | 4 | All failing packages |

---

## Recommendations

### Quick Fixes Needed

1. **effect-cli-tui** (1-2 minutes)
   - Add `.js` extensions to all relative imports in `src/index.ts`
   - Pattern: `import X from "./path"` → `import X from "./path.js"`

2. **effect-actor** (5-10 minutes)
   - Review service.test.ts line 93
   - Ensure the returned Layer is compatible with ManagedRuntime expectations
   - May need to use `Effect.runTest()` instead of ManagedRuntime pattern

3. **effect-cockpit** (5-10 minutes)
   - Review the Effect at line 59
   - Replace `any` context requirements with explicit type signatures
   - Use `never` for effects with no context requirements

4. **effect-liquid** (15-30 minutes)
   - Refactor error handling to avoid incompatible error unions
   - Consider separate render methods for different error contexts
   - Or redesign error types to have compatible discriminators
   - Ensure context requirements are `never` (no dependencies) or properly typed

---

## Architecture Impact

- **Layer 2 Issues:** 3 packages (effect-actor, effect-cli-tui, effect-cockpit)
- **Layer 1 Issues:** 1 package (effect-liquid)

Layer 2 failures are particularly important as they're foundational for agent infrastructure.

---

## Next Steps

1. Prioritize Layer 2 fixes (effect-actor, effect-cli-tui, effect-cockpit)
2. Apply fixes systematically, testing each individually
3. Run full monorepo build verification after each fix
4. Add pre-commit hooks to prevent future ESM issues

---

## Verification Command

To verify all packages build after fixes:

```bash
bun run build
```

To test individual packages:

```bash
bun run --filter <package-name> build
```

