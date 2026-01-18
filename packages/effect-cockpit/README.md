# effect-cockpit

A next-generation CLI application harness built with [Effect](https://effect.website) and [Ink](https://github.com/vadimdemedes/ink).

`effect-cockpit` moves away from the flat-file scrolling buffer of traditional terminals, architecting the CLI as a **Stateful Application** where the unit of work is a **Block**.

## Features

- **Block-Based Architecture**: Every command is an isolated block with its own state (running, success, failure) and metadata.
- **Reactive TUI**: Built with React and Ink for a modern, responsive terminal interface.
- **Session Persistence**: Sessions are automatically saved to a local SQLite database and restored on launch.
- **Snapshots**: Create named backups of your session state via the internal API.
- **Workspace Awareness**: Sidebar displaying working directory and environment stats.
- **Multi-Line Input**: Robust input editor supporting complex commands.
- **Performance**: Virtual scrolling to handle large session histories efficiently.
- **Focus Management**: Navigate through your command history and blocks with ease.

## Usage

### Installation

```bash
bun install
```

### Running

```bash
bun start
```

## Keyboard Controls

| Key Combo | Action |
|-----------|--------|
| `Enter` | Execute command |
| `Shift + Enter` | Insert newline in input |
| `Shift + Up` | Focus previous block |
| `Shift + Down` | Focus next block |
| `Ctrl + B` | Toggle Sidebar |

## Architecture

Built using the **Effect** ecosystem for robust concurrency, error handling, and resource management.

- **State Management**: `Effect.Ref` & `Effect.Stream`
- **Persistence**: `Kysely` + `SQLite` (via `better-sqlite3` or `bun:sqlite` adapter)
- **UI**: `React` + `Ink` components
- **Process Management**: `node:child_process` (with `node-pty` architecture support)

## Development

```bash
# Run tests
bun test

# Typecheck
bun run typecheck
```