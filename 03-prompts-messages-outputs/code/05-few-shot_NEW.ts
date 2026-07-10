/**
 * Few-Shot Prompting
 * Run: npx tsx 03-prompts-messages-outputs/code/05-few-shot.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "How many examples should I provide for effective few-shot prompting?"
 * - "Can I dynamically select which examples to include based on the input?" -- exampleSelector: function()
 */

import { ChatPromptTemplate, FewShotChatMessagePromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

async function emotionToEmojiExample() {
  console.log("1️⃣  Example: Emotion to Emoji Converter\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  // always give egs[] in {inp:"human" , oup:"ai"}
  const examples = [
    { input: "happy", output: "😊" },
    { input: "sad", output: "😢" },
    { input: "excited", output: "🎉" },
    { input: "angry", output: "😠" },
  ];

  // // Create example template
  // const exampleTemplate = ChatPromptTemplate.fromMessages([
  //   ["human", "{input}"],
  //   ["ai", "{output}"],
  // ]);

  // // Create few-shot template
  // const fewShotTemplate = new FewShotChatMessagePromptTemplate({
  //   examplePrompt: exampleTemplate,
  //   exampleSeparator: "\n",
  //   examples: examples,
  //   inputVariables: [],
  //   prefix: "Examples",
  // });

  // console.log(fewShotTemplate.format([]));

  // Create example template
  const exampleTemplate = ChatPromptTemplate.fromMessages([
    ["human", "{input}"],
    ["ai", "{output}"],
  ]);

  // Create few-shot template
  const fewShotTemplate = new FewShotChatMessagePromptTemplate({
    examplePrompt: exampleTemplate,
    examples: examples,
    inputVariables: [],
  });

  // Combine with the final question
  const finalTemplate = ChatPromptTemplate.fromMessages([
    ["system", "Convert emotions to emojis based on these examples:"],
    // Type assertion needed: TypeScript type system limitation with message unions, not a v1 API issue
    // The functionality works correctly - FewShotChatMessagePromptTemplate is fully compatible at runtime
    fewShotTemplate as any,
    ["human", "{input}"],
  ]);

  const chain = finalTemplate.pipe(model);
  const testEmotions = ["surprised", "confused", "tired", "proud"];

  for (const emotion of testEmotions) {
    const result = await chain.invoke({ input: emotion });
    console.log(`${emotion} → ${result.content}`);
  }
}

async function codeCommentExample() {
  console.log("\n" + "=".repeat(80));
  console.log("\n2️⃣  Example: Code Comment Generator\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  // Examples of code → comment pairs
  const examples = [
    {
      code: "const sum = (a, b) => a + b;",
      comment: "// Adds two numbers and returns the result",
    },
    {
      code: "const users = data.filter(u => u.active);",
      comment: "// Filters the data array to only include active users",
    },
    {
      code: "await db.save(record);",
      comment: "// Saves the record to the database asynchronously",
    },
  ];

  const exampleTemplate = ChatPromptTemplate.fromMessages([
    ["human", "Code: {code}"],
    ["ai", "{comment}"],
  ]);

  const fewShotTemplate = new FewShotChatMessagePromptTemplate({
    examplePrompt: exampleTemplate,
    examples: examples,
    inputVariables: [],
  });

  const finalTemplate = ChatPromptTemplate.fromMessages([
    ["system", "Generate clear, concise comments for code based on these examples:"],
    // Type assertion needed: TypeScript type system limitation with message unions, not a v1 API issue
    // The functionality works correctly - FewShotChatMessagePromptTemplate is fully compatible at runtime
    fewShotTemplate as any,
    ["human", "Code: {code}"],
  ]);

  const chain = finalTemplate.pipe(model);
  const testCode = [
    "const sorted = items.sort((a, b) => a.price - b.price);",
    "if (user.role === 'admin') return true;",
  ];

  for (const code of testCode) {
    const result = await chain.invoke({ code });
    console.log(`Code: ${code}`);
    console.log(`${result.content}\n`);
  }
}

async function main() {
  console.log("💡 Few-Shot Prompting Examples\n");
  console.log("=".repeat(80));

  await emotionToEmojiExample();
  await codeCommentExample();

  console.log("=".repeat(80));
  console.log("\n✅ Few-shot prompting teaches AI by example");
  console.log("💡 More reliable than just instructions alone");
  console.log("🎯 Great for teaching specific formats or styles");
}

main().catch(console.error);
