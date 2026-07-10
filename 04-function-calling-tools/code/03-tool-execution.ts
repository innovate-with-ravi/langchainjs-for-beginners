/**
 * Chapter 4 Example 3: Complete Tool Execution Loop
 *
 * Run: npx tsx 04-function-calling-tools/code/03-tool-execution.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "Why do we need to send tool results back to the LLM in step 3?"
 * - "How would I handle errors that occur during tool execution?"
 */

import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, tool, ToolMessage } from "langchain";
import * as z from "zod";
import "dotenv/config";

const weatherTool = tool(
  async (input) => {
    // Simulate API call
    const temps = { Seattle: 62, Paris: 18, Tokyo: 24, London: 14, Sydney: 26 };
    const temp = temps[input.city as keyof typeof temps] || 72;
    return `Current temperature in ${input.city}: ${temp}°F, partly cloudy`;
  },
  {
    name: "getWeather",
    description: "Get current weather for a city",
    schema: z.object({
      city: z.string().describe("City name"),
    }),
  }
);

async function main() {
  console.log("🔄 Complete Tool Execution Loop\n");
  console.log("=".repeat(80) + "\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  const modelWithTools = model.bindTools([weatherTool]);

  const query = "What's the weather in Seattle?";
  console.log(`User: ${query}\n`);

  // ============================================================================
  // STEP 1: LLM GENERATES TOOL CALL (Planning)
  // ============================================================================
  // The LLM's role: Analyze the request and decide which tool to call
  // Important: The LLM does NOT execute anything - it just generates a plan!

  console.log("=== STEP 1: LLM GENERATES TOOL CALL ===");
  console.log("(The LLM's role: Planning - decides WHAT to do)\n");

  const response1 = await modelWithTools.invoke([new HumanMessage(query)]);

  if (!response1.tool_calls || response1.tool_calls.length === 0) {
    console.log("No tool calls generated");
    return;
  }

  const toolCall = response1.tool_calls[0];
  console.log("✅ LLM decided to call:", toolCall.name);
  console.log("   With arguments:", JSON.stringify(toolCall.args, null, 2));
  console.log("   Tool call ID:", toolCall.id);
  console.log("\n💡 Note: The LLM only DESCRIBED what to do - it didn't execute anything!\n");

  // ============================================================================
  // STEP 2: YOUR CODE EXECUTES THE TOOL (Doing)
  // ============================================================================
  // Your code's role: Actually execute the function and get real results
  // This is where the real work happens - API calls, database queries, etc.

  console.log("=== STEP 2: YOUR CODE EXECUTES THE TOOL ===");
  console.log("(Your code's role: Doing - actually performs the action)\n");

  const toolResult = await weatherTool.invoke(weatherTool.schema.parse(toolCall.args));
  console.log("✅ Tool executed successfully!");
  console.log("   Real result:", toolResult);
  console.log("\n💡 Note: This is where the actual API call/database query happens!\n");

  // ============================================================================
  // STEP 3: SEND RESULTS BACK TO LLM (Communicating)
  // ============================================================================
  // The LLM's role again: Receive results and formulate a natural response
  // The LLM converts raw data into human-friendly language

  console.log("=== STEP 3: SEND RESULTS BACK TO LLM ===");
  console.log(
    "(The LLM's role: Communicating - converts raw data(tool_result) to natural language)\n"
  );

  const messages = [
    new HumanMessage(query),
    new AIMessage({
      content: response1.content,
      tool_calls: response1.tool_calls,
    }),
    new ToolMessage({
      content: String(toolResult),
      tool_call_id: toolCall.id || "",
    }),
  ];

  const finalResponse = await model.invoke(messages);
  console.log("✅ LLM generated final response:");
  console.log("  ", finalResponse.content);

  console.log("\n" + "=".repeat(80) + "\n");
  console.log("🎓 Key Takeaways:");
  console.log("─".repeat(80));
  console.log("\n1. Three-Step Process:");
  console.log("   • Step 1: LLM generates tool call (Planning)");
  console.log("   • Step 2: Your code executes tool (Doing)");
  console.log("   • Step 3: LLM receives results (Communicating)");
  console.log("\n2. Separation of Concerns:");
  console.log("   • LLM handles: Understanding user intent + Natural language response");
  console.log("   • Your code handles: Actual execution + Security + Validation");
  console.log("\n3. Why This Matters:");
  console.log("   • Security: You control what actually gets executed");
  console.log("   • Flexibility: Switch implementations without retraining LLM");
  console.log("   • Reliability: Handle errors, retries, and edge cases");
  console.log("\n✅ The LLM never executes functions - it only describes what to do!");
}

main().catch(console.error);

/*
## How to handle tool execution errors

You should wrap tool execution in a safe error-handling path and return a structured error message to the model.

Example:

```ts
try {
  const toolResult = await weatherTool.invoke(
    weatherTool.schema.parse(toolCall.args)
  );

  console.log("Tool executed successfully:", toolResult);
} catch (error) {
  console.error("Tool execution failed:", error);

  const errorMessage =
    error instanceof Error ? error.message : "Unknown tool error";

  // Send a useful failure message back to the LLM
  const messages = [
    new HumanMessage(query),
    new AIMessage({
      content: response1.content,
      tool_calls: response1.tool_calls,
    }),
    new ToolMessage({
      content: `Tool execution failed: ${errorMessage}`,
      tool_call_id: toolCall.id || "",
    }),
  ];

  const finalResponse = await model.invoke(messages);
  console.log(finalResponse.content);
}
```

## Best practice

A good pattern is:

- validate arguments before running the tool
- catch exceptions
- return a clear error string
- let the LLM respond gracefully instead of crashing

So the model doesn’t need to “know” the implementation details — it just needs a reliable result or a useful failure message.
*/
