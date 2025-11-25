#!/usr/bin/env node
/**
 * Gemini MCP Server
 *
 * An MCP (Model Context Protocol) server that provides Google Gemini AI
 * capabilities to Claude Code and other MCP clients. Features include
 * text generation, multi-turn conversations, web search with grounding,
 * and YouTube video analysis.
 *
 * @see https://github.com/george7979/gemini-mcp-server
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoogleGenAI } from "@google/genai";
import { z } from "zod";

// =============================================================================
// Constants
// =============================================================================

const SERVER_NAME = "gemini-mcp-server";
const SERVER_VERSION = "1.0.0";

const DEFAULT_MODEL = "gemini-2.0-flash-exp";
const SEARCH_MODEL = "gemini-2.5-flash";

// Maximum response size to prevent overwhelming output
const CHARACTER_LIMIT = 50000;

// =============================================================================
// Environment Validation
// =============================================================================

const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error(
    "ERROR: GOOGLE_API_KEY environment variable is required.\n" +
    "Get your API key at: https://aistudio.google.com/apikey"
  );
  process.exit(1);
}

// =============================================================================
// Gemini Client Initialization
// =============================================================================

const genAI = new GoogleGenAI({ apiKey });

// =============================================================================
// Shared Types & Utilities
// =============================================================================

interface GenerationConfig {
  temperature?: number;
  maxOutputTokens?: number;
  topP?: number;
  topK?: number;
}

/**
 * Build generation config from tool parameters.
 * Extracts and maps parameter names to Gemini API format.
 */
function buildGenerationConfig(params: {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
}): GenerationConfig | undefined {
  const config: GenerationConfig = {};

  if (params.temperature !== undefined) config.temperature = params.temperature;
  if (params.max_tokens !== undefined) config.maxOutputTokens = params.max_tokens;
  if (params.top_p !== undefined) config.topP = params.top_p;
  if (params.top_k !== undefined) config.topK = params.top_k;

  return Object.keys(config).length > 0 ? config : undefined;
}

/**
 * Handle errors from Gemini API calls.
 * Returns actionable error messages to guide users.
 */
function handleGeminiError(error: unknown): string {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes("api key")) {
      return "Error: Invalid API key. Please check your GOOGLE_API_KEY environment variable.";
    }
    if (message.includes("quota") || message.includes("rate limit")) {
      return "Error: API quota exceeded or rate limited. Please wait and try again.";
    }
    if (message.includes("not found") || message.includes("404")) {
      return "Error: Resource not found. Please check the model name or video URL.";
    }
    if (message.includes("permission") || message.includes("403")) {
      return "Error: Permission denied. The video may be private or restricted.";
    }
    if (message.includes("timeout")) {
      return "Error: Request timed out. Please try again with a shorter prompt or video segment.";
    }

    return `Error: ${error.message}`;
  }

  return `Error: Unexpected error occurred: ${String(error)}`;
}

// =============================================================================
// MCP Server Initialization
// =============================================================================

const server = new McpServer({
  name: SERVER_NAME,
  version: SERVER_VERSION,
});

// =============================================================================
// Tool: gemini_generate
// =============================================================================

const GenerateInputSchema = z.object({
  input: z.string()
    .min(1, "Input prompt is required")
    .describe("The input text or prompt for Gemini"),
  model: z.string()
    .default(DEFAULT_MODEL)
    .describe("Gemini model variant to use"),
  temperature: z.number()
    .min(0)
    .max(2)
    .optional()
    .describe("Temperature for randomness (0-2)"),
  max_tokens: z.number()
    .int()
    .min(1)
    .optional()
    .describe("Maximum tokens to generate"),
  top_p: z.number()
    .min(0)
    .max(1)
    .optional()
    .describe("Top-p (nucleus) sampling parameter"),
  top_k: z.number()
    .int()
    .min(1)
    .optional()
    .describe("Top-k sampling parameter"),
}).strict();

server.registerTool(
  "gemini_generate",
  {
    title: "Generate Text with Gemini",
    description: `Generate text using Google Gemini AI with a simple input prompt.

This tool sends a prompt to Google Gemini and returns the generated text response.
It is ideal for single-turn interactions, creative writing, code generation,
analysis, and general AI assistance tasks.

Args:
  - input (string, required): The prompt or question for Gemini
  - model (string, optional): Model to use (default: "${DEFAULT_MODEL}")
  - temperature (number, optional): Randomness 0-2 (higher = more creative)
  - max_tokens (number, optional): Maximum output length
  - top_p (number, optional): Nucleus sampling threshold 0-1
  - top_k (number, optional): Top-k sampling parameter

Returns:
  Generated text response from Gemini.

Examples:
  - "Explain quantum computing in simple terms"
  - "Write a Python function to sort a list"
  - "Summarize the key points of machine learning"

Note: Each call may produce different results due to model randomness.`,
    inputSchema: GenerateInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false, // AI generation is NOT idempotent
      openWorldHint: true,
    },
  },
  async (params) => {
    try {
      const config = buildGenerationConfig(params);

      const response = await genAI.models.generateContent({
        model: params.model ?? DEFAULT_MODEL,
        contents: params.input,
        config,
      });

      const text = response.text || "";

      return {
        content: [{ type: "text", text }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleGeminiError(error) }],
        isError: true,
      };
    }
  }
);

