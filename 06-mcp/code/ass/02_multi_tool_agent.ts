import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatGroq } from "@langchain/groq";
import { createAgent, HumanMessage, tool } from "langchain";
import { evaluate } from "mathjs";
import * as z from "zod";
import "dotenv/config";
import { ChatOpenAI } from "@langchain/openai";

// Custom calculator tool (not from MCP)
const calculatorTool = tool(
  async (input) => {
    console.log(`   [Calculator] Evaluating: ${input.expression}`);
    try {
      // Use mathjs for safe mathematical evaluation
      const result = evaluate(input.expression);
      return `The result is: ${result}`;
    } catch (error) {
      return `Error calculating "${input.expression}": ${error}`;
    }
  },
  {
    name: "calculator",
    description:
      "Perform mathematical calculations. Use this for arithmetic operations like addition, subtraction, multiplication, division, and more complex expressions. Examples: '125 * 8', '50 + 25', '(10 + 5) * 2'",
    schema: z.object({
      expression: z
        .string()
        .describe("The mathematical expression to evaluate, e.g., '125 * 8' or '50 + 25'"),
    }),
  }
);

const mcpClient = new MultiServerMCPClient({
  context7: {
    transport: "http",
    url: "https://mcp.context7.com/mcp",
  },
});

try {
  // Step 2: Get MCP tools
  console.log("🔍 Fetching MCP tools from Context7...");
  const mcpTools = await mcpClient.getTools();

  // Step 3: Combine MCP tools with custom tools
  console.log("🔧 Combining MCP tools with custom calculator tool...\n");
  const allTools = [...mcpTools, calculatorTool];

  console.log("📋 Available Tools:");
  console.log("\n   From Context7 (MCP):");
  mcpTools.forEach((tool) => {
    console.log(`   • ${tool.name}: ${tool.description}`);
  });
  console.log("\n   Custom Tools:");
  console.log(`   • calculator: Mathematical calculations`);
  console.log();

  // Step 4: Create model
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  // Step 5: Create agent with all tools
  console.log("🤖 Creating multi-tool agent...\n");
  const agent = createAgent({
    model,
    tools: allTools,
  });

  // Step 6: Test with different queries
  const queries = ["What is 125 * 8?", "How do I use React hooks?", "Calculate 50 + 25"];

  for (const query of queries) {
    console.log(`👤 User: ${query}`);

    const response = await agent.invoke({
      messages: [new HumanMessage(query)],
    });

    const lastMessage = response.messages[response.messages.length - 1];
    console.log(`🤖 Agent: ${lastMessage.content}`);
    console.log();
    console.log("-".repeat(60));
    console.log();
  }
  
  console.log();
} catch (error) {
  console.error("❌ Error:", error);
  throw error;
} finally {
  // Clean up
  await mcpClient.close();
  console.log("🔌 MCP client connection closed");
}
