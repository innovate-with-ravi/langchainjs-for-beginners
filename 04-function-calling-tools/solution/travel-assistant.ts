/**
 * Chapter 4 Assignment Solution: Multi-Tool Travel Assistant
 *
 * Run: npx tsx 04-function-calling-tools/solution/travel-assistant.ts
 */

import { ChatOpenAI } from "@langchain/openai";
import { tool } from "langchain";
import * as z from "zod";
import "dotenv/config";

// Tool 1: Currency Converter
const currencyConverter = tool(
  async (input) => {
    // Simulated exchange rates (relative to USD)
    const rates: Record<string, number> /*specifying type here allows to avoid keyof typeof...*/ = {
      USD: 1.0,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
      AUD: 1.53,
      CAD: 1.36,
    };

    const fromRate = rates[input.from.toUpperCase()];
    const toRate = rates[input.to.toUpperCase()];

    if (!fromRate) {
      return `Error: Unknown currency '${input.from}'. Supported currencies: ${Object.keys(rates).join(", ")}`;
    }

    if (!toRate) {
      return `Error: Unknown currency '${input.to}'. Supported currencies: ${Object.keys(rates).join(", ")}`;
    }

    // Convert to USD first, then to target currency
    const amountInUSD = input.amount / fromRate;
    const result = amountInUSD * toRate;

    return `${input.amount} ${input.from.toUpperCase()} equals approximately ${result.toFixed(2)} ${input.to.toUpperCase()}`;
  },
  {
    name: "currencyConverter",
    description:
      "Convert amounts between different currencies (USD, EUR, GBP, JPY, AUD, CAD). Use this when the user wants to convert money from one currency to another or asks about exchange rates.",
    schema: z.object({
      amount: z.number().describe("The amount to convert"),
      from: z.string().describe("Source currency code (e.g., 'USD', 'EUR', 'GBP')"),
      to: z.string().describe("Target currency code (e.g., 'USD', 'EUR', 'GBP')"),
    }),
  }
);

// Tool 2: Distance Calculator
const distanceCalculator = tool(
  async (input) => {
    // Simulated distances between major cities (in kilometers)

    // alwyas give type of maps to avoid key type issues
    const distances: Record<string, Record<string, number>> = {
      "New York": { London: 5585, Paris: 5837, Tokyo: 10850, Sydney: 15993 },
      London: { "New York": 5585, Paris: 344, Tokyo: 9562, Sydney: 17015 },
      Paris: { "New York": 5837, London: 344, Tokyo: 9714, Rome: 1430 },
      Tokyo: { "New York": 10850, London: 9562, Paris: 9714, Sydney: 7823 },
      Sydney: { "New York": 15993, London: 17015, Tokyo: 7823, Paris: 16965 },
      Rome: { Paris: 1430, London: 1434, "New York": 6896, Tokyo: 9853 },
    };

    const fromCity = input.from;
    const toCity = input.to;

    if (!distances[fromCity]) {
      return `Error: Unknown city '${fromCity}'. Available cities: ${Object.keys(distances).join(", ")}`;
    }

    const distanceKm = distances[fromCity][toCity];

    if (!distanceKm) {
      return `Error: Distance not available between ${fromCity} and ${toCity}. Available destinations from ${fromCity}: ${Object.keys(distances[fromCity]).join(", ")}`;
    }

    const units = input.units || "kilometers";
    const distance = units === "miles" ? (distanceKm * 0.621371).toFixed(0) : distanceKm;
    const unit = units === "miles" ? "miles" : "kilometers";

    return `The distance from ${fromCity} to ${toCity} is approximately ${distance} ${unit}`;
  },
  {
    name: "distanceCalculator",
    description:
      "Calculate the distance between two cities in miles or kilometers. Use this when the user asks about distance between locations, how far apart cities are, or travel distances.",
    schema: z.object({
      from: z.string().describe("Starting city name, e.g., 'New York' or 'Paris'"),
      to: z.string().describe("Destination city name, e.g., 'London' or 'Tokyo'"),
      units: z
        .enum(["miles", "kilometers"])
        .optional()
        .describe("Distance unit (default: kilometers)"),
    }),
  }
);

