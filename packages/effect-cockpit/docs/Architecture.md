# Architectural Design Document: effect-cockpit

**Project:** effect-cockpit  
**Subtitle:** A Reactive, Block-Based Application Harness  
**Date:** January 16, 2026

---

## 1. System Vision

effect-cockpit moves away from the "flat-file" scrolling buffer of traditional terminals. It architectures the CLI as a **Stateful Application** where the unit of work is a **Block**. Using the **Effect** ecosystem, the harness ensures that all side effects (process spawning, file I/O, streaming) are tracked, interruptible, and type-safe.

## 2. High-Level Architecture

effect-cockpit is divided into three distinct layers, strictly separated by interfaces:

1. **The Core (Effect Layer):** Manages the lifecycle of processes, concurrency, and error handling.
2. **The State Store:** An immutable representation of the entire session (Blocks, Input, Metadata).
3. **The View (Ink Layer):** A reactive TUI that renders the state and captures user intent using React/Ink.

The application leverages `effect-cli-tui` as a core dependency for foundational TUI components and Effect-based patterns.

### 2.1 Component Diagram

```text
┌──────────────────────────────────────────────────────────┐
│ View Layer (Ink)                                         │
│ ┌──────────────┐ ┌────────────────┐ ┌──────────────────┐ │
│ │ LayoutEngine │ │ BlockComponent │ │ InputController  │ │
│ └──────┬───────┘ └────────┬───────┘ └────────┬─────────┘ │
└────────┼──────────────────┼──────────────────┼───────────┘
         ▼                  ▼                  ▼
┌──────────────────────────────────────────────────────────┐
│ State Layer (Effect.Ref + Effect.Stream)                 │
│ ┌───────────────────┐        ┌─────────────────────────┐ │
│ │ SessionStore      │◄───────┤ Event Bus (Effect.Hub)  │ │
│ └───────────────────┘        └─────────────────────────┘ │
└────────┬─────────────────────────────────────▲───────────┘
         ▼                                     │
┌──────────────────────────────────────────────┼───────────┐
│ Execution Layer (Effect / Node-PTY)          │           │
│ ┌──────────────┐ ┌────────────────┐ ┌────────┴──────────┐ │
│ │ FiberManager │ │ ProcessRuntime │ │ ResourceCleaner  │ │
│ └──────────────┘ └────────────────┘ └──────────────────┘ │
└──────────────────────────────────────────────────────────┘
```

---

## 3. The Execution Model (The "Effect" of effect-cockpit)

The harness uses **Effect Fibers** to manage command execution. This is the "secret sauce" that allows effect-cockpit to be more stable than a standard TUI.

- **Interruption:** When a user hits `Ctrl+C`, effect-cockpit doesn't just send a SIGINT; it interrupts the Fiber. Effect's `Scope` then ensures that the PTY is closed, temporary files are deleted, and UI state is updated atomically.
- **Concurrency:** Multiple blocks can run concurrently (e.g., a background build and a foreground log tail), with their outputs being routed to separate buffers in the State Store via an `Effect.Hub`.

---

## 4. Domain Models (TypeScript Definitions)

### 4.1 The Block

The atomic unit of the UI.

```ts
type BlockStatus = "idle" | "running" | "success" | "failure" | "interrupted";

interface Block {
  readonly id: string;
  readonly command: string;
  readonly status: BlockStatus;
  readonly exitCode?: number;
  readonly stdout: string; // Accumulated buffer
  readonly stderr: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly metadata: Record<string, any>;
}
```

### 4.2 The Session

The top-level state object.

```ts
interface Session {
  readonly id: string;
  readonly blocks: Array<Block>;
  readonly activeBlockId: string | null;
  readonly focusedBlockId: string | null; // For multi-block focus switching
  readonly workingDirectory: string;
  readonly environment: Record<string, string>;
  readonly retentionConfig: {
    fullContentBlocks: number; // Default: 100
    maxTotalBlocks: number; // Default: 100
  };
}
```

---

## 5. Data Flow: The Command Lifecycle

