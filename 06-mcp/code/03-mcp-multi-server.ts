/**
 * Chapter 6 Example 3: Multi-Server MCP Integration
 *
 * This example shows how to connect to MULTIPLE MCP servers simultaneously.
 * The agent gets tools from all servers and intelligently chooses which to use.
 *
 * Servers used:
 * - Context7: Documentation tools (HTTP, remote)
 * - Local Calculator: Math tools (stdio, local subprocess)
 *
 * The power of MCP: One client, many servers, different transports, unified interface!
 *
 * Run: tsx 06-mcp/code/03-mcp-multi-server.ts
 */

import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, HumanMessage } from "langchain";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🌐 Connecting to multiple MCP servers...\n");

// Create MCP client connected to MULTIPLE servers
const mcpClient = new MultiServerMCPClient({
  // Server 1: Context7 (remote, HTTP)
  context7: {
    transport: "http",
    url: "https://mcp.context7.com/mcp",
  },
  // Server 2: Local Calculator (local, stdio)
  calculator: {
    transport: "stdio",
    command: "npx",
    args: ["tsx", join(__dirname, "servers/stdio-calculator-server.ts")],
  },
});

try {
  // 1. Get tools from ALL connected servers
  console.log("🔧 Fetching tools from all servers...");
  const tools = await mcpClient.getTools();

  console.log(`✅ Retrieved ${tools.length} total tools from ${2} servers:\n`);

  // Group and display tools by server
  const context7Tools = tools.filter((t) => t.name.includes("library") || t.name.includes("query"));
  const calcTools = tools.filter((t) => t.name === "calculate" || t.name === "convert_temperature");

  console.log("📚 From Context7 (Documentation):");
  context7Tools.forEach((tool) => {
    console.log(`   • ${tool.name}: ${tool.description}`);
  });

  console.log("\n🧮 From Local Calculator:");
  calcTools.forEach((tool) => {
    console.log(`   • ${tool.name}: ${tool.description}`);
  });
  console.log();

  // 2. Create model
  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  // 3. Create agent with tools from ALL servers
  const agent = createAgent({
    model,
    tools, // Tools from multiple servers!
  });

  // 4. Test 1: Agent uses CALCULATOR tool
  console.log("Test 1: Math question (should use calculator)\n");
  const mathQuery = "What is 25 * 4 + 100?";
  console.log(`👤 User: ${mathQuery}`);

  const mathResponse = await agent.invoke({
    messages: [new HumanMessage(mathQuery)],
  });
  console.log(`🤖 Agent: ${mathResponse.messages[mathResponse.messages.length - 1].content}\n`);

  // 5. Test 2: Agent uses CONTEXT7 tool
  console.log("Test 2: Documentation question (should use Context7)\n");
  const docsQuery = "What is React? Get documentation.";
  console.log(`👤 User: ${docsQuery}`);

  const docsResponse = await agent.invoke({
    messages: [new HumanMessage(docsQuery)],
  });
  console.log(`🤖 Agent: ${docsResponse.messages[docsResponse.messages.length - 1].content}\n`);

  // 6. Test 3: Agent uses BOTH tools in sequence!
  console.log("Test 3: Combined question (should use BOTH tools)\n");
  const combinedQuery =
    "Calculate 15 * 8, then find React documentation about that result if it's a power of 2";
  console.log(`👤 User: ${combinedQuery}`);

  const combinedResponse = await agent.invoke({
    messages: [new HumanMessage(combinedQuery)],
  });
  console.log(
    `🤖 Agent: ${combinedResponse.messages[combinedResponse.messages.length - 1].content}\n`
  );

  console.log("💡 Key Concepts:");
  console.log("   • MultiServerMCPClient connects to multiple servers at once");
  console.log("   • Agent receives tools from ALL connected servers");
  console.log("   • Agent automatically chooses the right tool for each task");
  console.log("   • Mix different transport types (HTTP + stdio)");
  console.log("   • MCP provides unified interface across all servers");
  console.log("   • Scale to dozens of servers without changing agent code!\n");

  console.log("🎯 Real-World Use Cases:");
  console.log("   • GitHub (code) + Calendar (scheduling) + Database (data)");
  console.log("   • Documentation (Context7) + Calculator (math) + Weather (API)");
  console.log("   • Internal tools + External services in one agent");
} catch (error) {
  console.error("❌ Error with multi-server MCP:", error);
  if (error instanceof Error) {
    console.error("   Message:", error.message);
  }
} finally {
  await mcpClient.close();
  console.log("\n✅ All MCP connections closed");
}
