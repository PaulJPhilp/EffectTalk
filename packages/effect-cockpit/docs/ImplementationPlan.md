# Implementation Plan: effect-cockpit

**Project:** effect-cockpit  
**Date:** January 17, 2026  
**Based on:** PRD v1.0 and Architecture v1.0

---

## 1. Development Strategy

### 1.1 Phased Approach

The implementation will follow a **phased approach** that delivers incrementally valuable functionality while building toward the complete vision:

- **Phase 0 (Foundation):** Core infrastructure and basic block architecture
- **Phase 1 (Core Features):** Input handling, command execution, and basic persistence
- **Phase 2 (User Experience):** Multi-block focus, workspace awareness, and rich rendering
- **Phase 3 (Polish & Performance):** Optimization, advanced features, and plugin architecture

### 1.2 Technical Principles

- **Effect-First:** All side effects managed through Effect patterns
- **Type Safety:** Strict TypeScript with comprehensive coverage
- **Incremental:** Each phase delivers a usable subset of functionality
- **Testable:** Core logic isolated and unit tested

---

## 2. Phase 0: Foundation (Week 1-2)

### 2.1 Objectives

Establish the core infrastructure and basic block architecture.

### 2.2 Key Deliverables

#### 2.2.1 Project Setup

```bash
# Package structure
packages/effect-cockpit/
├── src/
│   ├── core/           # Effect-based core logic
│   ├── state/          # State management
│   ├── ui/             # Ink components
│   ├── types/          # TypeScript definitions
│   └── index.ts        # Main entry point
├── test/               # Unit and integration tests
├── docs/               # Documentation
└── package.json
```

#### 2.2.2 Core Types and Interfaces

```typescript
// src/types/block.ts
export interface Block {
  readonly id: string;
  readonly command: string;
  readonly status: BlockStatus;
  readonly exitCode?: number;
  readonly stdout: string;
  readonly stderr: string;
  readonly startTime: number;
  readonly endTime?: number;
  readonly metadata: Record<string, any>;
}

export type BlockStatus =
  | "idle"
  | "running"
  | "success"
  | "failure"
  | "interrupted";

// src/types/session.ts
export interface Session {
  readonly id: string;
  readonly blocks: Array<Block>;
  readonly activeBlockId: string | null;
  readonly focusedBlockId: string | null;
  readonly workingDirectory: string;
  readonly environment: Record<string, string>;
  readonly retentionConfig: RetentionConfig;
}

export interface RetentionConfig {
  readonly fullContentBlocks: number;
  readonly maxTotalBlocks: number;
}
```

#### 2.2.3 Core Effect Services

```typescript
// src/core/block-service.ts
export const BlockService = {
  create: (command: string): Effect.Effect<Block, Error, never>,
  execute: (block: Block): Effect.Effect<Block, Error, ProcessScope>,
  interrupt: (blockId: string): Effect.Effect<void, Error, never>,
  updateStatus: (blockId: string, status: BlockStatus): Effect.Effect<void, Error, never>
}

// src/core/process-runtime.ts
export const ProcessRuntime = {
  spawn: (command: string, options: ProcessOptions): Effect.Effect<Process, Error, never>,
  stream: (process: Process): Effect.Stream<string, Error, never>
}
```

#### 2.2.4 Basic State Management

```typescript
// src/state/session-store.ts
export const SessionStore = {
  get: Effect.Effect<Session, never, SessionScope>,
  update: (updateFn: (session: Session) => Session): Effect.Effect<void, Error, SessionScope>,
  addBlock: (block: Block): Effect.Effect<void, Error, SessionScope>
}
```

### 2.3 Implementation Tasks

1. **Project Bootstrap**
   - Initialize package with TypeScript, Effect, Ink dependencies
   - Configure build system (tsup/esbuild)
   - Set up testing framework (vitest)
   - Configure ESLint and Prettier

2. **Core Types**
   - Define Block, Session, and related interfaces
   - Create Effect schemas for validation
   - Set up strict TypeScript configuration

3. **Effect Services**
   - Implement BlockService with basic CRUD operations
   - Create ProcessRuntime using node-pty
   - Set up Effect.Scope for resource management

4. **State Management**
   - Implement SessionStore using Effect.Ref
   - Create basic session hydration
   - Add in-memory persistence (temporary)

