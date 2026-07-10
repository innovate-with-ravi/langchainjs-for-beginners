/**
 * Model Parameters
 * Run: npx tsx 02-chat-models/code/03-parameters.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "What temperature value should I use for a customer service chatbot?"  -- 0 to give deterministic (same) responses
 * - "How do I add the maxTokens parameter to limit response length?"
 */

import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

async function temperatureComparison() {
  console.log(`🌡️  Temperature Comparison for ${process.env.AI_MODEL}\n`);
  console.log("=".repeat(80));

  const prompt = "Write a creative opening line for a sci-fi story about time travel.";
  const isCI = process.env.CI === "true";
  const temperatures = isCI ? [0, 1] : [0, 1, 2]; // Reduce temperatures in CI mode
  const tries = isCI ? 1 : 2; // Reduce tries in CI mode

  for (const temp of temperatures) {
    console.log(`\nTemperature: ${temp}`);
    console.log("-".repeat(80));

    const model = new ChatOpenAI({
      model: process.env.AI_MODEL,
      configuration: { baseURL: process.env.AI_ENDPOINT },
      apiKey: process.env.AI_API_KEY,
      temperature: temp,
    });

    try {
      for (let i = 1; i <= tries; i++) {
        const response = await model.invoke(prompt);
        console.log(`  Try ${i}: ${response.content}`);
      }
    } catch (error: any) {
      // Some models (like gpt-5-mini) may not support certain temperature values
      if (error.code === "unsupported_value" && error.param === "temperature") {
        console.log(`  ⚠️  This model doesn't support temperature=${temp}. Skipping...`);
        console.log(`  💡 Error: ${error.message}`);
      } else {
        // Re-throw unexpected errors
        throw error;
      }
    }
  }

  console.log("\n💡 General Temperature Guidelines:");
  console.log("   - Lower values (0-0.3): More deterministic, consistent responses");
  console.log("   - Medium values (0.7-1.0): Balanced creativity and consistency");
  console.log("   - Higher values (1.5-2.0): More creative and varied responses");
  console.log("\n⚠️  Note: Model support varies - some models only support specific values");
  console.log("   For example, gpt-5-mini only supports temperature=1 (default)");
}

async function maxTokensExample() {
  console.log("\n\n📏 Max Tokens Limit\n");
  console.log("=".repeat(80));

  const prompt = "Write a detailed explanation of machine learning in 5 paragraphs.";

  const isCI = process.env.CI === "true";
  const tokenLimits = isCI ? [150] : [50, 150, 500]; // Reduce in CI mode

  for (const maxTokens of tokenLimits) {
    console.log(`\nMax Tokens: ${maxTokens}`);
    console.log("-".repeat(80));

    const model = new ChatOpenAI({
      model: process.env.AI_MODEL,
      configuration: { baseURL: process.env.AI_ENDPOINT },
      apiKey: process.env.AI_API_KEY,
      maxTokens: maxTokens,
    });

    try {
      const response = await model.invoke(prompt);
      console.log(response.content);
      console.log(`\n(Character count: ${response.content.toString().length})`);
    } catch (error: any) {
      if (error.code === "unsupported_value") {
        console.log(`  ⚠️  This model doesn't support maxTokens=${maxTokens}. Skipping...`);
        console.log(`  💡 Error: ${error.message}`);
      } else {
        throw error;
      }
    }
  }

  console.log("\n💡 Observations:");
  console.log("   - Lower max tokens = shorter responses");
  console.log("   - Response may be cut off if limit is too low");
  console.log("   - Use max tokens to control costs and response length");
}

async function main() {
  console.log("🎛️  Model Parameters Tutorial\n");

  await temperatureComparison();
  await maxTokensExample();

  console.log("\n\n✅ Summary:");
  console.log("   - Lower temperatures: Consistent, factual responses");
  console.log("   - Higher temperatures: Creative, varied responses");
  console.log("   - maxTokens: Control response length and costs");
  console.log("   - Always check your model's supported parameter ranges");
}

main().catch(console.error);
