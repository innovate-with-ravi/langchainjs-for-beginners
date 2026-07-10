/**
 * Challenge 4 Solution: Model Performance Comparison
 * Run: npx tsx 01-introduction/solution/model-performance.ts
 *
 * Compare different models on speed, response length, and quality.
 */

import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

const question = "Explain the difference between machine learning and deep learning.";

const models = [
  { name: "gpt-4o", description: "Most capable" },
  { name: "gpt-4o-mini", description: "Fast and efficient" },
];

interface ModelResult {
  name: string;
  time: number;
  length: number;
  response: string;
}

async function testModel(modelName: string): Promise<ModelResult> {
  const model = new ChatOpenAI({
    model: modelName,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  const startTime = Date.now();
  const response = await model.invoke(question);
  const endTime = Date.now();

  return {
    name: modelName,
    time: endTime - startTime,
    length: response.content.toString().length,
    response: response.content.toString(),
  };
}

function getQualityStars(length: number): string {
  // Simple heuristic: longer responses might be more detailed
  if (length > 400) return "⭐⭐⭐⭐⭐";
  if (length > 300) return "⭐⭐⭐⭐";
  if (length > 200) return "⭐⭐⭐";
  return "⭐⭐";
}

async function compareModels() {
  console.log("🔬 Model Performance Comparison\n");
  console.log(`Question: "${question}"\n`);
  console.log("Testing models...\n");

  const results: ModelResult[] = [];

  for (const modelInfo of models) {
    console.log(`Testing ${modelInfo.name}...`);
    const result = await testModel(modelInfo.name);
    results.push(result);

    // Small delay to avoid rate limits
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  // Display results table
  console.log("\n" + "=".repeat(80));
  console.log("📊 Results");
  console.log("=".repeat(80));
  console.log(
    `${"Model".padEnd(15)} | ${"Time".padEnd(8)} | ${"Length".padEnd(8)} | ${"Quality".padEnd(10)}`
  );
  console.log("-".repeat(80));

  for (const result of results) {
    const time = `${result.time}ms`;
    const length = `${result.length}ch`;
    const quality = getQualityStars(result.length);

    console.log(
      `${result.name.padEnd(15)} | ${time.padEnd(8)} | ${length.padEnd(8)} | ${quality.padEnd(10)}`
    );
  }

  console.log("=".repeat(80));

  // Show full responses
  console.log("\n📝 Full Responses:\n");

  for (const result of results) {
    console.log(`\n${result.name}`);
    console.log("-".repeat(80));
    console.log(result.response);
    console.log("\n");
  }

  // Analysis
  console.log("=".repeat(80));
  console.log("💡 Analysis:");
  console.log("=".repeat(80));

  const fastest = results.reduce((prev, curr) => (curr.time < prev.time ? curr : prev));
  const longest = results.reduce((prev, curr) => (curr.length > prev.length ? curr : prev));

  console.log(`⚡ Fastest: ${fastest.name} (${fastest.time}ms)`);
  console.log(`📝 Most detailed: ${longest.name} (${longest.length} characters)`);
  console.log("\n🎯 Recommendations:");
  console.log("   - Use gpt-5 for complex tasks needing detailed responses");
  console.log("   - Use gpt-5-mini for quick responses and cost efficiency");
}

compareModels().catch(console.error);
