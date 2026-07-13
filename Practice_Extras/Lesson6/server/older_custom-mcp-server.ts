import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { evaluate } from "mathjs";
import express, {Request, Response} from "express";

// 1. Create MCP server with tools capability & give name , version
const mcpServer = new Server(
  { name: "my-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// 2. Define available tools using .setRequestHandler(ListToolsRequestSchema,handler())

// how this works -> does the async () handler runs whenever mcpclient request for listTools?? why async () => ({}) syntax? does it return the inner object {} directly
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "calculate", // tool_name send by mcpClient(agent)
      description: "Perform mathematical calculations",

      inputSchema: {
        type: "object",

        properties: {
          expression: { type: "string", description: "Math expression to evaluate" },
        },

        required: ["expression"],
      },
    },
  ],
}));

// 3. Handle tool execution
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.log(JSON.stringify(request, null, 2));

  const tool_name = request.params.name;
  const args = request.params.arguments;

  if (tool_name === "calculate") {
    const { expression } = args as { expression: string };
    const result = evaluate(expression); // Using mathjs

    return { content: [{ type: "text", text: String(result) }] };
  }
  throw new Error(`Unknown tool: ${tool_name}`);
});

// M.IMP:
// 4. Set up HTTP server with Express and connect transport

// (i) StreamableHTTPServer class wrapper for session management

class StreamableHTTPServer {
  mcpServer: Server;

  // Map to store transports by session ID (unique transport for each sessionId)
  private transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  constructor(mcpServer: Server) {
    this.mcpServer = mcpServer;
  }
  
  async handleGetRequest(req: Request, res: Response){
    // res.status(405).json(this.createRPCErr)
  }
}
