/**
 * Token Usage Tracking Example
 * Run: npx tsx 02-chat-models/code/06-token-tracking.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "How can I track token usage across multiple API calls in a conversation?" -- should I just add usage.input_tokens, usage.output_tokens, usage.total_tokens across all calls and maintain messages[](conversation history) ?
 * - "How would I calculate the cost based on token usage?"
 */

import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

async function trackTokenUsage() {
  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  console.log("📊 Token Usage Tracking Example\n");

  // Make a request
  const response = await model.invoke("Explain what TypeScript is in 2 sentences.");

  // Extract token usage from metadata (v1 uses usage_metadata)
  const usage = response.usage_metadata;

  if (usage) {
    console.log("Token Breakdown:");
    console.log(`  Prompt tokens:     ${usage.input_tokens}`);
    console.log(`  Completion tokens: ${usage.output_tokens}`);
    console.log(`  Total tokens:      ${usage.total_tokens}`);
  } else {
    console.log("⚠️  Token usage information not available in response metadata.");
  }

  console.log("\n📝 Response:");
  console.log(response.content);
}

trackTokenUsage().catch(console.error);

/*
What's happening:

Make API call: Send a prompt to the model
Extract metadata: Get response.usage_metadata
Calculate costs: Multiply tokens by provider rates
Track spending: Monitor costs per request
*/

/*
Key insights:

Prompt tokens: Your input (question + conversation history {so we don't need to sum-up usage.input_tokens?}) 
Completion tokens: AI's output (the response)
Total tokens: Sum of both (what you pay for)
*/

/*
Cost Optimization Strategies
Two key strategies to reduce costs:

1. Limit response length with maxTokens

const model = new ChatOpenAI({
  model: process.env.AI_MODEL,
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
  maxTokens: 1000 // Cap the response length
});

2. Trim conversation history

// Keep only recent messages to reduce input tokens
const recentMessages = messages.slice(-10);
const response = await model.invoke(recentMessages);


Why it matters: Models have context window limits (4K-200K+ tokens), more tokens = higher costs and slower responses.
*/
