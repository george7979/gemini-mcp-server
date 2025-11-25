# CLAUDE.md - Gemini MCP Server

## Project Overview
MCP server integrating Google Gemini AI with Claude Code. Provides 4 tools: text generation, conversations, web search with grounding, and YouTube video analysis.

## Quick Reference

### Build Commands
```bash
npm install     # Install dependencies
npm run dev     # Development with tsx watch (hot reload)
npm run build   # Compile TypeScript to dist/
npm start       # Run compiled server
```

### Project Structure
```
gemini-mcp-server/
├── src/
│   └── index.ts          # Main server implementation
├── dist/                 # Compiled output (gitignored)
├── docs/                 # CKM documentation (PRD, PLAN, TECH)
├── package.json
├── tsconfig.json
├── .env.example          # Environment template
└── CLAUDE.md             # This file
```

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| GOOGLE_API_KEY | Yes | Google AI API key for Gemini |

## Architecture

### MCP SDK Pattern
This server follows Anthropic's official MCP guidelines:
- Uses `McpServer` + `registerTool()` pattern
- Zod schemas for input validation
- Tool annotations (readOnlyHint, destructiveHint, etc.)
- Structured error responses

### Tools Implemented
| Tool | Purpose | Annotations |
|------|---------|-------------|
| `gemini_generate` | Simple text generation | readOnly, idempotent |
| `gemini_messages` | Structured conversations | readOnly, idempotent |
| `gemini_search` | Web search + grounding | readOnly, openWorld |
| `gemini_youtube` | YouTube video analysis | readOnly, openWorld |

### Google AI SDK
Uses `@google/genai` package (official Google AI SDK):
- `GoogleGenAI` client for API calls
- `models.generateContent()` for generation
- Google Search grounding for web search tool

## Development Guidelines

### Code Style
- TypeScript strict mode enabled
- Zod for runtime schema validation
- Async/await for all API calls
- Actionable error messages

### Testing
```bash
# Build first
npm run build

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

### Adding New Tools
1. Define Zod schema for input
2. Register with `server.registerTool()`
3. Include proper annotations
4. Add to README tool list

## Documentation
- [PRD](./docs/PRD.md) - Product requirements
- [PLAN](./docs/PLAN.md) - Implementation roadmap
- [TECH](./docs/TECH.md) - Technical specification

## External Resources
- [MCP Protocol](https://modelcontextprotocol.io/)
- [Google AI Studio](https://aistudio.google.com/) - API key management
- [Gemini API Docs](https://ai.google.dev/gemini-api/docs)
