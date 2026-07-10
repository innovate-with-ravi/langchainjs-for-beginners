/**
 * Chapter 2 Assignment Solution: Bonus Challenge
 * Token Usage Tracker
 *
 * Run: npx tsx 02-chat-models/samples/token-tracker.ts
 */

import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

// {{reusable code, just extend for multi-turn(conversation history)}} => export

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost: number;
}

export interface CallRecord {
  callNumber: number;
  query: string; // i/p
  usage: TokenUsage;
}

export class TokenTracker {
  private calls: CallRecord[] = [];
  private callCount: number = 0;

  // Pricing per 1M tokens (approximate for gpt-5-mini)
  private readonly /*constant*/ INPUT_COST_PER_MILLION = 0.15; // $0.15 per 1M input tokens
  private readonly OUTPUT_COST_PER_MILLION = 0.6; // $0.60 per 1M output tokens
  private readonly WARNING_THRESHOLD = 10000; // Warn at 10k tokens

  // public
  calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1_000_000) * this.INPUT_COST_PER_MILLION;
    const outputCost = (outputTokens / 1_000_000) * this.OUTPUT_COST_PER_MILLION;
    return inputCost + outputCost;
  }

  // instead of direct model.invoke do trackCall(model, prompt)
  async trackCall(model: ChatOpenAI, query: string): Promise<string> {
    this.callCount++;

    console.log(`\n🔄 Call #${this.callCount}: Processing...`);

    const response = await model.invoke(query);

    // Get token usage from response metadata
    const usage = (response as any).response_metadata?.usage;

    if (!usage) {
      console.log("⚠️  Token usage data not available");
      return response.content.toString();
    }

    const promptTokens = usage.prompt_tokens || 0;
    const completionTokens = usage.completion_tokens || 0;
    const totalTokens = usage.total_tokens || promptTokens + completionTokens;
    const cost = this.calculateCost(promptTokens, completionTokens);

    const callRecord: CallRecord = {
      callNumber: this.callCount,
      query,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        cost,
      },
    };

    this.calls.push(callRecord);

    // Display call info
    console.log("─".repeat(50));
    console.log(`📝 Input: "${query.substring(0, 40)}..."`);
    console.log(`  Input tokens: ${promptTokens}`);
    console.log(`  Output tokens: ${completionTokens}`);
    console.log(`  Total tokens: ${totalTokens}`);
    console.log(`  Cost: $${cost.toFixed(6)}`);

    // Check warning threshold
    const totalSessionTokens = this.getTotalTokens();
    if (totalSessionTokens > this.WARNING_THRESHOLD) {
      console.log(`\n⚠️  WARNING: Session total (${totalSessionTokens} tokens) exceeds threshold!`);
    }

    return response.content.toString();
  }

  getTotalTokens(): number {
    return this.calls.reduce((sum, call) => sum + call.usage.totalTokens, 0);
  }

  getTotalCost(): number {
    return this.calls.reduce((sum, call) => sum + call.usage.cost, 0);
  }

  displayReport(): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 TOKEN USAGE REPORT");
    console.log("=".repeat(60) + "\n");

    this.calls.forEach((call) => {
      console.log(`Call #${call.callNumber}`);
      console.log(`  Query: "${call.query.substring(0, 50)}..."`);
      console.log(`  Input: ${call.usage.promptTokens} tokens`);
      console.log(`  Output: ${call.usage.completionTokens} tokens`);
      console.log(`  Total: ${call.usage.totalTokens} tokens`);
      console.log(`  Cost: $${call.usage.cost.toFixed(6)}`);
      console.log();
    });

    console.log("=".repeat(60));
    console.log("SESSION SUMMARY");
    console.log("=".repeat(60));
    console.log(`Total Calls: ${this.calls.length}`);
    console.log(`Total Tokens: ${this.getTotalTokens().toLocaleString()}`);
    console.log(`Total Cost: $${this.getTotalCost().toFixed(6)}`);
    console.log(`Average Tokens/Call: ${Math.round(this.getTotalTokens() / this.calls.length)}`);
    console.log(`Average Cost/Call: $${(this.getTotalCost() / this.calls.length).toFixed(6)}`);

    // Breakdown
    const totalInput = this.calls.reduce((sum, call) => sum + call.usage.promptTokens, 0);
    const totalOutput = this.calls.reduce((sum, call) => sum + call.usage.completionTokens, 0);

    console.log();
    console.log("Token Breakdown:");
    console.log(
      `  Input: ${totalInput.toLocaleString()} (${((totalInput / this.getTotalTokens()) * 100).toFixed(1)}%)`
    );
    console.log(
      `  Output: ${totalOutput.toLocaleString()} (${((totalOutput / this.getTotalTokens()) * 100).toFixed(1)}%)`
    );

    console.log();
    console.log("Cost Breakdown:");
    console.log(`  Input: $${this.calculateCost(totalInput, 0).toFixed(6)}`);
    console.log(`  Output: $${this.calculateCost(0, totalOutput).toFixed(6)}`);

    console.log("=".repeat(60));
  }

  exportCSV(): string {
    let csv = "Call,Query,InputTokens,OutputTokens,TotalTokens,Cost\n";

    this.calls.forEach((call) => {
      csv += `${call.callNumber},"${call.query.replace(/"/g, '""')}",${call.usage.promptTokens},${
        call.usage.completionTokens
      },${call.usage.totalTokens},${call.usage.cost.toFixed(6)}\n`;
    });

    return csv;
  }
}

async function main() {
  console.log("📊 Token Usage Tracker\n");
  console.log("=".repeat(60) + "\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  const tracker = new TokenTracker();

  const queries = [
    "What is TypeScript?",
    "Explain async/await in JavaScript in detail",
    "Write a short example of a Node.js HTTP server",
    "What are the benefits of using React hooks?",
    "Explain the difference between SQL and NoSQL databases",
  ];

  console.log("🚀 Running test queries...");

  for (const query of queries) {
    await tracker.trackCall(model, query);
  }

  // Display final report
  tracker.displayReport();

  // Show CSV export
  console.log("\n📄 CSV Export Preview:");
  console.log(tracker.exportCSV());

  console.log("💡 Token Tracking Features:");
  console.log("   ✓ Tracks tokens per call (input, output, total)");
  console.log("   ✓ Calculates costs based on current pricing");
  console.log("   ✓ Cumulative session tracking");
  console.log("   ✓ Warning system for high usage");
  console.log("   ✓ Detailed reports and breakdowns");
  console.log("   ✓ CSV export capability");
  console.log();

  console.log("💰 Cost Optimization Tips:");
  console.log("   • Use gpt-5-mini for simple tasks");
  console.log("   • Keep prompts concise");
  console.log("   • Use streaming for better UX without extra cost");
  console.log("   • Cache responses when possible");
  console.log("   • Monitor usage regularly");
}

main().catch(console.error);
