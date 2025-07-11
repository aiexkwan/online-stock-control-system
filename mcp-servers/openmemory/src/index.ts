#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";

const API_KEY = process.env.OPENMEMORY_API_KEY;
const API_BASE_URL = "https://api.openmemory.ai/v1";

if (!API_KEY) {
  console.error("OPENMEMORY_API_KEY environment variable is required");
  process.exit(1);
}

const server = new Server(
  {
    name: "openmemory",
    vendor: "OpenMemory",
    version: "1.0.0",
    description: "Access and manage memories using OpenMemory API",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Authorization": `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
  },
});

// Helper function to handle API errors
function handleApiError(error: any): never {
  if (error.response?.status === 401) {
    throw new McpError(ErrorCode.InvalidRequest, "Invalid API key");
  }
  throw new McpError(
    ErrorCode.InternalError,
    error.response?.data?.message || error.message || "Unknown error"
  );
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "add_memory",
        description: "Add a new memory",
        inputSchema: {
          type: "object",
          properties: {
            messages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  role: {
                    type: "string",
                    enum: ["user", "assistant"],
                    description: "Role of the message sender",
                  },
                  content: {
                    type: "string",
                    description: "Content of the message",
                  },
                },
                required: ["role", "content"],
              },
              description: "List of messages to store as memory",
            },
            user_id: {
              type: "string",
              description: "User ID associated with the memory",
            },
            metadata: {
              type: "object",
              description: "Additional metadata for the memory",
            },
          },
          required: ["messages"],
        },
      },
      {
        name: "get_all_memories",
        description: "Get all memories, optionally filtered by user ID",
        inputSchema: {
          type: "object",
          properties: {
            user_id: {
              type: "string",
              description: "Optional user ID to filter memories",
            },
          },
        },
      },
      {
        name: "search_memory",
        description: "Search memories based on query",
        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "Search query",
            },
            user_id: {
              type: "string",
              description: "Optional user ID to filter memories",
            },
            limit: {
              type: "number",
              description: "Maximum number of results to return",
              default: 10,
            },
          },
          required: ["query"],
        },
      },
      {
        name: "get_memory",
        description: "Get a specific memory by ID",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "ID of the memory to retrieve",
            },
          },
          required: ["memory_id"],
        },
      },
      {
        name: "update_memory",
        description: "Update an existing memory",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "ID of the memory to update",
            },
            data: {
              type: "string",
              description: "New data for the memory",
            },
          },
          required: ["memory_id", "data"],
        },
      },
      {
        name: "delete_memory",
        description: "Delete a memory by ID",
        inputSchema: {
          type: "object",
          properties: {
            memory_id: {
              type: "string",
              description: "ID of the memory to delete",
            },
          },
          required: ["memory_id"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    throw new McpError(ErrorCode.InvalidRequest, "Arguments are required");
  }

  try {
    switch (name) {
      case "add_memory": {
        const response = await api.post("/memories", args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case "get_all_memories": {
        const params = args.user_id ? { user_id: args.user_id } : {};
        const response = await api.get("/memories", { params });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case "search_memory": {
        const response = await api.post("/memories/search", {
          query: args.query,
          user_id: args.user_id,
          limit: args.limit || 10,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case "get_memory": {
        const response = await api.get(`/memories/${args.memory_id}`);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case "update_memory": {
        const response = await api.put(`/memories/${args.memory_id}`, {
          data: args.data,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response.data, null, 2),
            },
          ],
        };
      }

      case "delete_memory": {
        const response = await api.delete(`/memories/${args.memory_id}`);
        return {
          content: [
            {
              type: "text",
              text: "Memory deleted successfully",
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    handleApiError(error);
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("OpenMemory MCP server running");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});