// Tool 3: Time Zone Tool
const timeZoneTool = tool(
  async (input) => {
    // Simulated time zones (UTC offset in hours)
    const timeZones: Record<string, { offset: number; name: string }> = {
      "New York": { offset: -5, name: "EST" },
      London: { offset: 0, name: "GMT" },
      Paris: { offset: 1, name: "CET" },
      Tokyo: { offset: 9, name: "JST" },
      Sydney: { offset: 10, name: "AEST" },
      Seattle: { offset: -8, name: "PST" },
      Mumbai: { offset: 5.5, name: "IST" },
    };

    const cityTZ = timeZones[input.city];

    if (!cityTZ) {
      return `Error: Unknown city '${input.city}'. Available cities: ${Object.keys(timeZones).join(", ")}`;
    }

    // Get current UTC time
    const now = new Date();
    const utcHour = now.getUTCHours();
    const utcMinute = now.getUTCMinutes();

    // Calculate city time
    const cityHour = (utcHour + cityTZ.offset + 24) % 24;
    const formattedTime = `${cityHour.toString().padStart(2, "0")}:${utcMinute.toString().padStart(2, "0")}`;

    return `Current time in ${input.city}: ${formattedTime} ${cityTZ.name} (UTC${cityTZ.offset >= 0 ? "+" : ""}${cityTZ.offset})`;
  },
  {
    name: "timeZoneTool",
    description:
      "Get the current time in a specific city and its time zone information. Use this when the user asks what time it is somewhere, about time zones, or time differences between locations.",
    schema: z.object({
      city: z.string().describe("City name to get time for, e.g., 'Tokyo' or 'New York'"),
    }),
  }
);

async function main() {
  console.log("🌍 Multi-Tool Travel Assistant\n");
  console.log("=".repeat(80) + "\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  const modelWithTools = model.bindTools([currencyConverter, distanceCalculator, timeZoneTool]);

  // Test queries for each tool
  const queries = [
    "Convert 100 USD to EUR",
    "What's the distance between New York and London?",
    "What time is it in Tokyo right now?",
    "How many miles from Paris to Rome?",
    "Convert 50 GBP to JPY",
  ];

  for (const query of queries) {
    console.log(`\nQuery: "${query}"`);

    const response = await modelWithTools.invoke(query);

    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolCall = response.tool_calls[0];
      console.log(`  → LLM chose: ${toolCall.name}`);
      console.log(`  → Args: ${JSON.stringify(toolCall.args)}`);

      // Execute the tool
      let toolResult;
      switch (toolCall.name) {
        case "currencyConverter":
          toolResult = await currencyConverter.invoke(
            currencyConverter.schema.parse(toolCall.args)
          );
          break;
        case "distanceCalculator":
          toolResult = await distanceCalculator.invoke(
            distanceCalculator.schema.parse(toolCall.args)
          );
          break;
        case "timeZoneTool":
          toolResult = await timeZoneTool.invoke(timeZoneTool.schema.parse(toolCall.args));
          break;
        default:
          toolResult = "Unknown tool";
      }

      console.log(`  → Result: ${toolResult}`);
    } else {
      console.log(`  → Direct response: ${response.content}`);
    }

    console.log("─".repeat(80));
  }

  console.log("\n" + "=".repeat(80) + "\n");
  console.log("💡 Key Takeaways:");
  console.log("   • LLM automatically selects the right tool");
  console.log("   • Clear descriptions help tool selection");
  console.log("   • Each tool handles its domain (currency, distance, time)");
  console.log("   • Error handling provides helpful messages");
}

main().catch(console.error);
