/**
 * Chapter 5 Example: Basic Agent with Manual Loop
 *
 * NOTE: This example demonstrates the agent pattern using a manual loop implementation.
 * Compare this to the simplified createAgent() approach in the main code examples.
 * In production, you would use LangChain's built-in agent implementation.
 *
 * Run: npx tsx 05-agents/samples/basic-agent-manual-loop.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "How does an agent differ from a simple chain?"
 * - "Why does the agent loop have a maximum iteration limit?"
 * - "What happens if the agent can't answer the question?"
 */

import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, HumanMessage, ToolMessage, tool } from "langchain";
import { evaluate } from "mathjs";
import * as z from "zod";
import "dotenv/config";

// Create a calculator tool
const calculatorTool = tool(
  async (input) => {
    // Use mathjs for safe mathematical evaluation
    const result = evaluate(input.expression);
    return String(result);
  },
  {
    name: "calculator",
    description: "Perform mathematical calculations",
    schema: z.object({ expression: z.string().describe("Math expression") }),
  }
);

async function main() {
  console.log("🤖 Basic Agent Demo\n");
  console.log("=".repeat(80) + "\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  const modelWithTools = model.bindTools([calculatorTool]);

  const query = "What is 125 * 8?";
  console.log(`User: ${query}\n`);

  // Agent loop simulation
  let messages: any[] = [new HumanMessage(query)];
  let iteration = 1;
  const maxIterations = 3;

  while (iteration <= maxIterations) {
    console.log(`Iteration ${iteration}:`);

    const response = await modelWithTools.invoke(messages);

    if (!response.tool_calls || response.tool_calls.length === 0) {
      console.log(`  Final Answer: ${response.content}\n`);
      break;
    }

    // Tool call found
    const toolCall = response.tool_calls[0];
    console.log(`  Thought: I should use the ${toolCall.name} tool`);
    console.log(`  Action: ${toolCall.name}(${JSON.stringify(toolCall.args)})`);

    // Execute tool
    const toolResult = await calculatorTool.invoke(calculatorTool.schema.parse(toolCall.args));
    console.log(`  Observation: ${toolResult}\n`);

    // Add to conversation history
    messages.push(
      new AIMessage({
        content: response.content,
        tool_calls: response.tool_calls,
      }),
      new ToolMessage({
        content: String(toolResult),
        tool_call_id: toolCall.id || "",
      })
    );

    iteration++;
  }

  console.log("=".repeat(80) + "\n");
  console.log("💡 Key Concepts:");
  console.log("   • Agent follows ReAct pattern: Reason → Act → Observe");
  console.log("   • Tools extend agent capabilities");
  console.log("   • Agent iterates until it has an answer");
}

main().catch(console.error);
