# Changelog

## [0.1.0] - 2024-12-21

### Added

- Initial release of `effect-prompt`
- **Core Services**:
  - `PromptService` - Main orchestration service for rendering and validating prompts
  - `PromptStorageService` - File-based storage for `.liquid` templates and `.meta.json` metadata
  - `ValidationService` - Schema-based variable validation using Effect Schema
  - `PromptConfig` - Environment-based configuration

- **AI-Specific Filters**:
  - `tokenCount` - Approximate token counting (word-based approximation)
  - `sanitize` - Remove control characters and normalize whitespace
  - `truncateToTokens` - Truncate text to token budget with binary search
  - `stripMarkdown` - Convert markdown to plain text
  - `jsonEscape` - Escape special characters for JSON strings
  - `toNumberedList` - Convert arrays to numbered lists
  - `toBulletedList` - Convert arrays to bulleted lists

- **Conversation Filters**:
  - `formatConversation` - Format conversations for OpenAI, Anthropic, or plain formats
  - `filterByRole` - Extract messages by role
  - `conversationTokens` - Count tokens in conversations

- **Composition Tags**:
  - `{% extends %}` - Template inheritance from parent templates
  - `{% include %}` - Include other templates with variable context

- **Error Types**:
  - `PromptNotFoundError` - When prompt template is not found
  - `VariableValidationError` - When variable validation fails
  - `PromptRenderError` - When rendering fails
  - `TokenLimitExceededError` - When token budget is exceeded
  - `StorageError` - When file operations fail
  - `InheritanceError` - When template inheritance fails
  - `VersionConflictError` - When version conflicts occur

- **Type Definitions**:
  - `PromptTemplate` - Template with content and metadata
  - `PromptMetadata` - Version, tags, author, extends, maxTokens
  - `ValidatedPrompt` - Template with validated variables
  - `ConversationMessage` - Chat message with role and content
  - `Conversation` - Collection of messages
  - `RenderedPrompt` - Rendered output with metadata
  - `ValidationResult` - Schema validation results

- **Effect Schemas**:
  - `PromptTemplateSchema`
  - `PromptMetadataSchema`
  - `ConversationMessageSchema`
  - `ConversationSchema`
  - `CommonVariableSchemas` - Reusable schemas (text, number, email, url, json, stringArray)

- **Storage Format**:
  - `.liquid` files for template content
  - `.meta.json` files for metadata (version, tags, author, created, updated, extends, maxTokens)

- **Configuration**:
  - `PROMPTS_DIR` - Custom prompts directory
  - `DEFAULT_MAX_TOKENS` - Default token limit (4000)
  - `ENABLE_PROMPT_CACHING` - Enable/disable caching
  - `PROMPT_CACHE_TTL` - Cache TTL in seconds (3600)

- **Public API**:
  - Convenience functions: `renderPrompt()`, `validateVariables()`, `renderConversation()`
  - Full service exports for advanced usage
  - Filter and tag exports for extensibility

- **Testing**:
  - Unit tests for AI filters
  - Unit tests for conversation filters
  - Unit tests for prompt service
  - Layer-based testing patterns
  - Mock storage layer for testing

### Design Decisions

- **File-based storage** over database for simplicity and git-friendliness
- **Metadata files** for versioning instead of git tags for portability
- **Simple token approximation** (word-based) for speed; can be upgraded to tiktoken later
- **Render-time inheritance** for template flexibility
- **Effect.Service pattern** for type-safe dependency injection
- **Discriminated union errors** for composable error handling

### Future Enhancements

- Tiktoken integration for accurate token counting
- Prompt analytics and usage tracking
- A/B testing for prompt versions
- Prompt optimization suggestions
- Multi-language support
- Prompt bundles/packages
- Hot reloading for development
- Web-based prompt studio UI

### Breaking Changes

None - initial release.

### Known Limitations

- Token counting is approximate (word-based, ~1.3 tokens/word)
- Template blocks/extends are simplified (no block override syntax yet)
- No built-in analytics or versioning comparison UI
- No tiktoken or paid API token counting

### Security Notes

- Sanitization is basic; for production use cases with untrusted input, consider additional sanitization
- No built-in rate limiting or request validation
- File permissions should be managed by the host system

---

## Future Versions

### 0.2.0 (Planned)

- Advanced block syntax for template inheritance
- Prompt version comparison UI
- Usage analytics service
- Built-in tiktoken support (optional)
- Prompt caching strategies
