#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

// Load environment variables
config();

// Validate API key
const apiKey = process.env.GOOGLE_API_KEY;
if (!apiKey) {
  console.error("Error: GOOGLE_API_KEY not found in environment variables");
  process.exit(1);
}

// Initialize Gemini client with new SDK
const genAI = new GoogleGenAI({
  apiKey: apiKey,
});

// Zod schemas for tool parameters
const GenerateSchema = z.object({
  input: z.string().describe("The input text or prompt for Gemini"),
  model: z
    .string()
    .optional()
    .default("gemini-2.0-flash-exp")
    .describe("Gemini model variant to use"),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe("Temperature for randomness (0-2)"),
  max_tokens: z
    .number()
    .optional()
    .describe("Maximum tokens to generate"),
  top_p: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Top-p sampling parameter"),
  top_k: z
    .number()
    .optional()
    .describe("Top-k sampling parameter"),
});

const MessagesSchema = z.object({
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
    .optional()
    .default("gemini-2.0-flash-exp")
    .describe("Gemini model variant to use"),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe("Temperature for randomness (0-2)"),
  max_tokens: z
    .number()
    .optional()
    .describe("Maximum tokens to generate"),
  top_p: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Top-p sampling parameter"),
  top_k: z
    .number()
    .optional()
    .describe("Top-k sampling parameter"),
});

const SearchSchema = z.object({
  input: z.string().describe("The search query or question"),
  model: z
    .string()
    .optional()
    .default("gemini-2.5-flash")
    .describe("Gemini model variant to use"),
  temperature: z
    .number()
    .min(0)
    .max(2)
    .optional()
    .describe("Temperature for randomness (0-2)"),
  max_tokens: z
    .number()
    .optional()
    .describe("Maximum tokens to generate"),
  top_p: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe("Top-p sampling parameter"),
  top_k: z
    .number()
    .optional()
    .describe("Top-k sampling parameter"),
});

const YouTubeSchema = z.object({
  youtube_url: z.string().describe("YouTube video URL (e.g. https://www.youtube.com/watch?v=... or https://youtu.be/...)"),
  prompt: z.string().describe("Question, instruction, or task about the video (e.g. 'Summarize this video', 'Transcribe the first 2 minutes', 'What topics are discussed?')"),
  model: z
    .string()
    .optional()
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
  max_tokens: z
    .number()
    .optional()
    .describe("Maximum tokens to generate"),
});

