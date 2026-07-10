/**
 * Chapter 4 Example 1: Simple Calculator Tool
 *
 * Run: npx tsx 04-function-calling-tools/code/01-simple-tool.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "Why do we need to sanitize the input expression before evaluating it?"
 * - "How does the Zod schema help with type safety in this calculator tool?"
 */

import { tool } from "langchain";
import * as z from "zod";
import { evaluate } from "mathjs";
import "dotenv/config";

// Define calculator tool
const calculatorTool = tool(
  async (input) => {
    // Use mathjs to safely evaluate mathematical expressions
    // mathjs is safer than Function() or eval() as it restricts execution to math operations
    try {
      const result = evaluate(input.expression);
      return `The result is: ${result}`;
    } catch (error) {
      return `Error evaluating expression: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
  {
    name: "calculator", // LLM(s) refer to theइ tool by this name
    description:
      "Useful for performing mathematical calculations. Use this when you need to compute numbers.",
    schema: z.object({
      expression: z.string().describe("The mathematical expression to evaluate, e.g., '25 * 4'"),
    }),
  }
);

async function main() {
  console.log("🧮 Simple Calculator Tool Demo\n");
  console.log("=".repeat(80) + "\n");

  console.log("Tool Name:", calculatorTool.name);
  console.log("Description:", calculatorTool.description);
  console.log("\nSchema:", JSON.stringify(calculatorTool.schema /*python's schema*/, null, 2));

  console.log("\n" + "=".repeat(80) + "\n");

  // Test the tool directly
  const testExpressions = ["25 * 17", "(100 + 50) / 2", "sqrt(144)"];

  for (const expr of testExpressions) {
    console.log(`\nExpression: ${expr}`);
    const result = await calculatorTool.invoke({ expression: expr });
    console.log(`Result: ${result}`);
  }

  console.log("\n" + "=".repeat(80) + "\n");
  console.log("✅ Tool created successfully!");
  console.log("\n💡 Key Takeaways:");
  console.log("   • Tools are created with tool() function");
  console.log("   • Zod schemas define parameters");
  console.log("   • Descriptions help LLMs understand when to use tools");
}

main().catch(console.error);
