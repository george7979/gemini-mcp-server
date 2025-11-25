# PLAN: Gemini MCP Server

## Overview
Implementation roadmap for refactoring the Gemini MCP Server to follow Anthropic's official MCP guidelines.

## Current State: ✅ COMPLETED
The server has been fully refactored to modern MCP SDK patterns:
- Modern `McpServer` + `registerTool()` API
- Zod schemas with `.strict()` for all inputs
- Comprehensive tool descriptions (Args, Returns, Examples)
- Proper tool annotations
- Actionable error messages

## Implementation Phases

### Phase 1: Project Structure ✅
- [x] Update `package.json` with modern dependencies
- [x] Update `tsconfig.json` (outDir: dist/)
- [x] Update `.gitignore` (dist/, node_modules/, .env)
- [x] Remove old `build/` folder

### Phase 2: Core Implementation ✅
- [x] Rebuild `src/index.ts` with modern API:
  - `McpServer` instead of `Server`
  - `registerTool()` instead of `setRequestHandler`
- [x] Add Zod schemas for all tools
- [x] Add proper error handling with actionable messages
- [x] Add tool annotations (readOnlyHint, destructiveHint, idempotentHint, openWorldHint)

### Phase 3: Tools Refactoring ✅
- [x] `gemini_generate` - Basic text generation
- [x] `gemini_messages` - Structured conversations
- [x] `gemini_search` - Web search with grounding
- [x] `gemini_youtube` - YouTube video analysis

### Phase 4: Documentation ✅
- [x] Write professional README.md (no hardcoded paths)
- [x] Add CLAUDE.md (project-specific instructions)
- [x] Create docs/ with CKM (PRD, PLAN, TECH)
- [x] Translate all docs to English

### Phase 5: Testing & Deployment ✅
- [x] `npm run build` - Verify compilation
- [x] Commit and push to GitHub
- [x] Make repository public
- [ ] Manual testing of each tool in Claude Code (optional)

## Technical Decisions

### Why `registerTool()` over `setRequestHandler`?
The `registerTool()` API is the recommended modern pattern per Anthropic's mcp-builder skill. It provides:
- Built-in Zod schema integration
- Cleaner registration syntax
- Automatic type inference
- Better separation of concerns

### Why `.strict()` on Zod schemas?
Strict schemas reject unexpected properties, preventing:
- Silent data loss from typos
- Security issues from unexpected inputs
- Confusion about what parameters are accepted

### Why `idempotentHint: false`?
AI text generation is inherently non-deterministic. The same prompt produces different outputs, so `idempotentHint: true` would be misleading.

## Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | ^1.13.3 | MCP protocol implementation |
| `@google/genai` | ^1.30.0 | Official Google AI SDK |
| `zod` | ^3.24.1 | Runtime schema validation |
| `tsx` | ^4.19.2 | Development (TypeScript execution) |

## Risk Mitigation
| Risk | Mitigation |
|------|------------|
| MCP SDK breaking changes | Pinned to v1.13.3, tested pattern |
| Gemini API changes | Using official @google/genai SDK |
| TypeScript inference issues | Added `??` fallbacks for default values |

## Timeline
- **Estimated:** 1-2 work sessions
- **Actual:** 1 session
- **Status:** ✅ COMPLETED

---
*Last Updated: 2025-11-25*

---
> 📋 This document was created following the [Context Keeper Method](https://github.com/george7979/context-keeper-method) - a structured approach to AI-friendly project documentation.