// Create server instance
const server = new Server(
  {
    name: "gemini-server",
    version: "0.2.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "gemini_generate",
        description:
          "Generate text using Google Gemini AI with a simple input prompt",
        inputSchema: zodToJsonSchema(GenerateSchema),
      },
      {
        name: "gemini_messages",
        description:
          "Generate text using Gemini with structured conversation messages",
        inputSchema: zodToJsonSchema(MessagesSchema),
      },
      {
        name: "gemini_search",
        description:
          "Search the web and generate AI response with citations using Gemini + Google Search grounding",
        inputSchema: zodToJsonSchema(SearchSchema),
      },
      {
        name: "gemini_youtube",
        description:
          "Analyze YouTube videos - transcribe, summarize, answer questions about video content. Supports public YouTube videos only. Can process specific video segments using start/end offsets.",
        inputSchema: zodToJsonSchema(YouTubeSchema),
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    if (request.params.name === "gemini_generate") {
      const args = GenerateSchema.parse(request.params.arguments);

      const config: any = {};
      if (args.temperature !== undefined) config.temperature = args.temperature;
      if (args.max_tokens !== undefined) config.maxOutputTokens = args.max_tokens;
      if (args.top_p !== undefined) config.topP = args.top_p;
      if (args.top_k !== undefined) config.topK = args.top_k;

      const response = await genAI.models.generateContent({
        model: args.model,
        contents: args.input,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text;

      return {
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      };
    } else if (request.params.name === "gemini_messages") {
      const args = MessagesSchema.parse(request.params.arguments);

      const config: any = {};
      if (args.temperature !== undefined) config.temperature = args.temperature;
      if (args.max_tokens !== undefined) config.maxOutputTokens = args.max_tokens;
      if (args.top_p !== undefined) config.topP = args.top_p;
      if (args.top_k !== undefined) config.topK = args.top_k;

      // Convert messages to new SDK format
      const contents = args.messages.map((msg) => ({
        role: msg.role,
        parts: [{ text: msg.content }],
      }));

      const response = await genAI.models.generateContent({
        model: args.model,
        contents: contents,
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text;

      return {
        content: [
          {
            type: "text",
            text: text,
          },
        ],
      };
    } else if (request.params.name === "gemini_search") {
      const args = SearchSchema.parse(request.params.arguments);

      const config: any = {
        tools: [{ googleSearch: {} }],
      };
      if (args.temperature !== undefined) config.temperature = args.temperature;
      if (args.max_tokens !== undefined) config.maxOutputTokens = args.max_tokens;
      if (args.top_p !== undefined) config.topP = args.top_p;
      if (args.top_k !== undefined) config.topK = args.top_k;

      const response = await genAI.models.generateContent({
        model: args.model,
        contents: args.input,
        config: config,
      });

      const text = response.text;

      // Extract grounding metadata
      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

      let formattedResponse = text;

      if (groundingMetadata) {
        // Add search queries if available
        if (groundingMetadata.webSearchQueries && groundingMetadata.webSearchQueries.length > 0) {
          formattedResponse += "\n\n**Search Queries:**\n";
          groundingMetadata.webSearchQueries.forEach((query: string) => {
            formattedResponse += `- ${query}\n`;
          });
        }

        // Add sources if available
        if (groundingMetadata.groundingChunks && groundingMetadata.groundingChunks.length > 0) {
          formattedResponse += "\n**Sources:**\n";
          groundingMetadata.groundingChunks.forEach((chunk: any) => {
            if (chunk.web) {
              formattedResponse += `- [${chunk.web.title || 'Source'}](${chunk.web.uri})\n`;
            }
          });
        }
      }

      return {
        content: [
          {
            type: "text",
            text: formattedResponse,
          },
        ],
      };
    } else if (request.params.name === "gemini_youtube") {
      const args = YouTubeSchema.parse(request.params.arguments);

      // Normalize YouTube URL to standard format
      let videoUrl = args.youtube_url;
      // Convert youtu.be short URLs to full format
      const shortUrlMatch = videoUrl.match(/youtu\.be\/([^?&]+)/);
      if (shortUrlMatch) {
        videoUrl = `https://www.youtube.com/watch?v=${shortUrlMatch[1]}`;
      }

      const config: any = {};
      if (args.temperature !== undefined) config.temperature = args.temperature;
      if (args.max_tokens !== undefined) config.maxOutputTokens = args.max_tokens;

      // Build the parts array with video and prompt
      const parts: any[] = [
        {
          fileData: {
            fileUri: videoUrl,
          },
          ...(args.start_offset || args.end_offset ? {
            videoMetadata: {
              ...(args.start_offset ? { startOffset: args.start_offset } : {}),
              ...(args.end_offset ? { endOffset: args.end_offset } : {}),
            }
          } : {})
        },
        { text: args.prompt }
      ];

      const response = await genAI.models.generateContent({
        model: args.model,
        contents: [{ parts }],
        config: Object.keys(config).length > 0 ? config : undefined,
      });

      const text = response.text;

      return {
        content: [
          {
            type: "text",
            text: `**YouTube Video Analysis**\n\nVideo: ${videoUrl}\n${args.start_offset || args.end_offset ? `Segment: ${args.start_offset || '0s'} - ${args.end_offset || 'end'}\n` : ''}\n---\n\n${text}`,
          },
        ],
      };
    } else {
      throw new Error(`Unknown tool: ${request.params.name}`);
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Gemini MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
