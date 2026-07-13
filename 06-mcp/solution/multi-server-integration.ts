/**
 * Assignment Solution: Challenge 3 - Multi-Server Integration
 *
 * This solution demonstrates:
 * - Connecting to multiple MCP servers simultaneously
 * - Combining tools from different servers (Context7 + Local Calculator)
 * - Creating an agent that uses tools from all connected servers
 * - Agent intelligently selecting tools regardless of their source
 *
 * Run: npx tsx 06-mcp/solution/multi-server-integration.ts
 */

import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, HumanMessage } from "langchain";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

// Get the directory of this file for resolving local server path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🌐 Assignment Solution: Challenge 3");
console.log("=".repeat(60));
console.log();

async function main() {
  // Step 1: Connect to multiple MCP servers simultaneously
  console.log("📡 Connecting to multiple MCP servers...");
  console.log("   • Context7 (HTTP, remote documentation)");
  console.log("   • Local Calculator (stdio, subprocess)\n");

  const mcpClient = new MultiServerMCPClient({
    // Server 1: Context7 for documentation (remote, HTTP transport)
    context7: {
      transport: "http",
      url: "https://mcp.context7.com/mcp",
    },
    // Server 2: Local Calculator for math (local, stdio transport)
    calculator: {
      transport: "stdio",
      command: "npx",
      args: ["tsx", join(__dirname, "../code/servers/stdio-calculator-server.ts")],
    },
  });

  try {
    // Step 2: Get tools from ALL connected servers
    console.log("🔍 Fetching tools from all servers...\n");

    const context7Tools = await mcpClient.getTools(["context7"]);
    const calcTools = await mcpClient.getTools(["calculator"]);
    const allTools = [...context7Tools, ...calcTools];

    // Step 3: Display available tools organized by server
    console.log("📋 Available Tools:\n");

    // Context7 tools (documentation-related)
    // const context7Tools = allTools.filter(
    //   (t) => t.name.includes("library") || t.name.includes("resolve")
    // );
    console.log("   From context7:");
    context7Tools.forEach((tool) => {
      console.log(`   • ${tool.name}`);
    });

    // Calculator tools (math-related)
    // const calcTools = allTools.filter(
    //   (t) => t.name === "calculate" || t.name === "convert_temperature"
    // );
    console.log("\n   From calculator:");
    calcTools.forEach((tool) => {
      console.log(`   • ${tool.name}`);
    });
    console.log();

    // Step 4: Create model
    const model = new ChatOpenAI({
      model: "gpt-4o-mini",
      configuration: { baseURL: process.env.AI_ENDPOINT },
      apiKey: process.env.AI_API_KEY,
    });

    // Step 5: Create agent with tools from ALL servers
    console.log("🤖 Creating multi-server agent...\n");
    const agent = createAgent({
      model,
      tools: allTools, // Tools from multiple servers!
    });

    // Step 6: Test queries that use different servers
    console.log("Testing agent with queries that use different servers:\n");
    console.log("-".repeat(60));
    console.log();

    // Test 1: Use calculator (stdio server)
    const mathQuery = "What is 144 divided by 12?";
    console.log(`👤 User: ${mathQuery}`);

    const mathResponse = await agent.invoke({
      messages: [new HumanMessage(mathQuery)],
    });
    console.log(`🤖 Agent: ${mathResponse.messages[mathResponse.messages.length - 1].content}`);
    console.log();
    console.log("-".repeat(60));
    console.log();

    // Test 2: Use Context7 (HTTP server)
    const docsQuery = "How do I use TypeScript interfaces?";
    console.log(`👤 User: ${docsQuery}`);

    const docsResponse = await agent.invoke({
      messages: [new HumanMessage(docsQuery)],
    });
    console.log(`🤖 Agent: ${docsResponse.messages[docsResponse.messages.length - 1].content}`);
    console.log();
    console.log("-".repeat(60));
    console.log();

    // Test 3: Query that could use both servers
    const combinedQuery = "Calculate 50 * 2, then look up documentation about that number";
    console.log(`👤 User: ${combinedQuery}`);

    const combinedResponse = await agent.invoke({
      messages: [new HumanMessage(combinedQuery)],
    });
    console.log(
      `🤖 Agent: ${combinedResponse.messages[combinedResponse.messages.length - 1].content}`
    );
    console.log();
    console.log("-".repeat(60));
    console.log();

    console.log("✅ Challenge 3 Complete!");
    console.log();
    console.log("💡 What Just Happened:");
    console.log("   • Connected to 2 MCP servers with DIFFERENT transports");
    console.log("   • Context7 uses HTTP (network-based communication)");
    console.log("   • Calculator uses stdio (process-based communication)");
    console.log("   • Agent received tools from BOTH servers seamlessly");
    console.log("   • Agent autonomously chose the right tool for each query");
    console.log("   • Same agent code worked with tools from different sources!");
    console.log();
    console.log("🎯 Key Pattern:");
    console.log("   const mcpClient = new MultiServerMCPClient({");
    console.log("     server1: { transport: 'http', url: '...' },");
    console.log("     server2: { transport: 'stdio', command: '...', args: [...] }");
    console.log("   });");
    console.log("   const tools = await mcpClient.getTools(); // All tools!");
    console.log("   const agent = createAgent({ model, tools });");
    console.log();
    console.log("🚀 Scaling Up:");
    console.log("   You can connect to dozens of MCP servers:");
    console.log("   • GitHub for code repositories");
    console.log("   • Slack for team communication");
    console.log("   • Databases for data access");
    console.log("   • Internal tools specific to your organization");
    console.log("   • All available through one unified agent interface!");
    console.log();
    console.log("📖 MCP Registry:");
    console.log("   Find more MCP servers at: https://github.com/mcp");
    console.log();
  } catch (error) {
    console.error("❌ Error:", error);
    console.log();
    console.log("💡 Troubleshooting:");
    console.log("   • Ensure you have internet connection (for Context7)");
    console.log("   • Check that the local calculator server path is correct");
    console.log("   • Verify .env file has AI_MODEL, AI_ENDPOINT, and AI_API_KEY");
    console.log("   • Try running the individual examples first (01, 02, 03)");
    throw error;
  } finally {
    // Clean up - close ALL MCP connections
    await mcpClient.close();
    console.log("🔌 All MCP server connections closed");
  }
}

main();
