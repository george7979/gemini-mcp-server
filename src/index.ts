#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// Validate API key
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("Error: GOOGLE_API_KEY not found in environment variables");
  process.exit(1);
}

// Initialize Gemini client
const genAI = new GoogleGenAI({ apiKey });

// Initialize MCP Server
const server = new McpServer({
  name: "gemini-server",
  version: "0.3.0",
});

// =============================================================================
// Tool: gemini_generate
// =============================================================================

const GenerateSchema = {
  input: z.string().describe("The input text or prompt for Gemini"),
  model: z
    .string()
    .default("gemini-2.0-flash-exp")
    .describe("Gemini model variant to use"),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe("Temperature for randomness (0-2)"),
  max_tokens: z.number().optional().describe("Maximum tokens to generate"),
  top_p: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Top-p sampling parameter"),
  top_k: z.number().optional().describe("Top-k sampling parameter"),
};

server.registerTool(
  "gemini_generate",
  {
    title: "Generate with Gemini",
    description:
      "Generate text using Google Gemini AI with a simple input prompt",
    inputSchema: GenerateSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    try {
      const config: Record<string, unknown> = {};
      if (params.temperature !== undefined) config.temperature = params.temperature;
      if (params.max_tokens !== undefined) config.maxOutputTokens = params.max_tokens;
      if (params.top_p !== undefined) config.topP = params.top_p;
      if (params.top_k !== undefined) config.topK = params.top_k;

      const response = await genAI.models.generateContent({
        model: params.model,
        contents: params.input,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text || "";

      return {
        content: [{ type: "text", text }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// =============================================================================
// Tool: gemini_messages
// =============================================================================

const MessagesSchema = {
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "model"]).describe("Message role"),
        content: z.string().describe("Message content"),
      })
    )
    .describe("Array of conversation messages"),
  model: z
    .string()
    .default("gemini-2.0-flash-exp")
    .describe("Gemini model variant to use"),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe("Temperature for randomness (0-2)"),
  max_tokens: z.number().optional().describe("Maximum tokens to generate"),
  top_p: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Top-p sampling parameter"),
  top_k: z.number().optional().describe("Top-k sampling parameter"),
};

server.registerTool(
  "gemini_messages",
  {
    title: "Gemini Conversation",
    description:
      "Generate text using Gemini with structured conversation messages",
    inputSchema: MessagesSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    try {
      const config: Record<string, unknown> = {};
      if (params.temperature !== undefined) config.temperature = params.temperature;
      if (params.max_tokens !== undefined) config.maxOutputTokens = params.max_tokens;
      if (params.top_p !== undefined) config.topP = params.top_p;
      if (params.top_k !== undefined) config.topK = params.top_k;

      // Convert messages to SDK format
      const contents = params.messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const response = await genAI.models.generateContent({
        model: params.model,
        contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text || "";

      return {
        content: [{ type: "text", text }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// =============================================================================
// Tool: gemini_search
// =============================================================================

const SearchSchema = {
  input: z.string().describe("The search query or question"),
  model: z
    .string()
    .default("gemini-2.5-flash")
    .describe("Gemini model variant to use"),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe("Temperature for randomness (0-2)"),
  max_tokens: z.number().optional().describe("Maximum tokens to generate"),
  top_p: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Top-p sampling parameter"),
  top_k: z.number().optional().describe("Top-k sampling parameter"),
};

server.registerTool(
  "gemini_search",
  {
    title: "Gemini Web Search",
    description:
      "Search the web and generate AI response with citations using Gemini + Google Search grounding",
    inputSchema: SearchSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    try {
      const config: Record<string, unknown> = {
        tools: [{ googleSearch: {} }],
      };
      if (params.temperature !== undefined) config.temperature = params.temperature;
      if (params.max_tokens !== undefined) config.maxOutputTokens = params.max_tokens;
      if (params.top_p !== undefined) config.topP = params.top_p;
      if (params.top_k !== undefined) config.topK = params.top_k;

      const response = await genAI.models.generateContent({
        model: params.model,
        contents: params.input,
        config,
      });

      let text = response.text || "";

      // Extract grounding metadata for citations
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

      if (groundingMetadata) {
        // Add search queries if available
        if (
          groundingMetadata.webSearchQueries &&
          groundingMetadata.webSearchQueries.length > 0
        ) {
          text += "\n\n**Search Queries:**\n";
          groundingMetadata.webSearchQueries.forEach((query: string) => {
            text += `- ${query}\n`;
          });
        }

        // Add sources if available
        if (
          groundingMetadata.groundingChunks &&
          groundingMetadata.groundingChunks.length > 0
        ) {
          text += "\n**Sources:**\n";
          groundingMetadata.groundingChunks.forEach((chunk: { web?: { title?: string; uri?: string } }) => {
            if (chunk.web) {
              text += `- [${chunk.web.title || "Source"}](${chunk.web.uri})\n`;
            }
          });
        }
      }

      return {
        content: [{ type: "text", text }],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// =============================================================================
// Tool: gemini_youtube
// =============================================================================

const YouTubeSchema = {
  youtube_url: z
    .string()
    .describe(
      "YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)"
    ),
  prompt: z
    .string()
    .describe(
      "Question, instruction, or task about the video (e.g. 'Summarize this video', 'Transcribe the first 2 minutes', 'What topics are discussed?')"
    ),
  model: z
    .string()
    .default("gemini-2.5-flash")
    .describe("Gemini model variant to use"),
  start_offset: z
    .string()
    .optional()
    .describe("Start time offset in seconds (e.g. '60s' for 1 minute)"),
  end_offset: z
    .string()
    .optional()
    .describe("End time offset in seconds (e.g. '120s' for 2 minutes)"),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe("Temperature for randomness (0-2)"),
  max_tokens: z.number().optional().describe("Maximum tokens to generate"),
};

server.registerTool(
  "gemini_youtube",
  {
    title: "Gemini YouTube Analyzer",
    description:
      "Analyze YouTube videos - transcribe, summarize, answer questions about video content. Supports public YouTube videos only. Can process specific video segments using start/end offsets.",
    inputSchema: YouTubeSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: true,
    },
  },
  async (params) => {
    try {
      // Normalize YouTube URL
      let videoUrl = params.youtube_url;
      const shortUrlMatch = videoUrl.match(/youtu\.be\/([^?&]+)/);
      if (shortUrlMatch) {
        videoUrl = `https://www.youtube.com/watch?v=${shortUrlMatch[1]}`;
      }

      const config: Record<string, unknown> = {};
      if (params.temperature !== undefined) config.temperature = params.temperature;
      if (params.max_tokens !== undefined) config.maxOutputTokens = params.max_tokens;

      // Build parts array with video and prompt
      const parts: unknown[] = [
        {
          fileData: {
            fileUri: videoUrl,
          },
          ...(params.start_offset || params.end_offset
            ? {
                videoMetadata: {
                  ...(params.start_offset ? { startOffset: params.start_offset } : {}),
                  ...(params.end_offset ? { endOffset: params.end_offset } : {}),
                },
              }
            : {}),
        },
        { text: params.prompt },
      ];

      const response = await genAI.models.generateContent({
        model: params.model,
        contents: parts as Parameters<typeof genAI.models.generateContent>[0]["contents"],
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text || "";
      const segmentInfo =
        params.start_offset || params.end_offset
          ? `Segment: ${params.start_offset || "0s"} - ${params.end_offset || "end"}\n`
          : "";

      return {
        content: [
          {
            type: "text",
            text: `**YouTube Video Analysis**\n\nVideo: ${videoUrl}\n${segmentInfo}\n---\n\n${text}`,
          },
        ],
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        content: [{ type: "text", text: `Error: ${errorMessage}` }],
        isError: true,
      };
    }
  }
);

// =============================================================================
// Start Server
// =============================================================================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gemini MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
