# TECH: Gemini MCP Server

## Architecture

### Technology Stack
| Component | Technology | Version |
|-----------|------------|---------|
| Language | TypeScript | ^5.8.2 |
| Runtime | Node.js | >=18 |
| MCP SDK | @modelcontextprotocol/sdk | ^1.13.3 |
| AI SDK | @google/genai | ^1.30.0 |
| Validation | Zod | ^3.24.1 |
| Dev Runner | tsx | ^4.19.2 |

### Project Structure
```
gemini-mcp-server/
├── src/
│   └── index.ts          # Complete server implementation
├── dist/                 # Compiled output (gitignored)
├── docs/
│   ├── PRD.md            # Product requirements
│   ├── PLAN.md           # Implementation roadmap
│   └── TECH.md           # This file
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example          # Environment template
├── README.md             # User documentation
└── CLAUDE.md             # AI assistant context
```

### Design Decisions

**Single-file architecture:** All server code resides in `src/index.ts`. This was chosen because:
- The server is simple (4 tools, ~600 LOC)
- Easier to understand and maintain
- No complex dependencies between modules
- Single compilation unit = faster builds

## API Design

### MCP Tools

#### gemini_generate
Simple text generation with a single prompt.

```typescript
Input: {
  input: string;           // Required: prompt text
  model?: string;          // Default: GEMINI_MODEL env or "gemini-3-flash-preview"
  temperature?: number;    // 0-2, controls randomness
  max_tokens?: number;     // Maximum output tokens
  top_p?: number;          // 0-1, nucleus sampling
  top_k?: number;          // Top-k sampling
}

Output: {
  content: [{ type: "text", text: string }]
}
```

#### gemini_messages
Structured multi-turn conversations.

```typescript
Input: {
  messages: Array<{
    role: "user" | "model";
    content: string;
  }>;
  model?: string;          // Default: GEMINI_MODEL env or "gemini-3-flash-preview"
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
}

Output: {
  content: [{ type: "text", text: string }]
}
```

#### gemini_search
Web search with Google Search grounding.

```typescript
Input: {
  input: string;           // Search query
  model?: string;          // Default: GEMINI_MODEL env or "gemini-3-flash-preview"
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
}

Output: {
  content: [{
    type: "text",
    text: string  // Includes **Search Queries:** and **Sources:** sections
  }]
}
```

#### gemini_youtube
YouTube video analysis (transcription, summarization, Q&A).

```typescript
Input: {
  youtube_url: string;     // YouTube video URL
  prompt: string;          // Question/task about video
  model?: string;          // Default: GEMINI_MODEL env or "gemini-3-flash-preview"
  start_offset?: string;   // e.g., "60s", "1m30s"
  end_offset?: string;     // e.g., "120s", "2m"
  temperature?: number;
  max_tokens?: number;
}

Output: {
  content: [{
    type: "text",
    text: string  // Includes video URL and segment info
  }]
}
```

#### gemini_status
Server status and configuration check.

```typescript
Input: {}  // No parameters required

Output: {
  content: [{
    type: "text",
    text: string  // Formatted status with:
                  // - active_model: Currently used model
                  // - configured_model: From GEMINI_MODEL env (or null)
                  // - fallback_model: Default fallback model
                  // - fallback_used: Whether fallback was triggered
                  // - server_version: Server version
                  // - api_key_configured: Whether GOOGLE_API_KEY is set
  }]
}
```

Use this tool to:
- Verify which Gemini model is being used
- Check if GEMINI_MODEL configuration is valid
- Debug configuration issues when model fallback occurs

## Configuration

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| GOOGLE_API_KEY | Yes | Google AI API key from [AI Studio](https://aistudio.google.com/apikey) |
| GEMINI_MODEL | No | Custom Gemini model (default: `gemini-3-flash-preview`). Validated at startup via API. |

### Claude Code Configuration
Add to your MCP settings file:

```json
{
  "mcpServers": {
    "gemini-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/gemini-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_API_KEY": "your-api-key-here",
        "GEMINI_MODEL": "gemini-3-flash-preview"  // optional
      }
    }
  }
}
```

## Development

### Scripts
```bash
npm install      # Install dependencies
npm run dev      # Development with tsx watch (hot reload)
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled server
```

### Testing
```bash
# Build the project
npm run build

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## Implementation Patterns

### Tool Registration (Anthropic Guidelines)
```typescript
server.registerTool(
  "gemini_generate",
  {
    title: "Generate Text with Gemini",
    description: `Comprehensive description with:

    Args:
      - param1 (type, required/optional): description

    Returns:
      What the tool returns.

    Examples:
      - "Example usage"

    Note: Important caveats.`,
    inputSchema: ZodSchema.strict(),
    annotations: {
      readOnlyHint: true,      // Doesn't modify system state
      destructiveHint: false,  // Non-destructive operation
      idempotentHint: false,   // AI output varies each call
      openWorldHint: true      // Interacts with external API
    }
  },
  async (params) => {
    // Implementation
  }
);
```

### Error Handling
```typescript
function handleGeminiError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("api key")) {
      return "Error: Invalid API key. Check GOOGLE_API_KEY.";
    }
    if (message.includes("quota")) {
      return "Error: API quota exceeded. Wait and retry.";
    }
    // ... more actionable messages

    return `Error: ${error.message}`;
  }
  return `Error: ${String(error)}`;
}
```

### Shared Utilities
```typescript
// Build generation config from tool params
function buildGenerationConfig(params: {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
}): GenerationConfig | undefined {
  const config: GenerationConfig = {};
  if (params.temperature !== undefined) config.temperature = params.temperature;
  if (params.max_tokens !== undefined) config.maxOutputTokens = params.max_tokens;
  // ... DRY principle
  return Object.keys(config).length > 0 ? config : undefined;
}
```

## External Dependencies

### Google Gemini API
- **SDK:** `@google/genai` (official Google AI SDK)
- **Default Model:** `gemini-3-flash-preview` (configurable via `GEMINI_MODEL` env var)
- **Model Validation:** At startup, validates configured model exists via `models.list()` API
- **Features:** Text generation, multi-modal, web grounding, video analysis
- **Docs:** https://ai.google.dev/gemini-api/docs

### MCP Protocol
- **Specification:** https://modelcontextprotocol.io/
- **SDK:** https://github.com/modelcontextprotocol/typescript-sdk
- **Version:** 1.13.3 (latest stable)

## Security Considerations

1. **API Key Protection**
   - Stored in environment variable (never in code)
   - `.env` file in `.gitignore`
   - `.env.example` provides template

2. **Input Validation**
   - Zod schemas with `.strict()` reject unknown properties
   - Type validation at runtime

3. **Error Messages**
   - Actionable but not leaking sensitive data
   - No API keys or internal paths in errors

4. **External API**
   - HTTPS enforced by Google AI SDK
   - No credentials in URLs or logs

---
*Last Updated: 2025-11-25*

---
> 📋 This document was created following the [Context Keeper Method](https://github.com/george7979/context-keeper-method) - a structured approach to AI-friendly project documentation.
