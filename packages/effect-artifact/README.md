# effect-artifact

Type-safe AI artifact management with versioning, type detection, and rendering hints.

## Overview

`effect-artifact` provides a comprehensive system for managing AI-generated artifacts (code, documents, diagrams, data) with:

- **Automatic Type Detection** - Detects artifact types from content (code, document, diagram, data, media, markup, configuration)
- **Smart Language Detection** - Recognizes programming languages (TypeScript, Python, Rust, Go, Java, etc.)
- **Full Versioning** - Track artifact versions with history, diffs, and parent tracking
- **Rich Metadata** - Store rendering hints, generation info, tags, and custom metadata
- **AI Integration** - Extract artifacts from AI model responses (code blocks, Mermaid diagrams, JSON, etc.)
- **Type-Safe Storage** - Uses effect-storage for validated, efficient file persistence
- **Effect-Native** - Built with Effect.Service for dependency injection and composability

## Installation

```bash
bun add effect-artifact
```

## Basic Usage

### Create an Artifact

```typescript
import { Effect } from "effect"
import { ArtifactService } from "effect-artifact"

const program = Effect.gen(function* () {
  const artifacts = yield* ArtifactService

  const artifact = yield* artifacts.create(
    "const greeting = (name: string) => `Hello, ${name}!`",
    {
      title: "Greeting Function",
      tags: ["typescript", "function"],
      author: "Alice"
    }
  )

  console.log(`Created: ${artifact.id}`)
  console.log(`Type: ${artifact.type.category} (${artifact.type.language})`)
  console.log(`Version: ${artifact.metadata.version}`)
  return artifact
})

await Effect.runPromise(program.pipe(Effect.provide(ArtifactService.Default)))
```

### Get an Artifact

```typescript
const program = Effect.gen(function* () {
  const artifacts = yield* ArtifactService

  // Get latest version
  const artifact = yield* artifacts.get("artifact-id")

  // Get specific version
  const oldVersion = yield* artifacts.get("artifact-id", "1.0.0")

  return artifact
})
```

### Update (Create New Version)

```typescript
const program = Effect.gen(function* () {
  const artifacts = yield* ArtifactService

  const updated = yield* artifacts.update(
    "artifact-id",
    "const greeting = (name: string) => `Hi, ${name}!`",
    { description: "Updated greeting" }
  )

  console.log(`New version: ${updated.metadata.version}`)
  return updated
})
```

### List with Filtering

```typescript
const program = Effect.gen(function* () {
  const artifacts = yield* ArtifactService

  // Get all code artifacts
  const codeArtifacts = yield* artifacts.list({ category: "code" })

  // Get artifacts with specific tags
  const important = yield* artifacts.list({ tags: ["important"] })

  // Get by author pattern
  const aliceArtifacts = yield* artifacts.list({
    authorPattern: "Alice"
  })

  return { codeArtifacts, important, aliceArtifacts }
})
```

### Versioning and Diffs

```typescript
const program = Effect.gen(function* () {
  const artifacts = yield* ArtifactService

  // Get full version history
  const history = yield* artifacts.getVersionHistory("artifact-id")
  console.log(`Total versions: ${history.length}`)

  // Compare versions
  const diff = yield* artifacts.diff("artifact-id", "1.0.0", "1.0.1")
  console.log(`Changed: ${diff.changes.contentChanged}`)
  console.log(`Diff:\n${diff.changes.diff}`)

  return { history, diff }
})
```

### Extract from AI Responses

```typescript
import { extractArtifactsFromString } from "effect-artifact"

const aiResponse = `
Here's a TypeScript solution:

\`\`\`typescript
function fibonacci(n: number): number {
  if (n <= 1) return n
  return fibonacci(n - 1) + fibonacci(n - 2)
}
\`\`\`

And here's a diagram of the flow:

\`\`\`mermaid
graph TD
  A[Input] --> B[Calculate]
  B --> C[Output]
\`\`\`
`

const program = extractArtifactsFromString(
  aiResponse,
  { provider: "openai", model: "gpt-4" }
)

