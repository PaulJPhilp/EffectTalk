# Product Requirements Document (PRD): effect-cockpit

**Project Name:** effect-cockpit
**Project Status:** Initial Specification
**Target Users:** Software Engineers, AI Engineers, Power Users
**Core Philosophy:** A "Block-Based" application harness that transforms the standard linear terminal experience into a structured, stateful, and interactive development environment.

---

## 1. Executive Summary

effect-cockpit is a next-generation application harness designed to wrap CLI tools and processes into a structured TUI. Unlike traditional terminals that treat output as a flat stream of text, effect-cockpit treats every interaction as a discrete **Block**. This allows for superior history management, rich rendering (Markdown, Diffs, TUI Widgets), and deep state persistence, powered by **Effect** for robust resource management and **TypeScript** for safety.

---

## 2. Problem Statement

Traditional TUIs and Shells suffer from:

1. **Context Loss:** High-value information is lost in a "scrollback sea."
2. **Lack of Structure:** Interleaved stdout, stderr, and user input are difficult to parse visually.
3. **No Persistence:** Restarting a TUI usually wipes the visual state and history.
4. **Static Input:** Input is often limited to simple line-editing without syntax awareness or multi-line support.

---

## 3. Functional Requirements (Prioritized)

### P0: The Block Architecture (Core Foundation)

- **Block Isolation:** Every command execution must be encapsulated in a `Block` object.
- **Metadata Tracking:** Each block must track: Command string, start/end timestamps, exit code, and output buffers.
- **Streaming UI:** Real-time rendering of stdout/stderr into the _active_ block without blocking the UI thread.
- **Status Indicators:** Visual cues for "Running," "Success," "Error," and "Cancelled."

### P1: High-Fidelity Input & Command Orchestration

- **Multi-line Editor:** A rich input buffer supporting `Shift+Enter` for newlines and basic auto-indentation.
- **Harness Interceptors (Slash Commands):** Built-in commands that control the harness (e.g., `/clear`, `/save`, `/theme`) which are never passed to the underlying shell.
- **History fuzzy-search:** A searchable history of previous commands that populates the input buffer.
- **Abort Handling:** A dedicated "Interrupt" signal (`Ctrl+C` or a TUI command) that utilizes **Effect Fibers** to gracefully kill subprocesses and mark blocks as cancelled.

### P2: State Persistence & Session Management

- **Serialized Sessions:** Save the entire state (array of blocks + input buffer + sidebar state) to SQLite store.
- **Configurable Retention:** Full content for last 100 blocks, metadata-only for older blocks.
- **Auto-Restore:** On startup, effect-cockpit restores the last session exactly where the user left off.
- **Session Limits:** Maximum 100 blocks per session with automatic cleanup of oldest blocks.
- **Snapshotting:** Ability to "Pin" or "Save" specific sessions for later reference.

### P3: Workspace Awareness (The Sidebar)

- **Context Pane:** A collapsible area showing the current working directory, active environment variables, and git branch.
- **Auto-Update:** Working directory and git status update automatically when commands change directories.
- **Resource Monitor:** Real-time display of the harness's CPU/Memory usage and the status of any background processes.

### P4: Rich Rendering & Interactivity

- **Markdown Support:** Detect and render Markdown in output (headers, code blocks, tables).
- **Interactive Diffs:** Render `diff` output in a structured, colorized side-by-side or unified view within the block.
- **Actionable Output:** Support for structured navigation of output, with plans for opening file paths and URLs in preferred local tools.
- **Multi-Block Focus:** Users can switch focus between multiple concurrently running blocks.
- **Basic ANSI Support:** Colors and basic formatting for terminal output (v1).

---

## 4. Non-Functional Requirements

- **Type Safety:** 100% TypeScript coverage with strict null checks.
- **Error Boundaries:** Use **Effect's** error tracking to ensure the harness never crashes due to a child process failure.
- **Performance:** Rendering 100 blocks with 10k+ total lines must remain fluid (utilizing virtualization or Ink's `<Static>` component).
- **Low Latency:** Keyboard input must have zero perceived lag.
- **Memory Usage:** Target < 100MB for typical sessions with full retention.
- **Frame Rate:** Maintain 30+ FPS during active command execution.

---

## 5. Technical Architecture

### The Stack

- **Runtime:** Node.js / Bun
- **Logic Framework:** `Effect` (for concurrency, resource management, and error handling)
- **UI Framework:** `Ink` (React for CLI)
- **Terminal Emulation:** `node-pty` (for real terminal interaction)
- **Dependency:** `effect-cli-tui` (used as core library)
- **Persistence:** `SQLite` with configurable retention policies
- **ANSI Processing:** Basic colors and formatting (v1)

### Component Hierarchy

```text
effect-cockpit (App Root)
├── SessionProvider (Effect Layer)
├── LayoutManager
│   ├── Header (Status/Breadcrumbs)
│   ├── MainViewport (Virtual List of Blocks)
│   │   ├── StaticBlock (Compressed History)
│   │   └── ActiveBlock (Streaming Output)
│   ├── Sidebar (Workspace Context)
│   └── Omnibar (Floating Command Palette)
└── InputController (Multi-line Buffer)
```

---

## 6. User Experience & Interaction Design

### The "Command-Response" Loop

1. User types a command in the **InputController**.
2. On `Enter`, a new **Block** is instantiated in the `SessionProvider`.
3. An **Effect Fiber** is spawned to run the command via `node-pty`.
4. Output streams into the **ActiveBlock**; the UI re-renders reactively.
5. Upon completion, the Block is "frozen" and moved to the **Static** history list.

### Keyboard Shortcuts

- `Cmd/Ctrl + K`: Open Omnibar/Command Palette.
- `Cmd/Ctrl + B`: Toggle Sidebar.
- `Cmd/Ctrl + L`: Clear session (move to archive).
- `Ctrl + C`: Interrupt active block via Effect interruption.

---

## 7. Success Metrics

- **Persistence:** Users can resume 100% of their work after an application restart.
- **Speed:** Time from "Input Submit" to "Process Start" is < 50ms.
- **Adoption:** Reduction in the number of times a user has to scroll back more than 3 screens to find information (due to block-based filtering).

---

## 8. Future Roadmap

- **Remote Harness:** Connect to a remote server/container and render the UI locally.
- **Plugin API:** Allow users to write Custom Block Renderers for specific file types and Custom Slash Commands in TypeScript.
- **Multi-pane Docking:** Support for draggable and resizable internal panes.

---

## 9. MVP Definition

The Minimum Viable Product includes:

- **P0 Features:** Complete Block Architecture with Effect-based process management
- **P1 Features:** Multi-line input, basic slash commands, history search, interrupt handling
- **P2 Features:** SQLite persistence with configurable retention policies
- **Basic P3 Features:** Workspace context with auto-updating directory awareness
- **Basic P4 Features:** Markdown rendering and simple ANSI support

Deferred to post-MVP:

- Advanced diff rendering
- Resource monitoring
- Plugin architecture
- Performance optimizations beyond basic virtualization
