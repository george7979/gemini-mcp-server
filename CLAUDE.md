# CLAUDE.md

This file provides context for Claude Code when working with this project.

## Project Overview

**gemini-mcp-server** is an MCP (Model Context Protocol) server that provides Google Gemini AI capabilities to Claude Code. It implements 4 tools: text generation, multi-turn conversations, web search with grounding, and YouTube video analysis.

## Quick Reference

### Build & Run
```bash
npm install     # Install dependencies
npm run dev     # Development with hot reload (tsx watch)
npm run build   # Compile TypeScript to dist/
npm start       # Run compiled server
```

### Test with MCP Inspector
```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

### Environment
Requires `GOOGLE_API_KEY` environment variable. Get a key at: https://aistudio.google.com/apikey

## Architecture

### Single-File Design
All server code is in `src/index.ts` (~600 LOC). This is intentional:
- Simple project (4 tools)
- Easy to understand and modify
- No complex module dependencies

### Key Patterns

**Tool Registration (Anthropic MCP Guidelines):**
```typescript
server.registerTool(
  "tool_name",
  {
    title: "Human-readable title",
    description: `Comprehensive description with Args, Returns, Examples`,
    inputSchema: ZodSchema.strict(),
    annotations: { readOnlyHint: true, idempotentHint: false, ... }
  },
  async (params) => { /* handler */ }
);
```

**Why `idempotentHint: false`:** AI text generation produces different outputs for the same input.

**Zod with `.strict()`:** Rejects unknown properties for security and clarity.

### Code Structure
```
src/index.ts:
├── Constants (SERVER_NAME, FALLBACK_MODEL, CONFIGURED_MODEL, ACTIVE_MODEL)
├── Environment validation (GOOGLE_API_KEY)
├── Gemini client initialization
├── Model validation (validateConfiguredModel)
├── Shared types & utilities (buildGenerationConfig, handleGeminiError)
├── Tool: gemini_generate
├── Tool: gemini_messages
├── Tool: gemini_search
├── Tool: gemini_youtube
└── Server startup (validates model, then connects)
```

## Tools Implemented

| Tool | Purpose |
|------|---------|
| `gemini_generate` | Simple text generation |
| `gemini_messages` | Multi-turn conversations |
| `gemini_search` | Web search + grounding |
| `gemini_youtube` | YouTube video analysis |
| `gemini_status` | Server status and config check |

**Default Model:** `gemini-3-pro-preview` (configurable via `GEMINI_MODEL` env var)

## Dependencies

- `@modelcontextprotocol/sdk` ^1.13.3 - MCP protocol
- `@google/genai` ^1.30.0 - Official Google AI SDK
- `zod` ^3.24.1 - Schema validation

## Common Tasks

### Adding a New Tool
1. Define Zod schema with `.strict()`
2. Call `server.registerTool()` with comprehensive description
3. Include proper annotations
4. Add to README tool list

### Modifying Error Handling
Edit `handleGeminiError()` function - maps API errors to actionable user messages.

### Changing Default Model
Set `GEMINI_MODEL` environment variable in your MCP client config (e.g., `.claude.json`).

**Model Validation:** At startup, the server validates the configured model via `models.list()` API:
- If `GEMINI_MODEL` not set → uses default `gemini-3-pro-preview` (no validation)
- If model exists → uses it silently
- If model doesn't exist → warning to stderr + fallback to `gemini-3-pro-preview`

**Fallback model:** Hardcoded in `FALLBACK_MODEL` constant in `src/index.ts`.

## Documentation

- [docs/PRD.md](./docs/PRD.md) - Product requirements
- [docs/PLAN.md](./docs/PLAN.md) - Implementation roadmap (completed)
- [docs/TECH.md](./docs/TECH.md) - Technical specification
