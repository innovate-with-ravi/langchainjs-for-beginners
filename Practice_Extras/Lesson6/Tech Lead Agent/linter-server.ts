import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest, JSONRPCError } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "node:crypto";
import express, { Request, Response, NextFunction } from "express";
import z from "zod";

// 1. The Factory Function (Produces a fresh server for every client)
function createMcpServerInstance() {
  const server = new McpServer({
    name: "linter-server",
    version: "1.0.0",
  });

  server.registerTool(
    "analyze_code",
    {
      description: "This tool analyzes code complexity.",
      // Zod Fix: Use a raw object, NOT z.object()
      inputSchema: {
        codeSnippet: z.string(),
      },
    },
    async ({ codeSnippet }) => {
      const quality = codeSnippet.length > 50 ? "high complexity" : "clean";
      return {
        content: [
          {
            type: "text",
            text: `The provided code has ${quality}.\nSnippet: ${codeSnippet.slice(0, 100)}`,
          },
        ],
      };
    }
  );

  return server;
}

// 2. The Session Manager (Prevents the C++ Node crash)
class StreamableHTTPServer {
  private transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
  private activeServers: { [sessionId: string]: McpServer } = {};

  async handlePostRequest(req: Request, res: Response) {
    try {
      const sessionId = req.headers["mcp-session-id"] as string | undefined;
      let transport: StreamableHTTPServerTransport;

      if (sessionId && this.transports[sessionId]) {
        transport = this.transports[sessionId];
      } else if (!sessionId && isInitializeRequest(req.body)) {
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: async (newSessionId) => {
            this.transports[newSessionId] = transport;

            const clientServer = createMcpServerInstance();
            this.activeServers[newSessionId] = clientServer;

            /*await*/ clientServer.connect(transport).catch(console.error);
          },
        });

        transport.onclose = () => {
          if (transport.sessionId) {
            delete this.activeServers[transport.sessionId];
            delete this.transports[transport.sessionId];
          }
        };
      } else {
        res.status(400).json({ error: "Invalid request or missing session ID" });
        return;
      }

      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("💥 Error handling MCP request:", error);
      if (!res.headersSent) res.status(500).send("Internal server error");
    }
  }

  async handleDeleteRequest(req: Request, res: Response) {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (sessionId && this.transports[sessionId]) {
      this.transports[sessionId].close();
      delete this.transports[sessionId];
      delete this.activeServers[sessionId];
      res.status(200).send("Session terminated");
    } else {
      res.status(400).send("Invalid session ID");
    }
  }
}

// 3. The Express Bouncer and Routing
const server = new StreamableHTTPServer();
const app = express();
const router = express.Router();

app.use(express.json());

// The Auth Middleware
const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;

  if (auth !== `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`) {
    console.error("🚨 Blocked unauthorized request");
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  next();
};

// Protect the routes
// first go to requireAuth (handler1), then async (req,res) (handler2)
router.post("/mcp", requireAuth /*middleware*/, async (req: Request, res: Response) => {
  await server.handlePostRequest(req, res);
});

router.delete("/mcp", requireAuth /*middleware*/, async (req: Request, res: Response) => {
  await server.handleDeleteRequest(req, res);
});

app.use("/", router);

app.listen(3000, () => {
  console.log(`🚀 Secure Linter MCP Server running at http://localhost:3000/mcp`);
});