// =============================================================================
// Tool: gemini_messages
// =============================================================================

const MessageSchema = z.object({
  role: z.enum(["user", "model"])
    .describe("Message role: 'user' for human, 'model' for AI"),
  content: z.string()
    .min(1, "Message content is required")
    .describe("The message content"),
}).strict();

const MessagesInputSchema = z.object({
  messages: z.array(MessageSchema)
    .min(1, "At least one message is required")
    .describe("Array of conversation messages"),
  model: z.string()
    .default(DEFAULT_MODEL)
    .describe("Gemini model variant to use"),
  temperature: z.number()
    .min(0)
    .max(2)
    .optional()
    .describe("Temperature for randomness (0-2)"),
  max_tokens: z.number()
    .int()
    .min(1)
    .optional()
    .describe("Maximum tokens to generate"),
  top_p: z.number()
    .min(0)
    .max(1)
    .optional()
    .describe("Top-p (nucleus) sampling parameter"),
  top_k: z.number()
    .int()
    .min(1)
    .optional()
    .describe("Top-k sampling parameter"),
}).strict();

server.registerTool(
  "gemini_messages",
  {
    title: "Gemini Multi-turn Conversation",
    description: `Generate text using Gemini with structured multi-turn conversation messages.

This tool enables multi-turn conversations by accepting an array of messages
with alternating user/model roles. Use this for contextual conversations
where previous exchanges inform the response.

Args:
  - messages (array, required): Conversation history
    - role: "user" (human) or "model" (AI response)
    - content: The message text
  - model (string, optional): Model to use (default: "${DEFAULT_MODEL}")
  - temperature (number, optional): Randomness 0-2
  - max_tokens (number, optional): Maximum output length
  - top_p (number, optional): Nucleus sampling threshold 0-1
  - top_k (number, optional): Top-k sampling parameter

Returns:
  AI response continuing the conversation.

Example messages:
  [
    { "role": "user", "content": "What is the capital of France?" },
    { "role": "model", "content": "The capital of France is Paris." },
    { "role": "user", "content": "What is its population?" }
  ]

Note: Messages should alternate between user and model roles.`,
    inputSchema: MessagesInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params) => {
    try {
      const config = buildGenerationConfig(params);

      // Convert messages to Gemini SDK format
      const contents = params.messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const response = await genAI.models.generateContent({
        model: params.model ?? DEFAULT_MODEL,
        contents,
        config,
      });

      const text = response.text || "";

      return {
        content: [{ type: "text", text }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleGeminiError(error) }],
        isError: true,
      };
    }
  }
);

// =============================================================================
// Tool: gemini_search
// =============================================================================

const SearchInputSchema = z.object({
  input: z.string()
    .min(1, "Search query is required")
    .describe("The search query or question"),
  model: z.string()
    .default(SEARCH_MODEL)
    .describe("Gemini model variant to use"),
  temperature: z.number()
    .min(0)
    .max(2)
    .optional()
    .describe("Temperature for randomness (0-2)"),
  max_tokens: z.number()
    .int()
    .min(1)
    .optional()
    .describe("Maximum tokens to generate"),
  top_p: z.number()
    .min(0)
    .max(1)
    .optional()
    .describe("Top-p (nucleus) sampling parameter"),
  top_k: z.number()
    .int()
    .min(1)
    .optional()
    .describe("Top-k sampling parameter"),
}).strict();

server.registerTool(
  "gemini_search",
  {
    title: "Gemini Web Search",
    description: `Search the web and generate an AI response with citations using Gemini + Google Search grounding.

This tool combines Gemini's AI capabilities with real-time Google Search
to provide up-to-date information with source citations. The response
includes the AI-generated answer plus search queries and source URLs.

Args:
  - input (string, required): The search query or question
  - model (string, optional): Model to use (default: "${SEARCH_MODEL}")
  - temperature (number, optional): Randomness 0-2
  - max_tokens (number, optional): Maximum output length
  - top_p (number, optional): Nucleus sampling threshold 0-1
  - top_k (number, optional): Top-k sampling parameter

Returns:
  AI response with:
  - Generated answer based on search results
  - **Search Queries:** List of queries used
  - **Sources:** List of cited URLs with titles

Examples:
  - "What are the latest developments in AI?"
  - "Current weather in New York"
  - "Recent news about space exploration"

Note: Results reflect real-time web data and include source citations.`,
    inputSchema: SearchInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params) => {
    try {
      const baseConfig = buildGenerationConfig(params) || {};
      const config = {
        ...baseConfig,
        tools: [{ googleSearch: {} }],
      };

      const response = await genAI.models.generateContent({
        model: params.model ?? SEARCH_MODEL,
        contents: params.input,
        config,
      });

      let text = response.text || "";

      // Extract and format grounding metadata
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

      if (groundingMetadata) {
        if (groundingMetadata.webSearchQueries?.length) {
          text += "\n\n**Search Queries:**\n";
          for (const query of groundingMetadata.webSearchQueries) {
            text += `- ${query}\n`;
          }
        }

        if (groundingMetadata.groundingChunks?.length) {
          text += "\n**Sources:**\n";
          for (const chunk of groundingMetadata.groundingChunks) {
            const web = chunk as { web?: { title?: string; uri?: string } };
            if (web.web?.uri) {
              text += `- [${web.web.title || "Source"}](${web.web.uri})\n`;
            }
          }
        }
      }

      return {
        content: [{ type: "text", text }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleGeminiError(error) }],
        isError: true,
      };
    }
  }
);

