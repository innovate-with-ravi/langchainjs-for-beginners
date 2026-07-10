/**
 * Streaming Responses
 * Run: npx tsx 02-chat-models/code/02-streaming.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - {{"How does the 'for await...of' loop work with the stream?"}}
 * - "Can I collect all chunks into a single string while streaming?"
 */

import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

async function nonStreamingExample() {
  console.log("📝 Non-Streaming (traditional way):\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  const startTime = Date.now();
  const response = await model.invoke("Explain how the internet works in 2 paragraphs.");
  const endTime = Date.now();

  console.log(response.content);
  console.log(`\n⏱️  Received after: ${endTime - startTime}ms\n`);
}

async function streamingExample() {
  console.log("\n" + "=".repeat(80));
  console.log("⚡ Streaming (appears immediately):\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  const startTime = Date.now();
  let firstChunkTime = 0;

  // Stream the response chunk by chunk
  const stream = await model.stream("Explain how the internet works in 2 paragraphs.");

  for await (const chunk of stream) {
    if (firstChunkTime === 0) {
      firstChunkTime = Date.now();
    }
    // Write each chunk as it arrives (no newline)
    process.stdout.write(String(chunk.content));
  }

  const endTime = Date.now();

  console.log("\n");
  console.log(`⏱️  First chunk arrived: ${firstChunkTime - startTime}ms`);
  console.log(`⏱️  Stream completed: ${endTime - startTime}ms`);
  console.log("\n✅ Notice how streaming feels more responsive!");
}

async function main() {
  console.log("🎯 Comparing Streaming vs Non-Streaming\n");
  console.log("=".repeat(80));

  await nonStreamingExample();
  await streamingExample();

  console.log("\n💡 Key Insight:");
  console.log("   Streaming provides immediate feedback, making your app feel faster!");
}

main().catch(console.error);

// 💡 Bonus: To track token usage with streaming, some providers support streamOptions: { includeUsage: true } which includes usage metadata in the final chunk. This is provider-dependent - check your provider's documentation for availability.
