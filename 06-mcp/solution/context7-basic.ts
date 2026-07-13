/**
 * Chapter 6 Assignment Solution: Challenge 1 - Connect to Context7 MCP Server
 *
 * This solution demonstrates:
 * - Connecting to the Context7 MCP server using HTTP transport
 * - Listing available tools from the server
 * - Creating an agent that uses MCP tools
 * - Querying documentation from Context7
 *
 * Run: npx tsx 06-mcp/solution/context7-basic.ts
 */

import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import { createAgent, HumanMessage } from "langchain";
import "dotenv/config";

console.log("🔧 Chapter 6 Assignment Solution: Challenge 1");
console.log("=".repeat(60));
console.log();

async function main() {
  // Step 1: Create MCP client and connect to Context7
  console.log("📡 Connecting to Context7 MCP server...");
  const mcpClient = new MultiServerMCPClient({
    context7: {
      transport: "http",
      url: "https://mcp.context7.com/mcp",
    },
  });

  try {
    // Step 2: Get available tools from Context7
    console.log("🔍 Fetching available tools...\n");
    const tools = await mcpClient.getTools();

    console.log("🔧 Available Tools from Context7:");
    tools.forEach((tool) => {
      console.log(`   • ${tool.name}: ${tool.description}`);
    });
    console.log();

    // Step 3: Create the AI model
    const model = new ChatOpenAI({
      model: process.env.AI_MODEL || "gpt-4o-mini",
      configuration: { baseURL: process.env.AI_ENDPOINT },
      apiKey: process.env.AI_API_KEY,
    });

    // Step 4: Create agent with MCP tools
    console.log("🤖 Creating agent with Context7 tools...\n");
    const agent = createAgent({
      model,
      tools,
    });

    // Step 5: Query for documentation
    const queries = [
      "How do I use Express.js middleware?",
      "What are React hooks and how do I use useState?",
    ];

    for (const query of queries) {
      console.log(`👤 User: ${query}`);
      console.log();

      const response = await agent.invoke({
        messages: [new HumanMessage(query)],
      });

      const lastMessage = response.messages[response.messages.length - 1];
      console.log(`🤖 Agent:`);
      console.log(lastMessage.content);
      console.log();
      console.log("-".repeat(60));
      console.log();
    }

    console.log("✅ Challenge 1 Complete!");
    console.log();
    console.log("💡 Key Concepts Demonstrated:");
    console.log("   • Connected to Context7 via HTTP transport");
    console.log("   • Retrieved and listed available MCP tools");
    console.log("   • Created an agent that uses external MCP tools");
    console.log("   • Queried documentation seamlessly through the agent");
    console.log("   • Same agent pattern as Chapter 5, different tool source!");
    console.log();
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  } finally {
    // Step 6: Clean up - close MCP connection
    await mcpClient.close();
    console.log("🔌 MCP client connection closed");
  }
}

main();
