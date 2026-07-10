/**
 * Multiple Template Formats
 * Run: npx tsx 03-prompts-messages-outputs/code/04-template-formats.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "When should I use ChatPromptTemplate vs PromptTemplate?"
 * - "How does stringTemplate.format() differ from using pipe and invoke?"
 * - "What is ChatPromptTemplate.fromTemplate() & how it works?"
 * - "What is PromptTemplate.fromExamples() & how it works?"
 */

import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

async function main() {
  console.log("🎨 Template Formats Example\n");
  console.log("=".repeat(80));

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  // Format 1: ChatPromptTemplate {{(structured messages)}}
  console.log("\n1️⃣  ChatPromptTemplate {{(Recommended for chat models)}}:\n");

  const chatTemplate = ChatPromptTemplate.fromMessages([
    ["system", "You are a {role} who speaks in {style} style."],
    ["human", "{question}"],
  ]);

  // fromTemplate() creates a chat template from a simple string
  const template = ChatPromptTemplate.fromTemplate(
    "You are a helpful assistant. Answer this: {question}"
  );

  const chain = template.pipe(model);

  const result = await chain.invoke({
    question: "What is TypeScript?",
  });

  console.log(result.content);

  const chain1 = chatTemplate.pipe(model);

  const result1 = await chain1.invoke({
    role: "pirate captain",
    style: "dramatic and adventurous",
    question: "What is TypeScript?",
  });

  console.log("Pirate response:");
  console.log(result1.content);

  // Format 2: PromptTemplate (simple string-based)
  console.log("\n" + "=".repeat(80));
  console.log("\n2️⃣  PromptTemplate (Simple string format):\n");

  const stringTemplate = PromptTemplate.fromTemplate("Write a {adjective} {item} about {topic}.");

  // Format the template to see the final prompt
  const formattedPrompt = await stringTemplate.format({
    adjective: "funny",
    item: "limerick",
    topic: "JavaScript developers",
  });

  console.log("Generated prompt:", formattedPrompt);

  const result2 = await model.invoke(formattedPrompt);
  console.log("\nResponse:");
  console.log(result2.content);

  // Format 3: Multiple variables
  console.log("\n" + "=".repeat(80));
  console.log("\n3️⃣  Complex Template with Many Variables:\n");

  const complexTemplate = ChatPromptTemplate.fromMessages([
    ["system", "You are a {job_title} at {company} writing to a {recipient_role}."],
    ["human", "Write a {message_type} about {topic}. Tone: {tone}"],
  ]);

  const chain3 = complexTemplate.pipe(model);

  const result3 = await chain3.invoke({
    job_title: "Senior Developer",
    company: "TechCorp",
    recipient_role: "Product Manager",
    message_type: "brief update",
    topic: "API migration progress",
    tone: "professional but friendly",
  });

  console.log(result3.content);

  // fromExamples() builds a few-shot prompt from examples
  const examples = [
    `input: "happy", output: "😊"`,
    `input: "sad", output: "😢"`,
    `input: "excited", output: "🎉"`,
  ];

  // Create template that includes the examples
  const egTemplate = PromptTemplate.fromExamples(
    examples,
    "Translate the word {word} to an emoji." /*suffix*/,
    ["word"],
    "\n"
  );

  const egformattedPrompt = await egTemplate.format({ word: "angry" });
  console.log("Formatted few-shot prompt:");
  console.log(egformattedPrompt);

  const egresult = await model.invoke(egformattedPrompt);
  console.log("\nModel response:", egresult.content);

  console.log("\n" + "=".repeat(80));
  console.log("\n✅ Key Takeaways:");
  console.log("   - ChatPromptTemplate: Best for multi-message conversations");
  console.log("   - PromptTemplate: Good for simple single-string prompts");
  console.log("   - Both support multiple variables with {variable} syntax");
  console.log("   - Use .pipe(model) to create chains");
}

main().catch(console.error);
