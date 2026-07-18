/**
 * MCP RAG Server - ~HTTP Streamable MCP Server~ STDIO server
 * Run: npx tsx 07-agentic-rag-systems/samples/mcp-rag-server/mcp-rag-server.ts
 *
 * This example demonstrates building an HTTP streamable MCP server that exposes
 * RAG (Retrieval Augmented Generation) capabilities as tools. Multiple agents
 * and applications can connect to this server to access a shared knowledge base.
 *
 * Architecture:
 * - MCP Server exposes two tools: searchDocuments and addDocument
 * - Vector store maintains the knowledge base in memory
 * - HTTP server allows remote connections from agents
 * - Multiple agents can share the same knowledge base
 *
 * Based on patterns from: https://github.com/DanWahlin/marvel-mcp
 *
 * ⚠️ SECURITY NOTE:
 * This example does NOT implement authentication or authorization. For production:
 * - Add authentication to verify client identity
 * - Implement authorization to control document access
 * - Add rate limiting and input validation
 * - Use HTTPS for encrypted communication
 * - See: https://modelcontextprotocol.io/docs/tutorials/security/authorization
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "How does the MCP server expose RAG as a tool?"
 * - "Why is RAG better as a service than embedded in each agent?"
 * - "How do multiple agents share the same knowledge base?"
 * - "What security measures should I add for production?"
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import "dotenv/config";

// Initialize embeddings and vector store
const embeddings = new OpenAIEmbeddings({
  model: process.env.AI_EMBEDDING_MODEL || "text-embedding-3-small",
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

// Create a vector store - will be initialized before server starts
let vectorStore: MemoryVectorStore;

async function initializeVectorStore(): Promise<MemoryVectorStore> {
  console.log("🔧 Initializing vector store with sample documents...\n");

  // NOTE: Using MemoryVectorStore for educational simplicity
  // For production, use persistent storage like Pinecone, Chroma, or Weaviate
  // to preserve data across server restarts

  const initialDocs = [
    new Document({
      pageContent:
        "LangChain.js is a framework for developing applications powered by large language models. It provides tools for prompt management, chains, agents, memory, and more.",
      metadata: { source: "langchain-intro", category: "framework" },
    }),
    new Document({
      pageContent:
        "The Model Context Protocol (MCP) is an open standard for connecting AI applications to external data sources and tools. It provides a universal way to integrate AI with various services.",
      metadata: { source: "mcp-intro", category: "protocol" },
    }),
    new Document({
      pageContent:
        "Agentic RAG combines autonomous agents with retrieval augmented generation. Agents decide when to search the knowledge base versus answering directly, making the system more efficient.",
      metadata: { source: "agentic-rag", category: "pattern" },
    }),
    new Document({
      pageContent:
        "Vector embeddings are numerical representations of text that capture semantic meaning. Similar concepts have similar embeddings, enabling semantic search capabilities.",
      metadata: { source: "embeddings", category: "concepts" },
    }),
  ];

  const store = await MemoryVectorStore.fromDocuments(initialDocs, embeddings);
  console.log(`✅ Vector store initialized with ${initialDocs.length} documents\n`);

  return store;
}

// Create MCP Server
const server = new Server(
  {
    name: "rag-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool 1: Search Documents
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "searchDocuments",
        description:
          "Search the knowledge base for relevant documents. Use this when you need specific information from the knowledge base. Returns the most relevant documents based on semantic similarity.",

        inputSchema: {
          type: "object",
          properties: {
            query: {
              type: "string",
              description: "The search query to find relevant documents",
            },
            k: {
              type: "number",
              description: "Number of documents to return (default: 2)",
            },
          },
          required: ["query"],
        },
      },
      {
        name: "addDocument",
        description:
          "Add a new document to the knowledge base. Use this to store information that can be retrieved later.",
        inputSchema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The document content to add",
            },
            source: {
              type: "string",
              description: "The source identifier for the document",
            },
            category: {
              type: "string",
              description: "Category or topic of the document",
            },
          },
          required: ["content", "source"],
        },
      },
    ],
  };
});

// Tool execution handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (name === "searchDocuments") {
      // Validate required arguments
      if (!args) {
        throw new Error("Missing arguments for searchDocuments");
      }

      if (!args.query || typeof args.query !== "string") {
        throw new Error("Missing or invalid 'query' parameter (must be a non-empty string)");
      }

      if (args.query.trim().length === 0) {
        throw new Error("Query cannot be empty");
      }

      const query = args.query;

      // Validate and set k parameter
      const DEFAULT_SEARCH_RESULTS = 2;
      let k = DEFAULT_SEARCH_RESULTS;

      if (args.k !== undefined) {
        if (typeof args.k !== "number" || args.k < 1 || args.k > 10) {
          throw new Error("Parameter 'k' must be a number between 1 and 10");
        }
        k = args.k;
      }

      console.log(`🔍 Searching for: "${query}" (returning ${k} results)`);

      // Ensure vector store is initialized
      if (!vectorStore) {
        throw new Error("Vector store not initialized. Server may still be starting up.");
      }

      const results = await vectorStore.similaritySearch(query, k);

      const formattedResults = results
        .map((doc, i) => {
          return `[Document ${i + 1}]
Source: ${doc.metadata.source}
Category: ${doc.metadata.category}
Content: ${doc.pageContent}
`;
        })
        .join("\n");

      console.log(`✅ Found ${results.length} relevant documents\n`);

      return {
        content: [
          {
            type: "text",
            text: formattedResults,
          },
        ],
      };
    } else if (name === "addDocument") {
      // Validate required arguments
      if (!args) {
        throw new Error("Missing arguments for addDocument");
      }

      if (!args.content || typeof args.content !== "string") {
        throw new Error("Missing or invalid 'content' parameter (must be a non-empty string)");
      }

      if (args.content.trim().length === 0) {
        throw new Error("Document content cannot be empty");
      }

      if (!args.source || typeof args.source !== "string") {
        throw new Error("Missing or invalid 'source' parameter (must be a non-empty string)");
      }

      const content = args.content;
      const source = args.source;
      const category = (args.category as string) || "general";

      // Ensure vector store is initialized
      if (!vectorStore) {
        throw new Error("Vector store not initialized. Server may still be starting up.");
      }

      console.log(`📝 Adding document from source: ${source}`);

      const doc = new Document({
        pageContent: content,
        metadata: { source, category },
      });

      await vectorStore.addDocuments([doc]);

      console.log(`✅ Document added successfully\n`);

      return {
        content: [
          {
            type: "text",
            text: `Successfully added document from "${source}" to the knowledge base.`,
          },
        ],
      };
    } else {
      throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`❌ Error executing tool ${name}:`, errorMessage);

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

// Start the server
async function main() {
  console.log("🤖 MCP RAG Server - Exposing RAG as a Service\n");
  console.log("=".repeat(70) + "\n");

  // Initialize vector store BEFORE starting server
  // This ensures tools can't be called before data is ready
  vectorStore = await initializeVectorStore();

  // Start MCP server with stdio transport
  // NOTE: This example uses stdio (stdin/stdout) for MCP communication
  // The client process spawns this server as a subprocess
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.log("✅ MCP Server initialized and ready for connections\n");
  console.log("💡 Run the agent client to connect:\n");
  console.log("   npx tsx 07-agentic-rag-systems/samples/mcp-rag-server/mcp-rag-agent.ts\n");
  console.log("=".repeat(70) + "\n");

  // Handle graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n\n🛑 Shutting down MCP RAG Server...");
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
