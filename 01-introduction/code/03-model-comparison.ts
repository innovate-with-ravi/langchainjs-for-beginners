/**
 * Model Comparison
 * Run: npx tsx 01-introduction/code/03-model-comparison.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "Why do we create a new ChatOpenAI instance inside the loop?" -- new client/model for each model in models[]
 * - "How can I add another model to this comparison?"
 */

import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

async function compareModels() {
  console.log("🔬 Comparing AI Models\n");

  const prompt = "Explain recursion in programming in one sentence.";
  const models = ["gpt-4o", "gpt-4o-mini"];

  for (const modelName of models) {
    console.log(`\n📊 Testing: ${modelName}`);
    console.log("─".repeat(50));

    // Override the model for this test
    const model = new ChatOpenAI({
      model: modelName,
      configuration: { baseURL: process.env.AI_ENDPOINT },
      apiKey: process.env.AI_API_KEY,
    });

    const startTime = Date.now();
    const response = await model.invoke(prompt);
    const duration = Date.now() - startTime;

    console.log(`Response: ${response.content}`);
    console.log(`⏱️  Time: ${duration}ms`);
  }

  console.log("\n✅ Comparison complete!");
  console.log("\n💡 Key Observations:");
  console.log("   - gpt-4o is more capable and detailed");
  console.log("   - gpt-4o-mini is faster and uses fewer resources");
  console.log("   - Choose based on your needs: speed vs. capability");
}

compareModels().catch(console.error);