1. **Intent Capture:** `InputController` (Ink) captures the command string.
2. **Dispatch:** An Effect action is dispatched. It creates a new `Block` with status `running`.
3. **Fiber Spawn:**
   - A `node-pty` instance is spawned inside an `Effect.acquireRelease`.
   - A Fiber is started to stream `pty.onData` into the `Block.stdout` buffer.
4. **Reactive Update:** The `SessionStore` (an `Effect.Ref`) is updated. Ink detects the change and re-renders only the affected Block.
5. **Completion:** When the process exits, the Fiber completes. The final `exitCode` is written to the Block, and the `Scope` is closed, ensuring the PTY is cleaned up.

---

## 6. UI Architecture Features

### 6.1 Virtualized Block List

To maintain performance with thousands of blocks, the `MainViewport` will implement a virtual window. Only the `ActiveBlock` and the most recent N blocks are rendered in full detail; older blocks are rendered as "Collapsed" summaries.

### 6.2 The "Omnibar" (TUI Overlay)

The Omnibar (`Cmd+K`) uses a focused overlay pattern within the Ink viewport. It has its own independent Effect Fiber for fuzzy-searching command history or file systems without interrupting the main UI loop.

### 6.3 PTY Integration

Unlike simple `exec`, effect-cockpit uses `node-pty`. This allows:

- **Full Terminal Emulation:** Support for interactive commands (`npm init`, `git commit`).
- **Basic ANSI Parsing:** Colors and basic formatting for v1 (using `chalk` or similar).
- **Interactive TUI Support:** Basic handling of interactive applications within blocks.

---

## 7. Persistence Strategy

effect-cockpit uses a **Write-Ahead Logging (WAL)** approach for sessions with configurable retention:

1. Every state change to the `SessionStore` is asynchronously piped to an `Effect.Queue`.
2. A background "Writer" Fiber consumes the queue and persists changes to a local SQLite database (via `kysely` or `sql-effect`).
3. **Retention Policy:** Full content for last 100 blocks, metadata-only for older blocks.
4. **Session Limits:** Automatic cleanup when exceeding 100 total blocks.
5. On boot, the "Hydrator" Service reads the last session from SQLite and populates the `SessionStore`.

---

## 8. Error Handling & Resilience

Using **Effect.Schema**, all external inputs (CLI flags, config files, process outputs) are validated at the boundary.

- **Process Crashes:** If the PTY bridge crashes, Effect's `Retry` policy can attempt a restart or gracefully mark the Block as "Crashed" without taking down the entire Harness UI.
- **UI Boundaries:** Ink's error boundaries are used to catch rendering glitches, allowing the user to `/reload` the UI without losing the underlying process state.

---

## 9. Technology Stack Summary

- **Language:** TypeScript (Strict Mode)
- **Effect Modules:** `Stream`, `Hub`, `Ref`, `Schedule`, `Fiber`, `Scope`.
- **Core Dependency:** `effect-cli-tui` (foundational TUI components)
- **Rendering:** Ink (React-based TUI).
- **Process:** `node-pty` for terminal emulation.
- **Storage:** `SQLite` for session persistence.
- **Styling:** `Chalk` + `Yoga` (via Ink).
- **ANSI:** Basic color/formatting support via `chalk` (v1).

---

## 10. Performance & Resource Recommendations

### 10.1 Resource Limits

- **Maximum Blocks:** 100 per session (configurable)
- **Buffer Size:** 1MB per block maximum (with overflow to disk)
- **Memory Target:** < 100MB for typical sessions
- **Startup Time:** < 500ms to restore session

### 10.2 Performance Targets

- **Input Latency:** < 16ms (60fps equivalent)
- **Frame Rate:** 30+ FPS during active command execution
- **Command Start:** < 50ms from Enter to process spawn
- **Session Save:** < 100ms for typical session persistence

### 10.3 Optimization Strategies

- **Virtual Scrolling:** Only render visible blocks + 10 buffer
- **Lazy Loading:** Load older block content on demand
- **Background Persistence:** Non-blocking session writes
- **Efficient ANSI:** Minimal parsing for basic colors/formatting