5. **Basic UI Skeleton**
   - Set up Ink application structure
   - Create placeholder components
   - Implement basic rendering loop

### 2.4 Acceptance Criteria

- [ ] Project builds and runs without errors
- [ ] Core types are defined and validated
- [ ] BlockService can create and execute simple commands
- [ ] SessionStore maintains state in memory
- [ ] Basic Ink UI renders and accepts input

---

## 3. Phase 1: Core Features (Week 3-4)

### 3.1 Objectives

Implement the essential command execution and persistence features.

### 3.2 Key Deliverables

#### 3.2.1 Command Execution Engine

```typescript
// src/core/command-executor.ts
export const CommandExecutor = {
  execute: (command: string): Effect.Effect<Block, Error, CommandScope>,
  streamOutput: (blockId: string): Effect.Stream<OutputChunk, Error, never>,
  handleInterrupt: (blockId: string): Effect.Effect<void, Error, never>
}

interface OutputChunk {
  readonly type: 'stdout' | 'stderr';
  readonly data: string;
  readonly timestamp: number;
}
```

#### 3.2.2 Input Controller

```typescript
// src/ui/input-controller.ts
export const InputController = {
  create: Effect.Effect<InputState, never, never>,
  handleKey: (key: KeyInput): Effect.Effect<InputAction, never, never>,
  submitCommand: (input: string): Effect.Effect<void, Error, SessionScope>
}

interface InputState {
  readonly buffer: string;
  readonly cursor: number;
  readonly history: Array<string>;
}
```

#### 3.2.3 SQLite Persistence

```typescript
// src/state/persistence.ts
export const Persistence = {
  saveSession: (session: Session): Effect.Effect<void, Error, DatabaseScope>,
  loadSession: Effect.Effect<Option<Session>, Error, DatabaseScope>,
  cleanupOldBlocks: Effect.Effect<void, Error, DatabaseScope>
}
```

#### 3.2.4 Basic Block Components

```typescript
// src/ui/components/block.tsx
export const BlockComponent: React.FC<{ block: Block; isActive: boolean }> = ({
  block,
  isActive,
}) => {
  // Render block header with status
  // Render stdout/stderr content
  // Handle active streaming
};

// src/ui/components/active-block.tsx
export const ActiveBlock: React.FC<{ block: Block }> = ({ block }) => {
  // Real-time streaming output
  // Status indicators
  // Interrupt handling
};
```

### 3.3 Implementation Tasks

1. **Command Execution**
   - Implement full command lifecycle with node-pty
   - Add real-time output streaming
   - Implement interrupt handling with Effect.Fiber.interrupt
   - Add proper error handling and cleanup

2. **Input Handling**
   - Create multi-line input editor
   - Implement history navigation
   - Add basic slash commands (`/clear`, `/exit`)
   - Handle keyboard shortcuts

3. **Persistence Layer**
   - Set up SQLite database with migrations
   - Implement session save/restore
   - Add retention policy enforcement
   - Create background persistence service

4. **UI Components**
   - Build BlockComponent with status indicators
   - Implement ActiveBlock with streaming
   - Create basic layout manager
   - Add virtual scrolling for performance

5. **Integration**
   - Connect UI to state management
   - Wire up command execution flow
   - Test persistence on application restart
   - Verify interrupt handling

### 3.4 Acceptance Criteria

- [ ] Commands execute and display output in real-time
- [ ] Ctrl+C properly interrupts running commands
- [ ] Session persists across application restarts
- [ ] Multi-line input works with Shift+Enter
- [ ] Basic slash commands function
- [ ] History navigation works
- [ ] Performance acceptable with 50+ blocks

---

## 4. Phase 2: User Experience (Week 5-6)

### 4.1 Objectives

Enhance the user experience with multi-block focus, workspace awareness, and rich rendering.

### 4.2 Key Deliverables

#### 4.2.1 Multi-Block Focus Management

```typescript
// src/state/focus-manager.ts
export const FocusManager = {
  switchFocus: (blockId: string): Effect.Effect<void, Error, SessionScope>,
  getNextBlock: Effect.Effect<Option<string>, never, SessionScope>,
  getPreviousBlock: Effect.Effect<Option<string>, never, SessionScope>
}
```

#### 4.2.2 Workspace Awareness

