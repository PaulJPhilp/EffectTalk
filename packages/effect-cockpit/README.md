# effect-cockpit

A next-generation CLI application harness transforming traditional terminals into stateful, interactive applications.

[![npm version](https://img.shields.io/npm/v/effect-cockpit)](https://www.npmjs.com/package/effect-cockpit)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎛️ **Block-Based Architecture** - Isolate commands as stateful blocks with lifecycle management
- ⚛️ **React + Ink** - Modern, responsive terminal UI built with React components
- 💾 **Session Persistence** - Auto-save sessions to SQLite and restore on startup
- 📸 **Snapshots** - Create named backups of application state
- 🗂️ **Workspace Awareness** - Context-aware sidebar with environment information
- 📝 **Multi-Line Input** - Powerful input editor for complex commands
- ⚡ **Performance** - Virtual scrolling for large command histories
- 🎯 **Focus Management** - Intuitive navigation through blocks and history
- 🔄 **Effect-Native** - Built on Effect.js for robust concurrency and error handling

## Installation

```bash
npm install effect-cockpit
# or
bun add effect-cockpit
```

## Quick Start

```bash
# Install dependencies
bun install

# Start the application
bun start
```

## Keyboard Controls

| Key Combo | Action |
|-----------|--------|
| `Enter` | Execute command |
| `Shift + Enter` | Insert newline in multi-line input |
| `Shift + Up` | Focus previous block |
| `Shift + Down` | Focus next block |
| `Ctrl + B` | Toggle sidebar |
| `Ctrl + C` | Exit application |

## Architecture

### Block-Based Model

Instead of traditional scrolling buffers, effect-cockpit organizes work into **Blocks**:

```typescript
interface Block {
  id: string;
  command: string;
  status: "idle" | "running" | "success" | "failure";
  output: string;
  exitCode?: number;
  startTime: Date;
  endTime?: Date;
}
```

### State Management

```typescript
// Built on Effect.Ref for thread-safe state
const sessionRef = yield* Effect.Ref.make<Session>(initialSession);

// Subscribe to updates
yield* Effect.Stream.fromQueue(updateQueue).pipe(
  Effect.Stream.tap((update) => sessionRef.update(applyUpdate)),
);
```

### Session Persistence

```typescript
// Automatically saved to SQLite
const session = {
  id: "session-123",
  blocks: [...],
  workspace: "/path/to/workspace",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// Restored on next launch
const restored = yield* SessionService.load("session-123");
```

### UI Components

Built with React and Ink for a modern terminal experience:

- **CommandInput** - Multi-line command editor
- **BlockViewer** - Display command output and status
- **Sidebar** - Workspace context and environment info
- **HistoryPanel** - Navigate previous commands and blocks

## Core Services

### SessionService

Manage application sessions:

```typescript
// Save session
yield* SessionService.save(session);

// Load session
const session = yield* SessionService.load(sessionId);

// List sessions
const sessions = yield* SessionService.list();

// Delete session
yield* SessionService.delete(sessionId);
```

### CommandService

Execute and manage commands:

```typescript
// Execute command
const block = yield* CommandService.execute(command, options);

// Subscribe to output
yield* CommandService.onOutput(blockId, (output) => {
  console.log(output);
});

// Get block status
const status = yield* CommandService.getStatus(blockId);
```

### WorkspaceService

Access workspace context:

```typescript
// Get working directory
const cwd = yield* WorkspaceService.getCwd();

// Get environment variables
const env = yield* WorkspaceService.getEnv();

// Get workspace stats
const stats = yield* WorkspaceService.getStats();
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Run in development
bun start

# Run tests
bun run test
bun run test:watch

# Type checking
bun run typecheck

# Lint & format
bun run lint
bun run format
```

## Integration

Works well with other Effect packages:

- **[effect-cli-tui](../effect-cli-tui)** - Interactive prompts and utilities
- **[effect-storage](../effect-storage)** - Persistent storage for sessions
- **[effect-json](../effect-json)** - Schema validation for config files

## Architecture Deep Dive

### Process Management

Uses Node.js `child_process` with optional `node-pty` support for pseudo-terminal emulation:

```typescript
const child = spawn(command, args, {
  stdio: ["pipe", "pipe", "pipe"],
  pty: true, // Optional: enables terminal emulation
});

// Stream output to block
child.stdout.pipe(blockStream);
```

### Virtual Scrolling

Efficient rendering of large command histories:

```typescript
<VirtualList
  items={blocks}
  itemHeight={estimateBlockHeight}
  overscan={5}
/>
```

### SQLite Persistence

Session data stored in SQLite via Kysely:

```typescript
const db = new Kysely<Database>({
  dialect: new BunSqliteDialect(),
  database: new Database(dbPath),
});

yield* db
  .insertInto("sessions")
  .values(session)
  .execute();
```

## Configuration

### Session Defaults

```typescript
interface CockpitConfig {
  storageDir: string; // ~/.cockpit or custom path
  dbPath: string; // SQLite database location
  defaultShell: string; // /bin/bash, /bin/zsh, etc.
  maxHistorySize: number; // Block history limit
  enablePty: boolean; // Use pseudo-terminal
}
```

## Performance Considerations

- **Virtual Scrolling**: Handles 10,000+ blocks efficiently
- **Streaming Output**: Large outputs processed incrementally
- **Session Indexing**: Fast session lookup and restoration
- **Memory Management**: Old sessions can be archived to reduce memory usage

## Error Handling

All operations return discriminated errors:

```typescript
const result = yield* CommandService.execute(command).pipe(
  Effect.catchTag("CommandError", (err) => {
    console.error("Command failed:", err.message);
  }),
  Effect.catchTag("ProcessError", (err) => {
    console.error("Process error:", err.message);
  }),
);
```

## License

MIT © 2025 Paul Philp

## Resources

- **[Effect Documentation](https://effect.website)** - Effect-TS runtime
- **[Ink](https://github.com/vadimdemedes/ink)** - React for CLIs
- **[Kysely](https://kysely.dev/)** - SQL query builder
- **[node-pty](https://github.com/microsoft/node-pty)** - Terminal emulation