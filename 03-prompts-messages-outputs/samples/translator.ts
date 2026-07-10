/**
 * Chapter 3 Assignment Solution: Challenge 3
 * Multi-Language Translation System
 *
 * Run: npx tsx 03-prompts-messages-outputs/samples/translator.ts
 */

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import readline from "readline";
import "dotenv/config";

const model = new ChatOpenAI({
  model: process.env.AI_MODEL,
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

// Translation template with formality support
const translationTemplate = ChatPromptTemplate.fromMessages([
  [
    "system",
    `You are a professional translator. Translate text to {target_language} with {formality} formality.
Maintain the original meaning while adapting to cultural context.`,
  ],
  [
    "human",
    `Translate this text to {target_language} ({formality} tone):

{text}

Provide only the translation, no explanations.`,
  ],
]);

const languages = {
  "1": "Spanish",
  "2": "French",
  "3": "German",
  "4": "Japanese",
  "5": "Italian",
};

const formalityLevels = {
  "1": "casual",
  "2": "formal",
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (ans) => resolve(ans));
  });
}

async function translateText(targetLanguage: string, formality: string, text: string) {
  console.log("\n🔄 Translating...\n");

  const chain = translationTemplate.pipe(model);

  const result = await chain.invoke({
    target_language: targetLanguage,
    formality: formality,
    text: text,
  });

  console.log("─".repeat(80));
  console.log(`Source (English): ${text}`);
  console.log(`Target Language: ${targetLanguage}`);
  console.log(`Formality: ${formality}`);
  console.log("─".repeat(80));
  console.log(`Translation: ${result.content}`);
  console.log("─".repeat(80) + "\n");
}

async function main() {
  console.log("🌍 Multi-Language Translation System\n");
  console.log("=".repeat(80) + "\n");

  // Check if running in CI mode
  if (process.env.CI === "true") {
    console.log("Running in CI mode - testing with sample data\n");

    // Test translation
    await translateText("Spanish", "formal", "Good morning. How can I assist you today?");

    await translateText("French", "casual", "Thanks for your help! See you later.");

    console.log("✅ Translation system working correctly!");
    rl.close();
    return;
  }

  // Interactive mode
  console.log("Select target language:");
  Object.entries(languages).forEach(([key, lang]) => {
    console.log(`  ${key}. ${lang}`);
  });
  const langChoice = await question("\nEnter choice (1-5): ");
  const targetLanguage = languages[langChoice as keyof typeof languages];

  if (!targetLanguage) {
    console.log("❌ Invalid language choice");
    rl.close();
    return;
  }

  console.log("\nSelect formality level:");
  Object.entries(formalityLevels).forEach(([key, level]) => {
    console.log(`  ${key}. ${level}`);
  });
  const formalityChoice = await question("\nEnter choice (1-2): ");
  const formality = formalityLevels[formalityChoice as keyof typeof formalityLevels];

  if (!formality) {
    console.log("❌ Invalid formality choice");
    rl.close();
    return;
  }

  const text = await question("\nEnter text to translate: ");

  if (!text.trim()) {
    console.log("❌ No text provided");
    rl.close();
    return;
  }

  await translateText(targetLanguage, formality, text);

  console.log("✅ Translation complete!");
  rl.close();
}

main().catch(console.error);
