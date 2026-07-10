/**
 * Prompt Composition
 * Run: npx tsx 03-prompts-messages-outputs/code/06-composition.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "How does template.partial() work and when would I use it?"
 * - "What's the benefit of composing prompts vs using one large template?"
 */

import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

async function educatorExample() {
  console.log("1️⃣  Example: Composable Educator Prompts\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  // Reusable & Composable prompt pieces
  const systemRole = "You are an expert {domain} educator.";
  const teachingContext =
    "Teaching level: {level}\nAudience: {audience}\nGoal: Clear, accurate explanations";
  const taskInstruction = "Explain {topic} in simple terms with an example.";

  // Compose them together
  const template = ChatPromptTemplate.fromMessages([
    ["system", systemRole + "\n\n" + teachingContext],
    ["human", taskInstruction],
  ]);

  const chain = template.pipe(model);

  // Scenario 1: Teaching beginners
  console.log("📚 Beginner Level:\n");
  const result1 = await chain.invoke({
    domain: "programming",
    level: "beginner",
    audience: "high school students with no coding experience",
    topic: "variables",
  });
  console.log(result1.content);

  // Scenario 2: Teaching intermediate learners
  console.log("\n" + "=".repeat(80));
  console.log("\n📚 Intermediate Level:\n");
  const result2 = await chain.invoke({
    domain: "programming",
    level: "intermediate",
    audience: "college students who know basic programming",
    topic: "closures in JavaScript",
  });
  console.log(result2.content);
}

async function customerServiceExample() {
  console.log("\n" + "=".repeat(80));
  console.log("\n2️⃣  Example: Customer Service Templates\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  // Composable pieces for customer service
  const brandVoice = "You represent {company_name}, known for {brand_personality}.";
  const servicePolicy = "Policy: {policy}\nPriority: {priority}";
  const responseGuidelines = "Always: {guidelines}";

  const template = ChatPromptTemplate.fromMessages([
    ["system", `${brandVoice}\n\n${servicePolicy}\n\n${responseGuidelines}`],
    ["human", "Customer issue: {issue}"],
  ]);

  const chain = template.pipe(model);

  // Different company scenarios using same template
  const result = await chain.invoke({
    company_name: "TechGadgets Inc.",
    brand_personality: "being helpful, friendly, and technically knowledgeable",
    policy: "30-day returns, free shipping on orders over $50",
    priority: "Customer satisfaction and quick resolution",
    guidelines: "Be empathetic, provide clear steps, offer alternatives",
    issue: "Customer received wrong item and needs replacement urgently",
  });

  console.log(result.content);
}

async function partialTemplateExample() {
  console.log("\n" + "==".repeat(40));
  console.log("\n3️⃣  Example: Partial Templates (Pre-fill Some Variables)\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  // Create a template with many variables
  const template = ChatPromptTemplate.fromMessages([
    ["system", "You are a {role} at {company} specializing in {specialty}."],
    ["human", "{task}"],
  ]);

  // Create a partial template with some values pre-filled
  const partialTemplate = await template.partial({
    role: "Technical Writer",
    company: "DevDocs Pro",
  });

  const chain = partialTemplate.pipe(model);

  // Now only need to provide remaining variables
  console.log("Pre-filled: role = Technical Writer, company = DevDocs Pro\n");

  const result1 = await chain.invoke({
    specialty: "API documentation",
    task: "Write a brief intro paragraph for a REST API guide",
  });

  console.log("API Documentation task:");
  console.log(result1.content);

  console.log("\n---\n");

  const result2 = await chain.invoke({
    specialty: "user guides",
    task: "Write a getting started section for a mobile app",
  });

  console.log("User Guide task:");
  console.log(result2.content);
}

async function main() {
  console.log("🔗 Prompt Composition Examples\n");
  console.log("=".repeat(80));

  await educatorExample();
  await customerServiceExample();
  await partialTemplateExample();

  console.log("\n" + "=".repeat(80));
  console.log("\n✅ Benefits of Composition:");
  console.log("   - Reuse prompt pieces across different scenarios");
  console.log("   - Maintain consistency in your brand voice");
  console.log("   - Easy to update - change once, affects all uses");
  console.log("   - Partial templates reduce repetitive variable passing");
}

main().catch(console.error);
