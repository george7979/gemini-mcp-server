# Gemini MCP Server

MCP (Model Context Protocol) server that integrates Google Gemini AI with Claude Code and other MCP clients.

## Features

- **gemini_generate** - Simple text generation with prompts
- **gemini_messages** - Structured conversation messages
- **gemini_search** - Web search with Google Search grounding
- **gemini_youtube** - YouTube video analysis (transcription, summarization, Q&A)

## Quick Start

### Prerequisites

- Node.js 18+
- Google AI API key ([Get one here](https://aistudio.google.com/apikey))

### Installation

```bash
git clone https://github.com/george7979/gemini-mcp-server.git
cd gemini-mcp-server
npm install
npm run build
```

### Configuration

Add to your Claude Code configuration (`~/.claude.json`):

```json
{
  "mcpServers": {
    "gemini-server": {
      "type": "stdio",
      "command": "node",
      "args": ["/path/to/gemini-mcp-server/dist/index.js"],
      "env": {
        "GOOGLE_API_KEY": "your-api-key-here"
      }
    }
  }
}
```

Replace `/path/to/gemini-mcp-server` with your actual installation path.

## Development

```bash
npm run dev    # Development with hot reload
npm run build  # Compile TypeScript
npm start      # Run compiled server
```

## Documentation

- [PRD](./docs/PRD.md) - Product Requirements
- [PLAN](./docs/PLAN.md) - Implementation Plan
- [TECH](./docs/TECH.md) - Technical Specification

## License

MIT
