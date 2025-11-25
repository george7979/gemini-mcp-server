# TECH: Gemini MCP Server

## Architecture

### Technology Stack
| Component | Technology | Version |
|-----------|------------|---------|
| Language | TypeScript | ^5.7.2 |
| Runtime | Node.js | >=18 |
| MCP SDK | @modelcontextprotocol/sdk | ^1.6.1 |
| Validation | Zod | ^3.23.8 |
| HTTP Client | axios | ^1.7.9 |
| Dev Runner | tsx | ^4.19.2 |

### Project Structure (Target)
```
gemini-mcp-server/
├── src/
│   ├── index.ts          # Main entry, McpServer init
│   ├── tools/            # Tool implementations
│   │   ├── generate.ts   # gemini_generate
│   │   ├── messages.ts   # gemini_messages
│   │   ├── search.ts     # gemini_search
│   │   └── youtube.ts    # gemini_youtube
│   ├── schemas/          # Zod validation schemas
│   │   └── index.ts
│   ├── services/         # API clients
│   │   └── gemini.ts     # Google Gemini API client
│   └── constants.ts      # Shared constants
├── dist/                 # Compiled output (gitignored)
├── package.json
├── tsconfig.json
├── .gitignore
├── .env.example          # Template for env vars
├── README.md
├── CLAUDE.md
├── PRD.md
├── PLAN.md
└── TECH.md
```

## API Design

### MCP Tools

#### gemini_generate
```typescript
Input: {
  input: string;           // Required: prompt text
  model?: string;          // Default: "gemini-2.5-flash"
  temperature?: number;    // 0-2, default: 1
  max_tokens?: number;     // Max output tokens
  top_p?: number;          // 0-1
  top_k?: number;          // Top-k sampling
}

Output: {
  text: string;
  model: string;
  usage?: { input_tokens, output_tokens }
}
```

#### gemini_messages
```typescript
Input: {
  messages: Array<{role: "user"|"model", content: string}>;
  model?: string;
  temperature?: number;
  max_tokens?: number;
}

Output: {
  text: string;
  model: string;
  usage?: object;
}
```

#### gemini_search
```typescript
Input: {
  input: string;           // Search query
  model?: string;
  temperature?: number;
}

Output: {
  text: string;
  sources?: Array<{title, url}>;  // Citations from web search
  model: string;
}
```

#### gemini_youtube
```typescript
Input: {
  youtube_url: string;     // YouTube video URL
  prompt: string;          // Question/task about video
  start_offset?: string;   // e.g. "60s"
  end_offset?: string;     // e.g. "120s"
  model?: string;
}

Output: {
  text: string;
  video_title?: string;
  model: string;
}
```

## Configuration

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| GOOGLE_API_KEY | Yes | Google AI API key for Gemini |

### Claude Code Configuration
```json
{
  "mcpServers": {
    "gemini-server": {
      "type": "stdio",
      "command": "node",
      "args": ["<PATH>/gemini-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_API_KEY": "your-api-key"
      }
    }
  }
}
```

## Development

### Scripts
```bash
npm install      # Install dependencies
npm run dev      # Development with tsx watch
npm run build    # Compile TypeScript to dist/
npm start        # Run compiled server
```

### Key Patterns (from Anthropic Guidelines)

#### Tool Registration
```typescript
server.registerTool(
  "gemini_generate",
  {
    title: "Generate with Gemini",
    description: "...",
    inputSchema: GenerateInputSchema,  // Zod schema
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true
    }
  },
  async (params) => { /* implementation */ }
);
```

#### Error Handling
```typescript
function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Actionable error messages
  }
  return `Error: ${error instanceof Error ? error.message : String(error)}`;
}
```

## External Dependencies

### Google Gemini API
- **Endpoint:** `https://generativelanguage.googleapis.com/v1beta/`
- **Auth:** API Key in header
- **Models:** gemini-2.5-flash, gemini-2.5-pro, gemini-2.0-flash-exp
- **Docs:** https://ai.google.dev/gemini-api/docs

### MCP Protocol
- **Spec:** https://modelcontextprotocol.io/
- **SDK:** https://github.com/modelcontextprotocol/typescript-sdk

## Security Considerations
- API key stored in environment variable (never in code)
- `.env` file in `.gitignore`
- No sensitive data in error messages
- HTTPS for all API calls

---
*Last Updated: 2025-11-25*
