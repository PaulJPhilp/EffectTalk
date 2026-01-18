# effect-repository

Generic blob storage abstraction for Effect.

Provides a backend-agnostic interface for storing and retrieving binary data (blobs) with support for multiple storage backends.

## Features

- **Backend Abstraction** - Switch storage backends without changing application code
- **Multiple Backends** - Built-in support for in-memory, filesystem, and PostgreSQL storage
- **Type-Safe** - Full TypeScript support with Effect for composability and error handling
- **Custom Metadata** - Store arbitrary key-value metadata with blobs
- **Pagination** - Cursor-based pagination for listing blobs
- **Error Handling** - Tagged errors for precise error catching with `catchTag`

## Installation

```bash
npm install effect-repository
```

## Quick Start

### In-Memory Backend (Testing)

```typescript
import { Effect } from "effect"
import { InMemoryBackend } from "effect-repository"

const program = Effect.gen(function* () {
  const backend = yield* InMemoryBackend

  // Save a blob
  const metadata = yield* backend.save(
    Buffer.from("Hello, World!"),
    "text/plain",
    {
      customMetadata: { source: "example" }
    }
  )

  console.log(`Saved blob: ${metadata.id}`)

  // Retrieve blob
  const blob = yield* backend.get(metadata.id)
  console.log(blob.data.toString()) // "Hello, World!"

  // Delete blob
  yield* backend.delete(metadata.id)
})

await Effect.runPromise(program.pipe(Effect.provide(InMemoryBackend.Default)))
```

### FileSystem Backend

```typescript
import { Effect } from "effect"
import { NodeFileSystem } from "@effect/platform-node"
import { FileSystemBackend } from "effect-repository"

const program = Effect.gen(function* () {
  const fsBackend = yield* FileSystemBackend
  const backend = fsBackend({ basePath: "/tmp/blobs", hashDepth: 2 })

  // Save a blob
  const metadata = yield* backend.save(
    Buffer.from("Image data..."),
    "image/png"
  )

  // List blobs
  const result = yield* backend.list({ limit: 10 })
  console.log(`Found ${result.items.length} blobs`)
})

await Effect.runPromise(
  program.pipe(Effect.provide(NodeFileSystem.layer))
)
```

### PostgreSQL Backend

```typescript
import { Effect } from "effect"
import { PostgreSQL } from "@effect/sql-pg"
import { PostgreSQLBackend } from "effect-repository"

const program = Effect.gen(function* () {
  const pgBackend = yield* PostgreSQLBackend
  const backend = pgBackend({ tableName: "blobs" })

  // Save a blob
  const metadata = yield* backend.save(
    Buffer.from("Data..."),
    "application/octet-stream"
  )

  // Check if blob exists
  const exists = yield* backend.exists(metadata.id)
  console.log(`Blob exists: ${exists}`)
})

const pgLayer = PostgreSQL.layer({
  url: "postgres://user:password@localhost/dbname"
})

await Effect.runPromise(program.pipe(Effect.provide(pgLayer)))
```

## Backends

### InMemoryBackend

Stores blobs in memory using `Effect.Ref`. Useful for testing and development.

**Characteristics:**
- Fastest access (no I/O)
- Data lost when context is garbage collected
- No configuration needed
- Perfect for unit tests

### FileSystemBackend

Stores blobs as files with JSON metadata sidecars. Uses hash-based directory structure.

**Configuration:**
```typescript
interface FileSystemBackendConfig {
  basePath: string      // Base directory for storage
  hashDepth?: number    // Hash subdirectory depth (default: 2)
  idGenerator?: () => string  // Custom ID generator
}
```

**File Structure:**
```
/blobs
├── 12/
│   ├── 12ab34cd-...blob
│   └── 12ab34cd-...meta.json
├── 34/
│   ├── 34ef56gh-...blob
│   └── 34ef56gh-...meta.json
```

### PostgreSQLBackend

