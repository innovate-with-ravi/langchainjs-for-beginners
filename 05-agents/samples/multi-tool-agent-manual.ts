/**
 * Chapter 5 Example: Multi-Tool Agent with Manual Loop
 *
 * Run: npx tsx 05-agents/samples/multi-tool-agent-manual.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "How does the agent decide which tool to use at each step?"
 * - "Can an agent use multiple tools in sequence to answer one question?"
 * - "What strategies help the agent choose the right tool?"
 */

import { ChatOpenAI } from "@langchain/openai";
import { tool } from "langchain";
import { evaluate } from "mathjs";
import * as z from "zod";
import "dotenv/config";
import { ChatGroq } from "@langchain/groq";

const calculatorTool = tool(
  async (input) => {
    // Use mathjs for safe mathematical evaluation
    const result = evaluate(input.expression);
    return String(result);
  },
  {
    name: "calculator",
    description: "Perform mathematical calculations",
    schema: z.object({ expression: z.string() }),
  }
);

const weatherTool = tool(
  async (input) => {
    const weather = {
      Seattle: "62°F, cloudy",
      Paris: "18°C, sunny",
      Tokyo: "24°C, rainy",
    };
    return weather[input.city as keyof typeof weather] || "Weather data unavailable";
  },
  {
    name: "getWeather",
    description: "Get current weather for a city",
    schema: z.object({ city: z.string() }),
  }
);

const searchTool = tool(
  async (input) => `Search results for "${input.query}": [Simulated results]`,
  {
    name: "search",
    description: "Search for information on the web",
    schema: z.object({ query: z.string() }),
  }
);

async function main() {
  console.log("🎛️ Multi-Tool Agent Demo\n");
  console.log("=".repeat(80) + "\n");

  const model = new ChatGroq({
    model: "llama-3.1-8b-instant",
    apiKey: process.env.GROQ_API_KEY,
  });

  const modelWithTools = model.bindTools([calculatorTool, weatherTool, searchTool]);

  const queries = [
    "What is 50 * 25?",
    "What's the weather in Tokyo?",
    "Search for information about TypeScript",
  ];

  for (const query of queries) {
    console.log(`Query: "${query}"`);

    const response = await modelWithTools.invoke(query);

    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCall = response.tool_calls[0];
      console.log(`  → Agent chose: ${toolCall.name}`);
      console.log(`  → With args: ${JSON.stringify(toolCall.args)}`);
    }

    console.log("─".repeat(80) + "\n");
  }

  console.log("=".repeat(80) + "\n");
  console.log("💡 Key Concepts:");
  console.log("   • Agents automatically select appropriate tools");
  console.log("   • Tool descriptions guide selection");
  console.log("   • Multiple specialized tools enable complex tasks");
}

main().catch(console.error);
