import { createAgent, HumanMessage, tool } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import { evaluate } from "mathjs";
import * as z from "zod";
import "dotenv/config";

/**
 * Example 2: createAgent() with Multiple Tools
 *
 * This example demonstrates how createAgent() automatically selects
 * the correct tool for each query from a set of available tools.
 *
 * The agent will:
 * - Use the calculator for math questions
 * - Use the weather tool for weather queries
 * - Use the search tool for general information
 */

// Tool 1: Calculator
const calculatorTool = tool(
  async (input) => {
    // Use mathjs for safe mathematical evaluation
    const result = evaluate(input.expression);
    return `The result is: ${result}`;
  },
  {
    name: "calculator",
    description: "Perform mathematical calculations. Use this for arithmetic operations.",
    schema: z.object({
      expression: z.string().describe("The mathematical expression to evaluate"),
    }),
  }
);

// Tool 2: Weather
const weatherTool = tool(
  async (input) => {
    // Simulated weather data
    const weather: Record<string, string> = {
      Seattle: "62°F, cloudy with a chance of rain",
      Paris: "18°C, sunny and pleasant",
      Tokyo: "24°C, rainy with occasional thunder",
      "New York": "70°F, partly cloudy",
      London: "15°C, foggy with light drizzle",
    };

    const cityWeather = weather[input.city];
    return cityWeather
      ? `Current weather in ${input.city}: ${cityWeather}`
      : `Weather data unavailable for ${input.city}`;
  },
  {
    name: "getWeather",
    description: "Get current weather information for a specific city",
    schema: z.object({
      city: z.string().describe("The name of the city to get weather for"),
    }),
  }
);

// Tool 3: Search
const searchTool = tool(
  async (input) => {
    // Simulated search results
    const searchResults: Record<string, string> = {
      "LangChain.js":
        "LangChain.js is a framework for building applications with large language models (LLMs). It provides tools, agents, chains, and memory systems to create sophisticated AI applications.",
      TypeScript:
        "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.",
      "JavaScript frameworks":
        "Popular JavaScript frameworks include React, Vue, Angular, Svelte, and Next.js for building modern web applications.",
    };

    // Find best match (simplified)
    let bestMatch = `Search results for "${input.query}": Found information about web development, programming, and related topics.`;

    for (const [key, value] of Object.entries(searchResults)) {
      if (input.query.toLowerCase().includes(key.toLowerCase())) {
        bestMatch = `Search results for "${input.query}": ${value}`;
        break;
      }
    }

    return bestMatch;
  },
  {
    name: "search",
    description: "Search for information on the web. Use this for general knowledge questions.",
    schema: z.object({
      query: z.string().describe("The search query"),
    }),
  }
);

async function main() {
  console.log("🎛️  Multi-Tool Agent with createAgent()\n");

  // Create model
  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  // Create agent with all three tools
  const agent = createAgent({
    model,
    tools: [calculatorTool, weatherTool, searchTool],
  });

  // Test with different queries - agent selects the right tool automatically
  const queries = [
    "What is 50 * 25?",
    "What's the weather in Tokyo?",
    "Tell me about LangChain.js",
  ];

  for (const query of queries) {
    console.log(`👤 User: ${query}`);
    const response = await agent.invoke({ messages: [new HumanMessage(query)] });
    // console.log("response.messages:", response.messages);
    // maintains conversation history for current invocation only
    console.log("response.messages.length:", response.messages.length);
    const lastMessage = response.messages[response.messages.length - 1];
    console.log(`🤖 Agent: ${lastMessage.content}\n`);
  }

  console.log("💡 What just happened:");
  console.log("   • The agent automatically selected the right tool for each query");
  console.log("   • Calculator for math (50 * 25)");
  console.log("   • Weather tool for Tokyo weather");
  console.log("   • Search tool for LangChain.js information");
  console.log("   • All with the same agent instance!\n");

  console.log("✅ Production Pattern:");
  console.log("   This is how you build real-world agents:");
  console.log("   1. Define your tools");
  console.log("   2. Pass them to createAgent()");
  console.log("   3. Let the agent handle tool selection and execution");
}

main().catch(console.error);
