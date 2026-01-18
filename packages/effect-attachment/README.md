# effect-attachment

Chat attachment management for Effect.

Type-safe attachment storage and management for chat applications using `effect-repository` as the underlying storage layer.

## Features

- **Type-Safe Storage** - Full TypeScript support with Effect for composability
- **Flexible Backends** - Works with any effect-repository backend (in-memory, filesystem, PostgreSQL)
- **Chat Integration** - Built-in support for chat ID and user ID association
- **Size Validation** - Configurable size limits per upload
- **MIME Type Filtering** - Optional whitelist of allowed MIME types
- **Metadata Tracking** - Automatic tracking of filename, size, and timestamps
- **Error Handling** - Typed errors for specific failure scenarios

## Installation

```bash
npm install effect-attachment effect-repository
```

## Quick Start

### Basic Usage

```typescript
import { Effect } from "effect"
import { InMemoryBackend } from "effect-repository"
import { createAttachmentService } from "effect-attachment"

const program = Effect.gen(function* () {
  const backend = yield* InMemoryBackend
  const attachments = createAttachmentService(backend)

  // Upload an attachment
  const attachment = yield* attachments.upload(
    "document.pdf",
    pdfBuffer,
    "application/pdf",
    {
      chatId: "chat-123",
      userId: "user-456"
    }
  )

  console.log(`Uploaded: ${attachment.filename}`)

  // Download attachment
  const downloaded = yield* attachments.download(attachment.id)
  console.log(`Downloaded: ${downloaded.data.length} bytes`)

  // List attachments for a chat
  const result = yield* attachments.list({ chatId: "chat-123" })
  console.log(`Chat has ${result.items.length} attachments`)

  // Delete attachment
  yield* attachments.delete(attachment.id)
})

await Effect.runPromise(program)
```

### With Size Limits and MIME Type Filtering

```typescript
const attachments = createAttachmentService(backend, {
  maxSizeBytes: 50 * 1024 * 1024, // 50MB
  allowedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain"
  ]
})

// Try to upload a file
const result = yield* Effect.either(
  attachments.upload(
    "archive.zip",
    zipBuffer,
    "application/zip" // Not in allowed list!
  )
)

if (Either.isLeft(result)) {
  // Handle error based on type
  const error = result.left
  if (error._tag === "UnsupportedAttachmentTypeError") {
    console.log(`MIME type not allowed: ${error.mimeType}`)
  }
}
```

### Different Backends

```typescript
import { FileSystemBackend } from "effect-repository"

// FileSystem backend
const fsProgram = Effect.gen(function* () {
  const fsBackend = yield* FileSystemBackend
  const repo = fsBackend({ basePath: "/var/attachments" })
  const attachments = createAttachmentService(repo)

  yield* attachments.upload("file.txt", data, "text/plain")
})

// PostgreSQL backend
const pgProgram = Effect.gen(function* () {
  const pgBackend = yield* PostgreSQLBackend
  const repo = pgBackend({ tableName: "attachments" })
  const attachments = createAttachmentService(repo)

  yield* attachments.upload("file.txt", data, "text/plain")
})
```

## API Reference

### createAttachmentService()

Factory function that creates an attachment service.

```typescript
const service = createAttachmentService(backend, config)
```

**Parameters:**
- `backend` - RepositoryBackend instance (in-memory, filesystem, or PostgreSQL)
- `config` - Optional configuration:
  - `maxSizeBytes` - Maximum file size in bytes (default: 10MB)
  - `allowedMimeTypes` - Whitelist of allowed MIME types (default: all)

### Service Methods

#### upload()
Upload an attachment.

```typescript
const attachment = yield* service.upload(
  filename,
  data,
  mimeType,
  options
)
```

**Returns:** `Attachment` with metadata

**Errors:**
- `InvalidAttachmentError` - Invalid filename
- `AttachmentSizeLimitError` - File too large
- `UnsupportedAttachmentTypeError` - MIME type not allowed

#### download()
Download an attachment with binary data.

```typescript
const attachment = yield* service.download(id)
console.log(attachment.data)  // Buffer
```

**Errors:**
- `AttachmentNotFoundError` - Attachment doesn't exist

#### get()
Get attachment metadata without downloading data.

```typescript
const attachment = yield* service.get(id)
// attachment.data is NOT included
```

#### delete()
Delete an attachment.

```typescript
yield* service.delete(id)
```

#### list()
List attachments with optional filtering.

```typescript
const result = yield* service.list({
  chatId: "chat-123",
  userId: "user-456",
  mimeTypePrefix: "image/",
  limit: 50,
  cursor: undefined
})

console.log(result.items)      // Attachment[]
console.log(result.nextCursor) // string | undefined
console.log(result.totalCount) // number | undefined
```

## Types

```typescript
interface Attachment {
  readonly id: BlobId
  readonly filename: string
  readonly mimeType: string
  readonly sizeBytes: number
  readonly uploadedAt: Date
  readonly chatId?: string
  readonly userId?: string
}

interface AttachmentWithData extends Attachment {
  readonly data: Buffer
}

interface AttachmentListResult {
  readonly items: readonly Attachment[]
  readonly nextCursor?: string
  readonly totalCount?: number
}
```

## Error Handling

All errors extend `Data.TaggedError` for type-safe handling:

```typescript
yield* service.upload("file.txt", data, "text/plain").pipe(
  Effect.catchTag("InvalidAttachmentError", (err) => {
    console.log(`Invalid: ${err.reason}`)
    return Effect.succeed(null)
  }),
  Effect.catchTag("AttachmentSizeLimitError", (err) => {
    console.log(`Too large: ${err.sizeBytes} > ${err.limitBytes}`)
    return Effect.succeed(null)
  }),
  Effect.catchTag("UnsupportedAttachmentTypeError", (err) => {
    console.log(`Not allowed: ${err.mimeType}`)
    return Effect.succeed(null)
  })
)
```

## Choosing a Backend

- **InMemoryBackend** - Testing and development, data lost on process restart
- **FileSystemBackend** - Local development and simple deployments
- **PostgreSQLBackend** - Production deployments with durability and scalability

## License

MIT
