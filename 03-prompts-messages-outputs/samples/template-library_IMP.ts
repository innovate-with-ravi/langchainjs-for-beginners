/**
 * Prompt Template Library
 *
 * Run: npx tsx 03-prompts-messages-outputs/samples/template-library.ts
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

// Template Library
const templates = {
  codeExplainer: {
    name: "Code Explainer",
    description: "Explains code snippets in plain English",
    variables: ["code", "language"],
    template: ChatPromptTemplate.fromMessages([
      ["system", "You are a programming instructor. Explain code clearly to beginners."],
      [
        "human",
        // .md text
        `Explain this {language} code:

\`\`\`{language}
{code}
\`\`\`

Describe what it does, how it works, and any key concepts.`,
      ],
    ]),
  },

  summarizer: {
    name: "Text Summarizer",
    description: "Creates concise summaries of long text",
    variables: ["text", "length"],
    template: ChatPromptTemplate.fromMessages([
      ["system", "You are a professional summarizer. Create clear, {length} summaries."],
      ["human", "Summarize this text:\n\n{text}"],
    ]),
  },

  creativeWriter: {
    name: "Creative Writing Prompt", // set the model's temp to 1.0+
    description: "Generates creative writing based on prompts",
    variables: ["genre", "theme", "length"],
    template: ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a creative writer. Write {length} {genre} stories that are engaging and well-crafted.",
      ],
      ["human", "Write a story about: {theme}"],
    ]),
  },

  dataFormatter: {
    name: "Data Formatter",
    description: "Formats data into specific structures",
    variables: ["data", "format"],
    template: ChatPromptTemplate.fromMessages([
      [
        "system",
        "You are a data formatting expert. Convert data to {format} format with proper structure.",
      ],
      ["human", "Format this data:\n\n{data}"],
    ]),
  },

  questionAnswerer: {
    name: "Question Answerer",
    description: "Answers questions with specific expertise",
    variables: ["question", "expertise"],
    template: ChatPromptTemplate.fromMessages([
      ["system", "You are an expert in {expertise}. Provide accurate, detailed answers."],
      ["human", "{question}"],
    ]),
  },
};

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// automatically async as func returning Promise is async
function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function listTemplates() {
  console.log("\n📚 Available Templates:\n");

  // Object.entries(objects)-> returns an array of objects
  Object.entries(templates).forEach(([key, template], index) => {
    console.log(`${index + 1}. ${template.name}`);
    console.log(`   ${template.description}`);
    console.log(`   Variables: ${template.variables.join(", ")}\n`);
  });
}

async function executeTemplate(templateKey: string, variables: Record<string, string>) {
  const tmpl = templates[templateKey as keyof typeof templates];

  console.log("\n🔄 Processing...\n");
  console.log("─".repeat(80));

  const chain = tmpl.template.pipe(model);
  const result = await chain.invoke(variables);

  console.log(result.content);
  console.log("─".repeat(80) + "\n");
}

async function main() {
  console.log("📚 Prompt Template Library\n");
  console.log("=".repeat(80));

  // Check if running in CI mode
  if (process.env.CI === "true") {
    console.log("\nRunning in CI mode - testing templates\n");

    // Test Code Explainer
    console.log("Testing Code Explainer Template:");
    await executeTemplate("codeExplainer", {
      code: "const sum = (a, b) => a + b;",
      language: "JavaScript",
    });

    // Test Summarizer
    console.log("Testing Summarizer Template:");
    await executeTemplate("summarizer", {
      text: "Artificial intelligence is transforming the world. Machine learning enables computers to learn from data without explicit programming. Deep learning uses neural networks to solve complex problems.",
      length: "brief",
    });

    console.log("✅ Template library working correctly!");
    rl.close();
    return;
  }

  // Interactive mode
  listTemplates();

  const templateKeys = Object.keys(templates);
  const choice = await question("Select template (1-5): ");
  const templateIndex = parseInt(choice) - 1;

  if (templateIndex < 0 || templateIndex >= templateKeys.length) {
    console.log("❌ Invalid choice");
    rl.close();
    return;
  }

  const templateKey = templateKeys[templateIndex];
  const tmpl = templates[templateKey as keyof typeof templates];

  console.log(`\n✅ Selected: ${tmpl.name}\n`);

  // Collect variables
  const variables: Record<string, string> = {};

  for (const variable of tmpl.variables) {
    const value = await question(`Enter ${variable}: `);
    variables[variable] = value;
  }

  await executeTemplate(templateKey, variables);

  console.log("✅ Complete!");
  rl.close();
}

main().catch(console.error);