// =============================================================================
// Tool: gemini_youtube
// =============================================================================

const YouTubeInputSchema = z.object({
  youtube_url: z.string()
    .min(1, "YouTube URL is required")
    .describe("YouTube video URL"),
  prompt: z.string()
    .min(1, "Prompt is required")
    .describe("Question or task about the video"),
  model: z.string()
    .default(SEARCH_MODEL)
    .describe("Gemini model variant to use"),
  start_offset: z.string()
    .optional()
    .describe("Start time offset (e.g., '60s' for 1 minute)"),
  end_offset: z.string()
    .optional()
    .describe("End time offset (e.g., '120s' for 2 minutes)"),
  temperature: z.number()
    .min(0)
    .max(2)
    .optional()
    .describe("Temperature for randomness (0-2)"),
  max_tokens: z.number()
    .int()
    .min(1)
    .optional()
    .describe("Maximum tokens to generate"),
}).strict();

server.registerTool(
  "gemini_youtube",
  {
    title: "Gemini YouTube Video Analyzer",
    description: `Analyze YouTube videos - transcribe, summarize, or answer questions about video content.

This tool uses Gemini's multimodal capabilities to process YouTube videos.
You can ask questions, request transcriptions, summaries, or analysis
of specific video segments. Only public YouTube videos are supported.

Args:
  - youtube_url (string, required): Full YouTube URL
    - Standard: https://www.youtube.com/watch?v=VIDEO_ID
    - Short: https://youtu.be/VIDEO_ID
  - prompt (string, required): What to do with the video
  - model (string, optional): Model to use (default: "${SEARCH_MODEL}")
  - start_offset (string, optional): Start time, e.g., "60s", "1m30s"
  - end_offset (string, optional): End time, e.g., "120s", "2m"
  - temperature (number, optional): Randomness 0-2
  - max_tokens (number, optional): Maximum output length

Returns:
  Analysis result with video URL and optional segment info.

Example prompts:
  - "Summarize this video in bullet points"
  - "Transcribe the first 2 minutes"
  - "What are the main topics discussed?"
  - "List all products mentioned"

Limitations:
  - Only public videos (no private/unlisted)
  - Video must be accessible in your region
  - Very long videos may hit token limits`,
    inputSchema: YouTubeInputSchema,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: true,
    },
  },
  async (params) => {
    try {
      // Normalize YouTube URL (convert short URLs)
      let videoUrl = params.youtube_url;
      const shortUrlMatch = videoUrl.match(/youtu\.be\/([^?&]+)/);
      if (shortUrlMatch) {
        videoUrl = `https://www.youtube.com/watch?v=${shortUrlMatch[1]}`;
      }

      const config = buildGenerationConfig(params);

      // Build multimodal content with video
      interface VideoPart {
        fileData: { fileUri: string };
        videoMetadata?: {
          startOffset?: string;
          endOffset?: string;
        };
      }

      const videoPart: VideoPart = {
        fileData: { fileUri: videoUrl },
      };

      if (params.start_offset || params.end_offset) {
        videoPart.videoMetadata = {};
        if (params.start_offset) videoPart.videoMetadata.startOffset = params.start_offset;
        if (params.end_offset) videoPart.videoMetadata.endOffset = params.end_offset;
      }

      const parts = [videoPart, { text: params.prompt }];

      const response = await genAI.models.generateContent({
        model: params.model ?? SEARCH_MODEL,
        contents: parts as Parameters<typeof genAI.models.generateContent>[0]["contents"],
        config,
      });

      const text = response.text || "";

      // Format output with video info
      const segmentInfo = params.start_offset || params.end_offset
        ? `Segment: ${params.start_offset || "0s"} - ${params.end_offset || "end"}\n`
        : "";

      return {
        content: [{
          type: "text",
          text: `**YouTube Video Analysis**\n\nVideo: ${videoUrl}\n${segmentInfo}\n---\n\n${text}`,
        }],
      };
    } catch (error) {
      return {
        content: [{ type: "text", text: handleGeminiError(error) }],
        isError: true,
      };
    }
  }
);

// =============================================================================
// Server Startup
// =============================================================================

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`${SERVER_NAME} v${SERVER_VERSION} running on stdio`);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
