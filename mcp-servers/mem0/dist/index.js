#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, ErrorCode, McpError } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Schema definitions
const AddMemorySchema = z.object({
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string()
    })).min(1),
    user_id: z.string().optional(),
    agent_id: z.string().optional(),
    session_id: z.string().optional(),
    metadata: z.record(z.any()).optional()
});
const SearchMemorySchema = z.object({
    query: z.string(),
    user_id: z.string().optional(),
    agent_id: z.string().optional(),
    session_id: z.string().optional(),
    limit: z.number().optional().default(10)
});
const GetMemorySchema = z.object({
    memory_id: z.string()
});
const UpdateMemorySchema = z.object({
    memory_id: z.string(),
    data: z.string()
});
const DeleteMemorySchema = z.object({
    memory_id: z.string()
});
const GetAllMemoriesSchema = z.object({
    user_id: z.string().optional(),
    agent_id: z.string().optional(),
    session_id: z.string().optional(),
    limit: z.number().optional().default(100)
});
// Server setup
const server = new Server({
    name: 'mem0-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// Python script execution helper
async function executePythonScript(scriptName, args) {
    const scriptPath = path.join(__dirname, '..', 'python', scriptName);
    const argsJson = JSON.stringify(args);
    try {
        const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" '${argsJson}'`, { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
        );
        if (stderr && !stderr.includes('WARNING')) {
            console.error('Python stderr:', stderr);
        }
        return JSON.parse(stdout);
    }
    catch (error) {
        throw new McpError(ErrorCode.InternalError, `Python script error: ${error.message}`);
    }
}
// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'add_memory',
                description: 'Add a memory from conversation messages',
                inputSchema: {
                    type: 'object',
                    properties: {
                        messages: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    role: { type: 'string', enum: ['user', 'assistant'] },
                                    content: { type: 'string' }
                                },
                                required: ['role', 'content']
                            },
                            minItems: 1
                        },
                        user_id: { type: 'string' },
                        agent_id: { type: 'string' },
                        session_id: { type: 'string' },
                        metadata: { type: 'object' }
                    },
                    required: ['messages']
                }
            },
            {
                name: 'search_memory',
                description: 'Search memories based on a query',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string' },
                        user_id: { type: 'string' },
                        agent_id: { type: 'string' },
                        session_id: { type: 'string' },
                        limit: { type: 'number', default: 10 }
                    },
                    required: ['query']
                }
            },
            {
                name: 'get_memory',
                description: 'Get a specific memory by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        memory_id: { type: 'string' }
                    },
                    required: ['memory_id']
                }
            },
            {
                name: 'update_memory',
                description: 'Update an existing memory',
                inputSchema: {
                    type: 'object',
                    properties: {
                        memory_id: { type: 'string' },
                        data: { type: 'string' }
                    },
                    required: ['memory_id', 'data']
                }
            },
            {
                name: 'delete_memory',
                description: 'Delete a memory by ID',
                inputSchema: {
                    type: 'object',
                    properties: {
                        memory_id: { type: 'string' }
                    },
                    required: ['memory_id']
                }
            },
            {
                name: 'get_all_memories',
                description: 'Get all memories for a user, agent, or session',
                inputSchema: {
                    type: 'object',
                    properties: {
                        user_id: { type: 'string' },
                        agent_id: { type: 'string' },
                        session_id: { type: 'string' },
                        limit: { type: 'number', default: 100 }
                    }
                }
            }
        ]
    };
});
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'add_memory': {
                const validatedArgs = AddMemorySchema.parse(args);
                const result = await executePythonScript('add_memory.py', validatedArgs);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            case 'search_memory': {
                const validatedArgs = SearchMemorySchema.parse(args);
                const result = await executePythonScript('search_memory.py', validatedArgs);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            case 'get_memory': {
                const validatedArgs = GetMemorySchema.parse(args);
                const result = await executePythonScript('get_memory.py', validatedArgs);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            case 'update_memory': {
                const validatedArgs = UpdateMemorySchema.parse(args);
                const result = await executePythonScript('update_memory.py', validatedArgs);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            case 'delete_memory': {
                const validatedArgs = DeleteMemorySchema.parse(args);
                const result = await executePythonScript('delete_memory.py', validatedArgs);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            case 'get_all_memories': {
                const validatedArgs = GetAllMemoriesSchema.parse(args);
                const result = await executePythonScript('get_all_memories.py', validatedArgs);
                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(result, null, 2)
                        }
                    ]
                };
            }
            default:
                throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
        }
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            throw new McpError(ErrorCode.InvalidParams, `Invalid arguments: ${error.errors.map(e => e.message).join(', ')}`);
        }
        throw error;
    }
});
// Initialize Python environment
async function initializePython() {
    const pythonDir = path.join(__dirname, '..', 'python');
    try {
        await fs.mkdir(pythonDir, { recursive: true });
        // Create requirements.txt
        await fs.writeFile(path.join(pythonDir, 'requirements.txt'), 'mem0ai>=0.1.17\nopenai>=1.0.0\n');
        // Install dependencies
        console.error('Installing Python dependencies...');
        await execAsync('pip install -r requirements.txt', { cwd: pythonDir });
        console.error('Python dependencies installed successfully');
    }
    catch (error) {
        console.error('Failed to initialize Python environment:', error);
    }
}
// Start server
async function main() {
    await initializePython();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MEM0 MCP server running on stdio');
}
main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map