Stores blobs in PostgreSQL using BYTEA column for binary data and JSONB for metadata.

**Table Schema:**
```sql
CREATE TABLE blobs (
  id VARCHAR(255) PRIMARY KEY,
  mime_type VARCHAR(255) NOT NULL,
  size_bytes BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL,
  custom_metadata JSONB,
  data BYTEA NOT NULL
);

CREATE INDEX idx_blobs_mime_type ON blobs(mime_type);
CREATE INDEX idx_blobs_created_at ON blobs(created_at DESC);
CREATE INDEX idx_blobs_custom_metadata ON blobs USING GIN(custom_metadata);
```

## API Reference

### Core Operations

#### save()
Save a blob to storage.

```typescript
const metadata = yield* backend.save(
  Buffer.from("data"),
  "application/json",
  {
    id: "custom-id",
    customMetadata: { key: "value" },
    overwrite: false
  }
)
```

#### get()
Retrieve a blob with its data.

```typescript
const blob = yield* backend.get("blob-id")
console.log(blob.data)      // Buffer
console.log(blob.metadata)  // BlobMetadata
```

#### getMetadata()
Get blob metadata without fetching binary data (faster).

```typescript
const metadata = yield* backend.getMetadata("blob-id")
```

#### exists()
Check if a blob exists.

```typescript
const exists = yield* backend.exists("blob-id")
```

#### delete()
Delete a blob.

```typescript
yield* backend.delete("blob-id")
```

#### list()
List blobs with optional filtering and pagination.

```typescript
const result = yield* backend.list({
  limit: 50,
  cursor: undefined,
  mimeTypePrefix: "image/"
})

console.log(result.items)      // BlobMetadata[]
console.log(result.nextCursor) // string | undefined
console.log(result.totalCount) // number | undefined
```

## Error Handling

All errors extend `Data.TaggedError` for type-safe handling with `catchTag`:

```typescript
const program = Effect.gen(function* () {
  const result = yield* backend.get("blob-id").pipe(
    Effect.catchTag("BlobNotFoundError", (err) =>
      Effect.succeed(null)  // Handle not found
    ),
    Effect.catchTag("RepositoryError", (err) =>
      Effect.fail(new CustomError({ cause: err }))  // Re-throw
    )
  )
})
```

### Error Types

- **BlobNotFoundError** - Blob does not exist
- **BlobAlreadyExistsError** - Blob exists and `overwrite=false`
- **RepositoryError** - Generic storage operation failure
- **InvalidBlobError** - Invalid blob data
- **StorageQuotaError** - Storage quota exceeded

## Types

```typescript
type BlobId = string

interface BlobMetadata {
  readonly id: BlobId
  readonly mimeType: string
  readonly sizeBytes: number
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly customMetadata?: Record<string, string>
}

interface Blob {
  readonly metadata: BlobMetadata
  readonly data: Buffer
}

interface SaveOptions {
  readonly id?: BlobId
  readonly customMetadata?: Record<string, string>
  readonly overwrite?: boolean
}

interface ListOptions {
  readonly limit?: number
  readonly cursor?: string
  readonly mimeTypePrefix?: string
}

interface ListResult {
  readonly items: readonly BlobMetadata[]
  readonly nextCursor?: string
  readonly totalCount?: number
}
```

## Custom Backends

Implement the `RepositoryBackend` interface to create custom backends:

```typescript
import type { RepositoryBackend } from "effect-repository"

export const customBackend: RepositoryBackend = {
  save: (data, mimeType, options) =>
    Effect.gen(function* () {
      // Implementation
      return metadata
    }),

  get: (id) =>
    Effect.gen(function* () {
      // Implementation
      return blob
    }),

  // ... implement other methods
}
```

## Performance Considerations

- **InMemoryBackend** - O(1) access, limited by available RAM
- **FileSystemBackend** - O(1) access after directory traversal, limited by disk I/O
- **PostgreSQLBackend** - O(1) access with indexes, network latency

## License

MIT
