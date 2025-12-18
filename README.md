# Gemini MCP Server

[![MCP](https://img.shields.io/badge/MCP-1.13.3-blue)](https://modelcontextprotocol.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An MCP (Model Context Protocol) server that brings Google Gemini AI capabilities to Claude Code and other MCP clients. Built following Anthropic's official MCP guidelines.

## Why Gemini + Claude?

While Claude excels at many tasks, Gemini offers unique capabilities:

- **Google Search Grounding** - Real-time web search with source citations
- **YouTube Video Analysis** - Transcribe, summarize, or ask questions about videos
- **Alternative Perspective** - Get a second opinion from a different AI model
- **Multimodal Strength** - Gemini's strong video understanding capabilities

## Features

| Tool | Description |
|------|-------------|
| `gemini_generate` | Simple text generation with input prompts |
| `gemini_messages` | Multi-turn structured conversations |
| `gemini_search` | Web search with Google Search grounding and citations |
| `gemini_youtube` | YouTube video analysis (transcription, Q&A, summarization) |
| `gemini_status` | Server status and configuration check |

**Default Model:** `gemini-3-flash-preview` (configurable via `GEMINI_MODEL` env var)

## Quick Start

### Prerequisites

- **Node.js 18+** - [Download](https://nodejs.org/)
- **Google AI API Key** - [Get your free key](https://aistudio.google.com/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/george7979/gemini-mcp-server.git
cd gemini-mcp-server

# Install dependencies
npm install

# Build the server
npm run build
```

### Configuration

#### Option 1: Quick Install (Recommended)

Use Claude Code's built-in command:

```bash
claude mcp add gemini-mcp-server node /absolute/path/to/gemini-mcp-server/dist/index.js -e GOOGLE_API_KEY=your-api-key-here
```

> **Tip:** Run `pwd` in the gemini-mcp-server directory to get the absolute path.

To install globally (available in all projects):
```bash
claude mcp add gemini-mcp-server node /path/to/dist/index.js -e GOOGLE_API_KEY=your-key --scope user
```

#### Option 2: Manual Configuration

Add to your Claude Code MCP settings file (`~/.claude.json`)

```json
{
  "mcpServers": {
    "gemini-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/gemini-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_API_KEY": "your-api-key-here",
        "GEMINI_MODEL": "gemini-3-flash-preview"  // optional - validated at startup
      }
    }
  }
}
```

#### Option 3: VS Code with Claude Extension

Add to `.vscode/mcp.json`

```json
{
  "servers": {
    "gemini-mcp-server": {
      "type": "stdio",
      "command": "node",
      "args": ["${workspaceFolder}/path/to/gemini-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_API_KEY": "your-api-key-here",
        "GEMINI_MODEL": "gemini-3-flash-preview"  // optional - validated at startup
      }
    }
  }
}
```

> **Note:** Replace the path with your actual installation location. You can find it with `pwd` in the gemini-mcp-server directory.

### Verify Installation

Restart Claude Code after configuration. You should see the Gemini tools available:

```
gemini_generate - Generate text using Google Gemini AI
gemini_messages - Multi-turn conversation with Gemini
gemini_search   - Web search with Google Search grounding
gemini_youtube  - Analyze YouTube videos
gemini_status   - Check server status and configuration
```

## Usage Examples

### Simple Generation
```
Ask Gemini: "Explain quantum entanglement in simple terms"
```

### Web Search with Citations
```
Search with Gemini: "What are the latest developments in AI agents in 2025?"
```

### YouTube Analysis
```
Analyze this YouTube video: https://www.youtube.com/watch?v=VIDEO_ID
Prompt: "Summarize the main points in bullet format"
```

### Multi-turn Conversation
```
Have a conversation with Gemini about software architecture,
maintaining context across multiple exchanges.
```

## Tool Reference

### gemini_generate

Generate text from a single prompt.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | string | Yes | The prompt or question |
| `model` | string | No | Model to use (default: `gemini-3-flash-preview`) |
| `temperature` | number | No | Randomness 0-2 (default: 1) |
| `max_tokens` | number | No | Maximum output length |
| `top_p` | number | No | Nucleus sampling 0-1 |
| `top_k` | number | No | Top-k sampling |

### gemini_messages

Multi-turn conversation with message history.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `messages` | array | Yes | Array of `{role, content}` objects |
| `model` | string | No | Model to use (default: `gemini-3-flash-preview`) |
| `temperature` | number | No | Randomness 0-2 |
| `max_tokens` | number | No | Maximum output length |

Message format:
```json
{
  "role": "user" | "model",
  "content": "message text"
}
```

### gemini_search

Web search with Google Search grounding.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `input` | string | Yes | Search query |
| `model` | string | No | Model to use (default: `gemini-3-flash-preview`) |
| `temperature` | number | No | Randomness 0-2 |
| `max_tokens` | number | No | Maximum output length |

Returns AI response plus **Search Queries** and **Sources** with citations.

### gemini_youtube

Analyze YouTube videos.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `youtube_url` | string | Yes | YouTube video URL |
| `prompt` | string | Yes | Question or task about the video |
| `model` | string | No | Model to use (default: `gemini-3-flash-preview`) |
| `start_offset` | string | No | Start time (e.g., "60s", "1m30s") |
| `end_offset` | string | No | End time (e.g., "120s", "2m") |
| `temperature` | number | No | Randomness 0-2 |
| `max_tokens` | number | No | Maximum output length |

Supports both full URLs (`youtube.com/watch?v=...`) and short URLs (`youtu.be/...`).

### gemini_status

Check server status and configuration.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| (none) | - | - | No parameters required |

Returns:
- `active_model` - Currently used model
- `configured_model` - Model from GEMINI_MODEL env var (if set)
- `fallback_model` - Default fallback model
- `fallback_used` - Whether fallback was triggered due to invalid model
- `server_version` - Server version
- `api_key_configured` - Whether GOOGLE_API_KEY is set

## Development

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Run compiled server
npm start

# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/index.js
```

## Troubleshooting

### "GOOGLE_API_KEY environment variable is required"
Make sure your Claude Code configuration includes the `env` block with your API key.

### "Invalid API key"
1. Verify your key at [AI Studio](https://aistudio.google.com/apikey)
2. Make sure there are no extra spaces or quotes around the key
3. Check the key has the Gemini API enabled

### "API quota exceeded"
The free tier has usage limits. Wait a few minutes and try again, or upgrade your API plan.

### Tools not appearing in Claude Code
1. Verify the path in your configuration is correct (use absolute path)
2. Make sure you ran `npm run build`
3. Restart Claude Code after configuration changes

### YouTube video errors
- Only public videos are supported (no private or unlisted)
- Video must be available in your region
- Very long videos may hit token limits (use `start_offset`/`end_offset`)

### Model validation and fallback
If you configure an invalid model via `GEMINI_MODEL`, the server automatically falls back to `gemini-3-flash-preview`. The warning is logged to stderr but may not be visible in Claude Code.

To check your current configuration status:
1. Use the `gemini_status` tool - it shows active model and whether fallback occurred
2. Run Claude Code with `--verbose` flag to see MCP server logs

## Project Structure

```
gemini-mcp-server/
├── src/
│   └── index.ts          # Server implementation
├── dist/                 # Compiled output
├── docs/
│   ├── PRD.md            # Product requirements
│   ├── PLAN.md           # Implementation roadmap
│   └── TECH.md           # Technical specification
├── package.json
├── tsconfig.json
├── .env.example          # Environment template
├── README.md             # This file
└── CLAUDE.md             # AI assistant context
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- [Anthropic](https://anthropic.com/) - MCP Protocol and Claude
- [Google](https://ai.google.dev/) - Gemini AI API
- [Model Context Protocol](https://modelcontextprotocol.io/) - Protocol specification

---

**Made with Claude Code following Anthropic's MCP guidelines**