```typescript
// src/core/workspace-service.ts
export const WorkspaceService = {
  getCurrentDirectory: Effect.Effect<string, Error, never>,
  getGitBranch: Effect.Effect<Option<string>, Error, never>,
  getEnvironment: Effect.Effect<Record<string, string>, Error, never>,
  watchDirectory: Effect.Stream<DirectoryChange, Error, never>,
};
```

#### 4.2.3 Rich Rendering Engine

```typescript
// src/ui/rendering/markdown-renderer.ts
export const MarkdownRenderer = {
  detect: (content: string): boolean,
  render: (content: string): Array<React.ReactNode>
}

// src/ui/rendering/ansi-renderer.ts
export const AnsiRenderer = {
  parse: (content: string): Array<FormattedText>,
  render: (formatted: Array<FormattedText>): React.ReactNode
}
```

#### 4.2.4 Enhanced UI Components

```typescript
// src/ui/components/sidebar.tsx
export const Sidebar: React.FC<{ workspace: WorkspaceInfo }> = ({
  workspace,
}) => {
  // Display current directory
  // Show git branch and status
  // Environment variables summary
};

// src/ui/components/omnibar.tsx
export const Omnibar: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  // Command palette interface
  // Fuzzy search functionality
  // Quick actions
};
```

### 4.3 Implementation Tasks

1. **Multi-Block Focus**
   - Implement focus switching between active blocks
   - Add visual indicators for focused block
   - Create keyboard navigation (Tab, Shift+Tab)
   - Handle input routing to focused block

2. **Workspace Awareness**
   - Implement directory change detection
   - Add git status monitoring
   - Create environment variable display
   - Set up file system watchers

3. **Rich Rendering**
   - Add Markdown detection and rendering
   - Implement basic ANSI color parsing
   - Create diff rendering for git output
   - Add syntax highlighting for code blocks

4. **Enhanced UI**
   - Build collapsible sidebar
   - Implement omnibar with fuzzy search
   - Add status bar and breadcrumbs
   - Create responsive layout system

5. **User Interactions**
   - Implement keyboard shortcuts
   - Add mouse support where applicable
   - Create help system
   - Add theme support

### 4.4 Acceptance Criteria

- [ ] Users can switch focus between multiple running blocks
- [ ] Sidebar shows current directory and git status
- [ ] Markdown content renders properly
- [ ] ANSI colors display correctly
- [ ] Omnibar provides quick command access
- [ ] Keyboard shortcuts work as expected
- [ ] Layout adapts to terminal size

---

## 5. Phase 3: Polish & Performance (Week 7-8)

### 5.1 Objectives

Optimize performance, add advanced features, and prepare for release.

### 5.2 Key Deliverables

#### 5.2.1 Performance Optimizations

```typescript
// src/ui/performance/virtual-scroller.tsx
export const VirtualScroller: React.FC<VirtualScrollerProps> = ({ blocks, renderItem }) => {
  // Implement virtual window
  // Optimize rendering for 100+ blocks
  // Handle dynamic block heights
}

// src/state/performance/cache-manager.ts
export const CacheManager = {
  getBlock: (id: string): Effect.Effect<Option<Block>, never, CacheScope>,
  cacheBlock: (block: Block): Effect.Effect<void, never, CacheScope>,
  evictOldBlocks: Effect.Effect<void, never, CacheScope>
}
```

#### 5.2.2 Plugin Architecture Foundation

```typescript
// src/plugins/plugin-manager.ts
export const PluginManager = {
  loadPlugin: (plugin: Plugin): Effect.Effect<void, Error, PluginScope>,
  registerBlockRenderer: (type: string, renderer: BlockRenderer): Effect.Effect<void, Error, PluginScope>,
  registerSlashCommand: (command: string, handler: CommandHandler): Effect.Effect<void, Error, PluginScope>
}

interface Plugin {
  readonly name: string;
  readonly version: string;
  readonly blockRenderers?: Record<string, BlockRenderer>;
  readonly slashCommands?: Record<string, CommandHandler>;
}
```

#### 5.2.3 Advanced Features

```typescript
// src/features/session-snapshots.ts
export const SessionSnapshots = {
  createSnapshot: (name: string): Effect.Effect<void, Error, SessionScope>,
  loadSnapshot: (name: string): Effect.Effect<void, Error, SessionScope>,
  listSnapshots: Effect.Effect<Array<SnapshotInfo>, Error, SessionScope>
}

// src/features/export-import.ts
export const ExportImport = {
  exportSession: (path: string): Effect.Effect<void, Error, FileSystemScope>,
  importSession: (path: string): Effect.Effect<void, Error, FileSystemScope>
}
```

