/**
 * Dynamic Prompt Builder
 *
 * Run: npx tsx 03-prompts-messages-outputs/samples/prompt-builder.ts
 */

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

const model = new ChatOpenAI({
  model: process.env.AI_MODEL,
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

// Modular components for composing prompts
const rolePrompts = {
  Teacher: "You are a patient teacher who explains concepts clearly to students.",
  Expert: "You are a domain expert with deep technical knowledge.",
  Friend: "You are a friendly peer having a casual conversation.",
  Professional: "You are a professional consultant providing formal advice.",
};

const stylePrompts = {
  Concise: "Keep your explanation brief and to the point (2-3 sentences).",
  Detailed: "Provide a comprehensive, detailed explanation with examples.",
  Creative: "Use analogies, metaphors, and creative explanations.",
  Technical: "Use precise technical terminology and scientific accuracy.",
};

const formatPrompts = {
  "Bullet points": "Format your response as bullet points.",
  Paragraph: "Format your response as flowing paragraphs.",
  "Step-by-step": "Format your response as numbered steps.",
  "Q&A": "Format your response as questions and answers.",
};

// The parameters below use `keyof typeof <object>` which produces {a union
// type of the object's keys}. For example, `keyof typeof rolePrompts` is
// equivalent to: "Teacher" | "Expert" | "Friend" | "Professional".
// This constrains callers to only pass one of the existing keys.
function buildTemplate(
  role: keyof typeof rolePrompts,
  style: keyof typeof stylePrompts,
  format: keyof typeof formatPrompts
) {
  const systemMessage = `${rolePrompts[role]}
${stylePrompts[style]}
${formatPrompts[format]}`;

  return ChatPromptTemplate.fromMessages([
    ["system", systemMessage],
    ["human", "{question}"],
  ]);
}

async function answerQuestion(
  question: string,
  role: keyof typeof rolePrompts,
  style: keyof typeof stylePrompts,
  format: keyof typeof formatPrompts
) {
  console.log("📝 Configuration:");
  console.log(`   Role: ${role}`);
  console.log(`   Style: ${style}`);
  console.log(`   Format: ${format}`);
  console.log("─".repeat(80));

  const template = buildTemplate(role, style, format);
  const chain = template.pipe(model);

  const result = await chain.invoke({ question });

  console.log(result.content);
  console.log("─".repeat(80) + "\n");
}

async function main() {
  console.log("🏗️  Dynamic Prompt Builder\n");
  console.log("=".repeat(80) + "\n");

  const testQuestion = "How does photosynthesis work?";

  console.log(`Question: "${testQuestion}"\n`);
  console.log("=".repeat(80) + "\n");

  // Test Combination 1: Teacher + Detailed + Step-by-step
  console.log("📚 Combination 1: Teacher + Detailed + Step-by-step\n");
  await answerQuestion(testQuestion, "Teacher", "Detailed", "Step-by-step");

  // Test Combination 2: Expert + Technical + Bullet points
  console.log("🔬 Combination 2: Expert + Technical + Bullet points\n");
  await answerQuestion(testQuestion, "Expert", "Technical", "Bullet points");

  // Test Combination 3: Friend + Concise + Paragraph
  console.log("💬 Combination 3: Friend + Concise + Paragraph\n");
  await answerQuestion(testQuestion, "Friend", "Concise", "Paragraph");

  // Test Combination 4: Professional + Creative + Q&A
  console.log("💼 Combination 4: Professional + Creative + Q&A\n");
  await answerQuestion(testQuestion, "Professional", "Creative", "Q&A");

  console.log("=".repeat(80));
  console.log("\n✅ Dynamic prompt builder demonstration complete!");
  console.log("💡 Notice how the same question gets very different responses");
  console.log("   based on the combination of role, style, and format!");
}

main().catch(console.error);
