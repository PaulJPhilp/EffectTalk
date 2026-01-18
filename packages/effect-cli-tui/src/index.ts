// biome-ignore assist/source/organizeImports: <>
export { EffectCLI } from "./cli.js";
export {
  applyChalkStyle,
  displayHighlight,
  displayInfo,
  displayListItem,
  displayMuted,
  displayWarning,
} from "./core/colors.js";
export {
  display,
  displayError,
  displayJson,
  displayLines,
  displayOutput,
  displaySuccess,
} from "./core/display.js";
// Runtimes
export {
  runWithCLI,
  runWithRuntime,
  runWithTUI,
  runWithTUIWithSlashCommands,
} from "./runtime.js";
export {
  DEFAULT_SLASH_COMMANDS,
  DEFAULT_SLASH_COMMAND_REGISTRY,
  addToHistory,
  configureDefaultSlashCommands,
  createEffectCliSlashCommand,
  createSlashCommandRegistry,
  getSessionHistory,
  getSlashCommandHistory,
  getSlashCommandSuggestions,
  getSlashCommandSuggestionsAsync,
  getSlashCommandSuggestionsEffect,
  parseSlashCommand,
  setGlobalSlashCommandRegistry,
  withSlashCommands,
} from "./tui-slash-commands.js";
export type {
  ParsedSlashCommand,
  SessionHistoryEntry,
  SlashCommandContext,
  SlashCommandDefinition,
  SlashCommandRegistry,
  SlashCommandResult,
} from "./tui-slash-commands.js";
export { displayBox, displayPanel } from "./ui/boxes/box.js";
export { Title } from "./ui/boxes/box-style.js";
export type { BoxStyle } from "./ui/boxes/box-style.js";
// Panels
export {
  KeyValuePanel,
  Panel,
  TablePanel,
  renderKeyValuePanel,
  renderTablePanel,
} from "./ui/panels/index.js";
export type {
  KeyValueItem,
  KeyValuePanelProps,
  PanelProps,
  PanelTableColumn,
  TablePanelProps,
  TableRow,
} from "./ui/panels/index.js";
// Layout
export { TUILayout } from "./ui/layout/TUILayout.js";
export type { OutputItem, TUILayoutProps } from "./ui/layout/TUILayout.js";
export type { SpinnerOptions } from "./ui/progress/spinner.js";
// Progress indicators
export {
  spinnerEffect,
  startSpinner,
  stopSpinner,
  updateSpinner,
} from "./ui/progress/spinner.js";
export type { TableColumn, TableOptions } from "./ui/tables/table.js";
// Tables
export { displayTable } from "./ui/tables/table.js";

// TUI
export { TUIHandler } from "./tui.js";

// Supermemory integration
export * from "./supermemory/index.js";

// Kits system
export * from "./kits/index.js";

// Agent harness services
export { ApprovalService } from "./services/approval/index.js";
export type {
  OperationKind,
  OperationSummary,
} from "./services/approval/index.js";
export { ToolCallLogService } from "./services/logs/index.js";
export type { ToolCallLogEntry } from "./services/logs/index.js";
export { ModeService } from "./services/mode/index.js";
export type { Mode } from "./services/mode/index.js";

// Utilities
export { makeUnifiedDiff } from "./utils/diff.js";
export {
  getCurrentBranch,
  getGitRoot,
  getStatusSummary,
  isGitClean,
} from "./utils/git.js";
export { showOnboardingIfNeeded } from "./utils/onboarding.js";

// Core types
export type {
  CLIResult,
  CLIRunOptions,
  DisplayOptions,
  DisplayType,
  JsonDisplayOptions,
  PromptOptions,
  SelectOption,
} from "./types.js";

// Error types
export { CLIError, InkError, TUIError } from "./types.js";