### 5.3 Implementation Tasks

1. **Performance Optimization**
   - Implement virtual scrolling for block list
   - Add block content caching
   - Optimize SQLite queries
   - Profile and optimize hot paths
   - Add performance monitoring

2. **Plugin Architecture**
   - Design plugin interface
   - Implement plugin loading system
   - Create example plugins
   - Add plugin documentation

3. **Advanced Features**
   - Add session snapshots
   - Implement export/import functionality
   - Create block search and filtering
   - Add block tagging and organization

4. **Polish and Refinement**
   - Improve error messages
   - Add comprehensive help system
   - Implement themes and customization
   - Add accessibility improvements

5. **Testing and Documentation**
   - Comprehensive test suite
   - Performance benchmarks
   - User documentation
   - Developer documentation

### 5.4 Acceptance Criteria

- [ ] Application handles 100+ blocks smoothly
- [ ] Memory usage stays under 100MB
- [ ] Plugin system loads and executes custom code
- [ ] Session snapshots work correctly
- [ ] Export/import functions properly
- [ ] All features documented
- [ ] Performance benchmarks met

---

## 6. Technical Dependencies

### 6.1 Core Dependencies

```json
{
  "effect": "^3.0.0",
  "effect-cli-tui": "^1.0.0",
  "ink": "^4.0.0",
  "react": "^18.0.0",
  "node-pty": "^1.0.0",
  "chalk": "^5.0.0",
  "sqlite3": "^5.0.0",
  "kysely": "^0.26.0"
}
```

### 6.2 Development Dependencies

```json
{
  "typescript": "^5.0.0",
  "vitest": "^1.0.0",
  "eslint": "^8.0.0",
  "prettier": "^3.0.0",
  "tsup": "^8.0.0"
}
```

---

## 7. Risk Assessment and Mitigation

### 7.1 Technical Risks

| Risk                            | Impact | Mitigation                                 |
| ------------------------------- | ------ | ------------------------------------------ |
| Effect learning curve           | Medium | Start with core patterns, gradual adoption |
| node-pty compatibility          | Medium | Test across platforms, fallback strategies |
| Performance with large sessions | High   | Virtual scrolling, caching, benchmarks     |
| SQLite concurrency issues       | Medium | Use Effect.Queue for serialization         |

### 7.2 Project Risks

| Risk                     | Impact | Mitigation                                  |
| ------------------------ | ------ | ------------------------------------------- |
| Scope creep              | High   | Strict MVP definition, phased approach      |
| Effect ecosystem changes | Medium | Pin versions, monitor updates               |
| Terminal compatibility   | Medium | Test across terminals, graceful degradation |

---

## 8. Success Metrics

### 8.1 Technical Metrics

- **Performance:** <50ms command start, <16ms input latency
- **Memory:** <100MB typical usage
- **Reliability:** <1% crash rate, graceful error handling
- **Test Coverage:** >90% for core logic

### 8.2 User Experience Metrics

- **Session Persistence:** 100% successful restore
- **Multi-Block:** Smooth switching between 5+ concurrent blocks
- **Rich Rendering:** Proper Markdown and ANSI display
- **Workflow Efficiency:** Reduced context switching vs traditional terminal

---

## 9. Timeline Summary

| Phase   | Duration | Key Deliverables                                       |
| ------- | -------- | ------------------------------------------------------ |
| Phase 0 | 2 weeks  | Core infrastructure, basic block architecture          |
| Phase 1 | 2 weeks  | Command execution, persistence, input handling         |
| Phase 2 | 2 weeks  | Multi-block focus, workspace awareness, rich rendering |
| Phase 3 | 2 weeks  | Performance optimization, plugins, advanced features   |

**Total Estimated Timeline:** 8 weeks

---

## 10. Next Steps

1. **Immediate (Week 1):** Begin Phase 0 with project setup and core types
2. **Short-term (Week 2-3):** Complete Phase 0 and start Phase 1 implementation
3. **Medium-term (Week 4-6):** Focus on Phase 1-2 core features
4. **Long-term (Week 7-8):** Polish, optimization, and release preparation

This implementation plan provides a clear roadmap for building effect-cockpit incrementally while maintaining high quality and performance standards.
