/**
 * Chapter 6 Sample: Simple MCP Server (HTTP Streaming - Stateful)
 *
 * This example shows how to build a basic MCP server that exposes tools.
 * This is the server-side implementation - the counterpart to the clientcode you've seen in the chapter examples.
 *
 * Run: npx tsx 06-mcp/samples/basic-mcp-server.ts
 *
 */

// Create your own servers - Expose company tools, {{wrap APIs}}, share with MCP ecosystem
// can be used to add extra logic to existing APIs (wrap APIs)

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  isInitializeRequest,
  JSONRPCError,
} from "@modelcontextprotocol/sdk/types.js";
import { evaluate } from "mathjs";
import express, { Request, Response } from "express";
import { randomUUID } from "node:crypto";

// 1. Create a {{Factory Function to stamp out new servers}}
function createMcpServerInstance() {
  const server = new Server(
    { name: "my-calculator", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "calculate",
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

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === "calculate") {
      const { expression } = request.params.arguments as { expression: string };
      try {
        const result = evaluate(expression);
        return { content: [{ type: "text", text: String(result) }] };
      } catch (error) {
        throw new Error(
          `Invalid expression: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }
    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  return server;
}

// StreamableHTTPServer class wrapper for session management
class StreamableHTTPServer {
  // Map to store transports by session ID (1 sessionId => 1 server)
  private transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  // Keep track of transports AND their dedicated servers
  private activeServers: { [sessionId: string]: Server } = {}; // <-- ADD THIS

  // Remove mcpServer from constructor, we don't need a global one anymore
  constructor() {}

  // get request isn't allowed
  async handleGetRequest(req: Request, res: Response) {
    res.status(405).json(this.createRPCErrorResponse("Method not allowed."));
    console.log("🚫 Responded to GET with 405 Method Not Allowed");
  }

  async handlePostRequest(req: Request, res: Response) {
    console.log(`📩 POST ${req.originalUrl} - payload received`);

    try {
      // Check for existing session ID
      const sessionId = req.headers["mcp-session-id"] as string | undefined;

      let transport: StreamableHTTPServerTransport;
      console.log(`📍 Session ID from header: ${sessionId || "none"}`);

      if (sessionId && this.transports[sessionId]) {
        // Reuse existing transport
        transport = this.transports[sessionId];
        console.log(`🔄 Reusing existing session: ${sessionId}`);
      } else if (!sessionId && isInitializeRequest(req.body) /*it's an initialization request*/) {
        // New initialization request
        console.log("🆕 Creating new transport for new client...");

        // now, we create a new mcp server for new client
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),

          onsessioninitialized: async (sessionId) => {
            // Store the transport by session ID
            this.transports[sessionId] = transport;
            console.log(`🆕 New session initialized: ${sessionId}`);

            // 1. Generate a BRAND NEW brain just for this client
            const clientServer = createMcpServerInstance();
            this.activeServers[sessionId] = clientServer;

            // Connect this transport to the server (one-time setup per transport)
            try {
              await clientServer.connect(transport);
              console.log(`🔗 Transport ${sessionId} securely bound to new MCP instance`);
            } catch (connectError) {
              const msg =
                connectError instanceof Error ? connectError.message : String(connectError);
              console.error(`❌ Connection failed for ${sessionId}`, msg);
              // Continue anyway - handleRequest will try to process
            }
          },
        });

        // Clean up transport when closed
        transport.onclose = () => {
          if (transport.sessionId) {
            delete this.activeServers[transport.sessionId];
            delete this.transports[transport.sessionId];
            console.log(`🗑️ Session & Server removed: ${transport.sessionId}`);
          }
        };

        console.log("✅ Transport created and ready");
      } else {
        // Invalid request
        res.status(400).json({
          jsonrpc: "2.0",

          error: {
            code: -32000,
            message: "Bad Request: No valid session ID provided",
          },

          id: null,
        });
        console.error("❌ Invalid request: No valid session ID provided");
        return;
      }

      // Handle the request
      console.log("🔧 Handling MCP request...");
      await transport.handleRequest(req, res, req.body);
      console.log(`✅ POST request handled successfully (status=${res.statusCode})`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error("💥 Error handling MCP request:", errorMsg);
      console.error("Full error:", error);

      if (!res.headersSent) {
        res.status(500).json(this.createRPCErrorResponse("Internal server error."));
        console.error("🔥 Responded with 500 Internal Server Error");
      }
    }
  }

  // Handle DELETE requests for session termination (session Close/delete)
  async handleDeleteRequest(req: Request, res: Response) {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId || !this.transports[sessionId]) {
      res.status(400).send("Invalid or missing session ID");
      console.log("🚫 DELETE request rejected: Invalid or missing session ID");
      return;
    }

    const transport = this.transports[sessionId];

    try {
      transport.close();
      delete this.transports[sessionId];
      delete this.activeServers[sessionId];

      res.status(200).send("Session terminated successfully");
      console.log(`🔒 Session ${sessionId} terminated successfully`);
    } catch (error) {
      console.error(`💥 Error terminating session ${sessionId}:`, error);
      res.status(500).send("Error terminating session");
    }
  }

  // close the StreamableHTTPServer instance
  async close() {
    console.log("🛑 Shutting down server...");

    // Close all active transports
    for (const transport of Object.values(this.transports)) {
      try {
        transport.close();
        console.log(`🗑️ Transport closed for session ID: ${transport.sessionId}`);
      } catch (error) {
        console.error("💥 Error closing transport:", error);
      }
    }

    // Close all active servers
    for (const [sessionId, server] of Object.entries(this.activeServers)) {
      try {
        server.close();
        console.log(`🗑️ Server closed for session ID: ${sessionId}`);
      } catch (error) {
        console.error("💥 Error closing Server:", error);
      }
    }
    console.log("👋 Server shutdown complete.");
  }

  private createRPCErrorResponse(message: string): JSONRPCError {
    return {
      jsonrpc: "2.0",

      error: {
        code: -32603,
        message: message,
      },

      id: randomUUID(),
    };
  }
}

// Create StreamableHTTPServer instance (single StreamableHTTPServer handles 1(mcpServer)to1(mcpClient) i.e. create mcpServer for each session)
const server = new StreamableHTTPServer();

// Express app setup
const app = express();
app.use(express.json()); // why this line??

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`🌐 Incoming ${req.method} request to ${req.originalUrl}`);
  next();
});

/*
HTTP requests send data as a raw stream of text over the network.

-- This line is a "middleware" that intercepts every incoming request. It looks at the raw text, converts it into a usable JavaScript object, and attaches it to req.body
*/

const router = express.Router();
const MCP_ENDPOINT = "/mcp";

router.get(MCP_ENDPOINT, async (req: Request, res: Response) => {
  await server.handleGetRequest(req, res);
});

router.post(MCP_ENDPOINT, async (req: Request, res: Response) => {
  await server.handlePostRequest(req, res);
});

// Handle session termination
router.delete(MCP_ENDPOINT, async (req: Request, res: Response) => {
  await server.handleDeleteRequest(req, res);
});

app.use("/", router); // why this line??

/*
Why it is there: In standard Express apps, you don't attach routes directly to the main app object because it gets messy very quickly. Instead, you create a mini-application called a Router (which you did with const router = express.Router();).

You attached your GET, POST, and DELETE routes to that mini-router.

The app.use("/", router); line takes all the rules you defined on your mini-router and "mounts" them onto the main application at the root URL path (/). It tells Express: "Hey, any traffic coming to the root domain should be handled by this specific router."
*/

// Start server
const PORT = process.env.PORT || 3000;

// boots up the server.
app.listen(PORT, () => {
  console.log(`🚀 MCP Calculator Server (HTTP Streaming - Stateful)`);
  console.log(`🌐 MCP endpoint: http://localhost:${PORT}${MCP_ENDPOINT}`);
  console.log(`⌨️  Press Ctrl+C to stop the server`);
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
  console.log(`🛑 Shutting down server...`);

  await server.close();
  process.exit(0 /* 0 means success */);
});
