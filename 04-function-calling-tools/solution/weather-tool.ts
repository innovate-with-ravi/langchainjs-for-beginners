/**
 * Chapter 4 Assignment Solution: Weather Tool with Complete Execution Loop
 *
 * Run: npx tsx 04-function-calling-tools/solution/weather-tool.ts
 */

import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, ToolMessage, tool } from "langchain";
import * as z from "zod";
import "dotenv/config";

// Define weather tool with Zod schema
const weatherTool = tool(
  async (input) => {
    // Simulated weather data for various cities
    const weatherData: Record<string, { temp_f: number; temp_c: number; condition: string }> = {
      Tokyo: { temp_f: 75, temp_c: 24, condition: "partly cloudy" },
      Paris: { temp_f: 64, temp_c: 18, condition: "sunny" },
      London: { temp_f: 59, temp_c: 15, condition: "rainy" },
      "New York": { temp_f: 72, temp_c: 22, condition: "clear" },
      Seattle: { temp_f: 62, temp_c: 17, condition: "cloudy" },
      Sydney: { temp_f: 79, temp_c: 26, condition: "sunny" },
      Mumbai: { temp_f: 88, temp_c: 31, condition: "humid and hot" },
    };

    const cityData = weatherData[input.city];

    if (!cityData) {
      return `Weather data not available for ${input.city}. Available cities: ${Object.keys(weatherData).join(", ")}`;
    }

    const units = input.units || "fahrenheit";
    const temp = units === "celsius" ? cityData.temp_c : cityData.temp_f;
    const unit = units === "celsius" ? "°C" : "°F";

    return `Current weather in ${input.city}: ${temp}${unit}, ${cityData.condition}`;
  },
  {
    name: "getWeather",
    description:
      "Get current weather information for a city. Returns temperature and weather conditions. Use this when the user asks about weather, temperature, or conditions in a specific location.",
    schema: z.object({
      city: z.string().describe("City name, e.g., 'Tokyo' or 'Paris'"),
      units: z
        .enum(["celsius", "fahrenheit"])
        .optional()
        .describe("Temperature unit (default: fahrenheit)"),
    }),
  }
);

async function main() {
  console.log("⛅ Weather Tool - Complete Execution Loop\n");
  console.log("=".repeat(80) + "\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  const modelWithTools = model.bindTools([weatherTool]);

  // Test multiple queries
  const queries = [
    "What's the weather in Tokyo?",
    "Tell me the temperature in Paris in celsius",
    "Is it raining in London?",
  ];

  for (const query of queries) {
    console.log(`User: ${query}\n`);

    // Step 1: Get tool call from LLM
    console.log("Step 1: LLM generates tool call...");
    const response1 = await modelWithTools.invoke([new HumanMessage(query)]);

    if (!response1.tool_calls || response1.tool_calls.length === 0) {
      console.log("  No tool call generated - direct response");
      console.log(`  Response: ${response1.content}\n`);
      console.log("─".repeat(80) + "\n");
      continue;
    }

    const toolCall = response1.tool_calls[0];
    console.log(`  Tool: ${toolCall.name}`);
    console.log(`  Args: ${JSON.stringify(toolCall.args)}`);
    console.log(`  ID: ${toolCall.id}`);

    // Step 2: Execute the tool
    console.log("\nStep 2: Executing tool...");
    const toolResult = await weatherTool.invoke(weatherTool.schema.parse(toolCall.args));
    console.log(`  Result: ${toolResult}`);

    // Step 3: Send result back to LLM
    console.log("\nStep 3: Sending result back to LLM...");
    const messages = [
      new HumanMessage(query),
      // new AIMessage({content: , tool_calls: })
      new AIMessage({
        content: response1.content,
        tool_calls: response1.tool_calls,
      }),
      // new ToolMessage({content: , tool_call_id: })
      new ToolMessage({
        content: String(toolResult),
        tool_call_id: toolCall.id || "",
      }),
    ];

    const finalResponse = await model.invoke(messages);
    console.log(`  Final answer: ${finalResponse.content}\n`);

    console.log("─".repeat(80) + "\n");
  }

  console.log("=".repeat(80) + "\n");
  console.log("💡 Key Takeaways:");
  console.log("   • Tool uses Zod schema for type-safe parameters");
  console.log("   • Complete 3-step pattern: generate → execute → respond");
  console.log("   • Tool handles optional parameters (units)");
  console.log("   • LLM generates natural language from tool results");
}

main().catch(console.error);
