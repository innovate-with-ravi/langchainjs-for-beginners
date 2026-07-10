/**
 * Assignment Solution: Research Agent with createAgent()
 *
 * Run: npx tsx 05-agents/solution/research-agent.ts
 */

import { ChatOpenAI } from "@langchain/openai";
import { createAgent, HumanMessage, AIMessage, tool } from "langchain";
import * as z from "zod";
import { evaluate } from "mathjs";
import "dotenv/config";
import { ChatGroq } from "@langchain/groq";

// Search tool - simulates web search
const searchTool = tool(
  async (input) => {
    // Simulated search results
    const searchResults: Record<string, string> = {
      "population of tokyo":
        "Tokyo has a population of approximately 14 million people in the city proper, and over 37 million in the greater metropolitan area.",
      "capital of france": "The capital of France is Paris.",
      "capital of japan": "The capital of Japan is Tokyo.",
      "population of new york":
        "New York City has a population of approximately 8.3 million people.",
      "distance london to paris":
        "The distance between London and Paris is approximately 343 kilometers.",
      "highest mountain":
        "Mount Everest is the highest mountain in the world at 8,849 meters (29,032 feet).",
    };

    const queryLower = input.query.toLowerCase();

    // Find matching result
    for (const [key, value] of Object.entries(searchResults)) {
      if (queryLower.includes(key) || key.includes(queryLower)) {
        return value;
      }
    }

    return `Search results for "${input.query}": No specific information found. This is a simulated search tool with limited data.`;
  },
  {
    name: "search",
    description:
      "Search for factual information on the web. Use this when you need to find facts, statistics, or general knowledge. Good for finding populations, capitals, distances, and other factual data.",
    schema: z.object({
      query: z
        .string()
        .describe("The search query, e.g., 'population of Tokyo' or 'capital of France'"),
    }),
  }
);

// Calculator tool - uses mathjs for safe expression evaluation
const calculatorTool = tool(
  async (input) => {
    try {
      const result = evaluate(input.expression);
      return String(result);
    } catch (error) {
      return `Error calculating ${input.expression}: ${error instanceof Error ? error.message : "Unknown error"}`;
    }
  },
  {
    name: "calculator",
    description:
      "Perform mathematical calculations. Use this for arithmetic operations like addition, subtraction, multiplication, division, and more complex math expressions.",
    schema: z.object({
      expression: z
        .string()
        .describe(
          "The mathematical expression to evaluate, e.g., '14000000 * 2' or '(100 + 50) / 2'"
        ),
    }),
  }
);

async function main() {
  console.log("🔍 Research Agent using createAgent()\n");
  console.log("=".repeat(80) + "\n");

  // Create the model
  const model = new ChatGroq({
    model: String(process.env.GROQ_AI_MODEL),
    apiKey: process.env.GROQ_API_KEY,
  });

  // Create agent using createAgent() - handles ReAct loop automatically
  const agent = createAgent({
    model,
    tools: [searchTool, calculatorTool],
    systemPrompt:
      "You are a helpful assistant that completes tasks using the available tools. " +
      "Do NOT ask clarifying questions - make reasonable assumptions and proceed with the task. " +
      "For population data, always use city proper figures. Execute the task immediately.",
  });

  // Test queries
  const queries = [
    "What is the population of Tokyo multiplied by 2?",
    "Search for the capital of France and tell me how many letters are in its name",
  ];

  for (const query of queries) {
    console.log(`👤 User: ${query}\n`);

    // Invoke the agent - it handles the ReAct loop internally
    const response = await agent.invoke({ messages: [new HumanMessage(query)] });

    // Get the final answer (last message)
    const lastMessage = response.messages.at(-1)!;
    console.log(`🤖 Agent: ${lastMessage.content}\n`);

    // Show which tools were used
    const toolCalls = response.messages
      .filter((msg) => msg instanceof AIMessage && msg.tool_calls && msg.tool_calls.length > 0)
      .flatMap((msg) => (msg as AIMessage).tool_calls!.map((tc) => tc.name));

    if (toolCalls.length > 0) {
      console.log(`📊 Tools used: ${[...new Set(toolCalls)].join(", ")}`);
      console.log(`   Total tool calls: ${toolCalls.length}\n`);
    }

    console.log("=".repeat(80) + "\n");
  }

  console.log("💡 Key Concepts:");
  console.log("   • createAgent() handles the ReAct loop automatically");
  console.log("   • Agent decides which tools to use and when");
  console.log("   • Agent iterates until it has enough information");
  console.log("   • Much simpler than manual loop implementation");
}

main().catch(console.error);