const artifacts = await Effect.runPromise(program)
console.log(`Extracted ${artifacts.length} artifacts`)
// Output: Extracted 2 artifacts (1 code, 1 diagram)
```

## Type System

### ArtifactType

Discriminated union for type-safe artifact classification:

```typescript
type ArtifactType =
  | { category: "code"; language: string; framework?: string }
  | { category: "document"; format: "markdown" | "plaintext" | "html" }
  | { category: "diagram"; diagramType: "mermaid" | "plantuml" | "svg" | "dot" }
  | { category: "data"; dataFormat: "json" | "csv" | "yaml" | "toml" | "xml" }
  | { category: "media"; mediaType: "image" | "audio"; mimeType: string; encoding: "base64" }
  | { category: "markup"; markupType: "html" | "xml" | "jsx" | "tsx" }
  | { category: "configuration"; configType: string }
```

### RenderingHints

Control UI display of artifacts:

```typescript
interface RenderingHints {
  syntaxHighlighting?: boolean
  lineNumbers?: boolean
  theme?: "light" | "dark" | "auto"
  collapsible?: boolean
  maxHeight?: number
  readOnly?: boolean
  diffView?: boolean
  executionEnabled?: boolean
}
```

## Configuration

Configure via environment variables:

```bash
# Base directory for artifact storage (default: ./artifacts)
export ARTIFACTS_DIR=/path/to/artifacts

# Enable in-memory caching (default: true)
export ARTIFACTS_ENABLE_CACHING=true
```

## Type Detection

Automatic type detection from content:

1. **Filename** - If filename hint provided
2. **MIME Type** - If MIME type hint provided
3. **Content Patterns** - Code blocks (```language), tags (<svg>, <?xml>), structure ({}, [])
4. **Language Heuristics** - Keywords, syntax patterns
5. **Default** - Plaintext document

### Supported Languages

Automatic detection for: TypeScript, JavaScript, Python, Rust, Go, Java, C/C++, C#, Ruby, PHP, Shell, SQL

## Versioning Strategy

- **Version ID Format**: `{artifactId}-v{semver}` (e.g., `abc-123-v1.0.0`)
- **Initial Version**: All new artifacts start at v1.0.0
- **Updates**: Create new versions (v1.0.1, v1.0.2, etc.)
- **Parent Tracking**: Each version tracks its parent version
- **Diffs**: Compare any two versions

## Storage

Artifacts stored in hash-based directory structure:

```
artifacts/
├── ab/                    # Hash prefix
│   ├── abc123-v1.0.0.txt
│   ├── abc123-v1.0.0.meta.json
│   └── abc123-v1.0.1.txt
│       abc123-v1.0.1.meta.json
└── cd/
    ├── cdef45-v1.0.0.txt
    └── cdef45-v1.0.0.meta.json
```

## Error Handling

Type-safe error handling with tagged errors:

```typescript
yield* artifacts.get(id).pipe(
  Effect.catchTag("ArtifactNotFoundError", (err) => {
    console.error(`Artifact not found: ${err.artifactId}`)
    return Effect.succeed(null)
  }),
  Effect.catchTag("ArtifactStorageError", (err) => {
    console.error(`Storage error: ${err.message}`)
    return Effect.fail(err)
  })
)
```

## Services

### ArtifactService

Main service for artifact management:

- `create(content, metadata, type?)` - Create new artifact
- `get(id, version?)` - Get artifact
- `update(id, content, metadata?)` - Update and version
- `delete(id)` - Delete all versions
- `list(options?)` - List with filtering
- `getVersionHistory(id)` - Get all versions
- `diff(id, v1, v2)` - Compare versions
- `updateRenderingHints(id, hints)` - Update display hints

### TypeDetectionService

Detect artifact types from content:

- `detectType(content, hints?)` - Detect artifact type
- `detectLanguage(content)` - Detect programming language

### ArtifactConfig

Configuration management:

- `getArtifactsDir()` - Get storage directory
- `getEnableCaching()` - Get caching setting

## AI Integration

Extract artifacts from AI model responses:

```typescript
import { extractArtifactsFromResponse } from "effect-artifact"
import type { ChatCompletionResponse } from "effect-models"

const response: ChatCompletionResponse = {
  id: "msg-123",
  model: "gpt-4",
  choices: [...]
}

const program = extractArtifactsFromResponse(response, {
  provider: "openai",
  model: "gpt-4"
})

const artifacts = await Effect.runPromise(program)
```

## Testing

Tests use real implementations with fixtures (no mocking):

```bash
bun run test
bun run test:watch
bun run test:coverage
```

## License

MIT
