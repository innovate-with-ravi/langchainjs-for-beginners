/**
 * When to Use RAG: Decision Framework Demo
 *
 * This example demonstrates the decision framework for choosing between:
 * 1. Prompt Engineering (small, static data)
 * 2. Agentic RAG (large, dynamic knowledge base with intelligent retrieval)
 *
 * Run: npx tsx 07-agentic-rag-systems/code/01-when-to-use-rag.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "How does agent decision-making improve efficiency in agentic RAG?"
 * - "What factors should I consider when choosing between RAG and prompt engineering?"
 */

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createAgent, HumanMessage, AIMessage, tool } from "langchain";
import * as z from "zod";
import "dotenv/config";

async function main() {
  console.log("🎯 When to Use RAG: Decision Framework Demo\n");
  console.log("=".repeat(80) + "\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  // ============================================================================
  // Scenario 1: Small FAQ (Use Prompt Engineering)
  // ============================================================================

  console.log("📋 SCENARIO 1: Small FAQ Bot");
  console.log("─".repeat(80));
  console.log("\nProblem: Answer 5 common questions about a product");
  console.log("Data size: 5 questions/answers (fits easily in prompt)");
  console.log("Update frequency: Rarely changes");
  console.log("\n✅ BEST APPROACH: Prompt Engineering\n");

  // Small knowledge base that fits in a prompt
  const faqContext = `
Product FAQ:
Q: What is the return policy?
A: 30-day money-back guarantee, no questions asked.

Q: How long is shipping?
A: 2-3 business days for standard, 1 day for express.

Q: Is there a warranty?
A: Yes, 1-year manufacturer warranty on all products.

Q: Do you ship internationally?
A: Yes, we ship to over 100 countries worldwide.

Q: What payment methods do you accept?
A: We accept all major credit cards, PayPal, and Apple Pay.
`;

  const faqPrompt = ChatPromptTemplate.fromMessages([
    [
      "system",
      "You are a helpful customer service assistant. Answer questions based on this FAQ:\n\n{context}",
    ],
    ["human", "{question}"],
  ]);

  const faqChain = faqPrompt.pipe(model);

  const faqQuestion = "What's your return policy?";
  console.log(`Question: "${faqQuestion}"\n`);

  const faqResponse = await faqChain.invoke({
    context: faqContext,
    question: faqQuestion,
  });

  console.log("Answer:", faqResponse.content);

  console.log("\n💡 Why Prompt Engineering works here:");
  console.log("   • Small dataset (5 Q&As) fits easily in prompt");
  console.log("   • No search needed - all context is relevant");
  console.log("   • Simple to maintain - just update the string");
  console.log("   • Fast and cost-effective");

  console.log("\n" + "=".repeat(80) + "\n");

  // ============================================================================
  // Scenario 2: Large Knowledge Base (Use RAG)
  // ============================================================================

  console.log("📚 SCENARIO 2: Company Documentation Bot");
  console.log("─".repeat(80));
  console.log("\nProblem: Answer questions from 1,000+ documentation pages");
  console.log("Data size: Too large to fit in prompt (exceeds context window)");
  console.log("Update frequency: Documentation changes frequently");
  console.log("\n✅ BEST APPROACH: Agentic RAG (Agent + Retrieval Tool)\n");

  // Simulate a large knowledge base (in reality, this would be 1000s of docs)
  const docs = [
    new Document({
      pageContent:
        "The API authentication uses OAuth 2.0 with bearer tokens. Tokens expire after 24 hours.",
      metadata: { source: "api-auth.md", category: "API" },
    }),
    new Document({
      pageContent:
        "Database migrations are handled automatically by the ORM. Use 'npm run migrate' to apply pending migrations.",
      metadata: { source: "database.md", category: "Database" },
    }),
    new Document({
      pageContent:
        "Deployment to production requires approval from two team leads. Use the GitHub Actions workflow.",
      metadata: { source: "deployment.md", category: "DevOps" },
    }),
    new Document({
      pageContent:
        "Error logging is handled by Sentry. All errors are automatically tracked and reported to the #alerts channel.",
      metadata: { source: "monitoring.md", category: "DevOps" },
    }),
    new Document({
      pageContent:
        "The frontend uses React 18 with TypeScript. All components should be functional with hooks.",
      metadata: { source: "frontend.md", category: "Frontend" },
    }),
    new Document({
      pageContent:
        "CSS styling uses Tailwind CSS. Avoid inline styles and use utility classes instead.",
      metadata: { source: "styling.md", category: "Frontend" },
    }),
    new Document({
      pageContent:
        "API rate limiting is 100 requests per minute per user. Exceeding this returns a 429 status code.",
      metadata: { source: "api-limits.md", category: "API" },
    }),
    new Document({
      pageContent:
        "User passwords are hashed using bcrypt with 12 rounds. Never store passwords in plain text.",
      metadata: { source: "security.md", category: "Security" },
    }),
  ];

  console.log("Creating vector store from documents...");
  const embeddings = new OpenAIEmbeddings({
    model: process.env.AI_EMBEDDING_MODEL || "text-embedding-3-small",
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

  // Create retrieval tool from vector store
  const retrievalTool = tool(
    async (input) => {
      const results = await vectorStore.similaritySearch(input.query, 3);
      return results.map((doc, i) => `[${doc.metadata.source}]: ${doc.pageContent}`).join("\n\n");
    },
    {
      name: "searchDocs",
      description:
        "Search company documentation for technical information about APIs, authentication, rate limits, deployment, etc.",
      schema: z.object({
        query: z.string().describe("The search query"),
      }),
    }
  );

  // Create agent with retrieval tool
  const agent = createAgent({
    model,
    tools: [retrievalTool],
  });

  const ragQuestion = "How does API authentication work?";
  console.log(`\nQuestion: "${ragQuestion}"\n`);

  const ragResponse = await agent.invoke({
    messages: [new HumanMessage(ragQuestion)],
  });

  const lastMessage = ragResponse.messages[ragResponse.messages.length - 1];
  console.log("Answer:", lastMessage.content);

  // Check if retrieval tool was used
  const toolUse = ragResponse.messages.find(
    (msg) => msg instanceof AIMessage && msg.tool_calls && msg.tool_calls.length > 0
  );
  if (toolUse) {
    console.log("\n✅ Agent decided to search documents");
    console.log("   Retrieved relevant documentation about OAuth 2.0 and bearer tokens");
  }

  console.log("\n💡 Why Agentic RAG works here:");
  console.log("   • Large dataset (1000s of docs) - can't fit in prompt");
  console.log("   • Agent decides when to search vs answer directly");
  console.log("   • Search capability - finds relevant 2 docs out of thousands");
  console.log("   • Easy to update - just add/remove documents from vector store");
  console.log("   • Source attribution - know which docs were used");
  console.log("   • Scalable - works with millions of documents");
  console.log("   • Intelligent - only searches when necessary");

  console.log("\n" + "=".repeat(80) + "\n");

  // ============================================================================
  // Scenario 3: When to Use Fine-Tuning (Not Demonstrated)
  // ============================================================================

  console.log("🎨 SCENARIO 3: Company-Specific Code Style");
  console.log("─".repeat(80));
  console.log("\nProblem: Generate code following company-specific patterns");
  console.log("Goal: Change model behavior, not add facts");
  console.log("Examples:");
  console.log("  • Always use async/await (never .then())");
  console.log("  • Specific error handling patterns");
  console.log("  • Company-specific naming conventions");
  console.log("  • Custom logging format");
  console.log("\n✅ BEST APPROACH: Fine-Tuning\n");

  console.log("💡 Why Fine-Tuning works here:");
  console.log("   • Teaching BEHAVIOR (coding style), not FACTS (documentation)");
  console.log("   • Need consistent patterns across all generated code");
  console.log("   • Examples can be collected from existing codebase");
  console.log("   • Style doesn't change frequently (worth the training cost)");

  console.log("\n❌ Why RAG wouldn't work:");
  console.log("   • RAG adds information, doesn't change how the model writes");
  console.log("   • Can't search for 'coding style' - it's a pattern, not content");
  console.log("   • Would need to retrieve style examples for every request (inefficient)");

  console.log("\n" + "=".repeat(80) + "\n");

  // ============================================================================
  // Decision Framework Summary
  // ============================================================================

  console.log("🎓 DECISION FRAMEWORK SUMMARY");
  console.log("─".repeat(80) + "\n");

  console.log("Step 1: Does your information fit in a prompt (< 8,000 tokens)?");
  console.log("  ✅ YES → Use PROMPT ENGINEERING (Scenario 1)");
  console.log("  ❌ NO  → Continue to Step 2\n");

  console.log("Step 2: Do you need to ADD INFORMATION or CHANGE BEHAVIOR?");
  console.log("  📚 Add information → Use RAG (Scenario 2)");
  console.log("  🎨 Change behavior → Use FINE-TUNING (Scenario 3)\n");

  console.log("Step 3: Does your information update frequently?");
  console.log("  ✅ YES → Definitely use RAG (easy to update)");
  console.log("  ❌ NO  → Either works, but RAG is cheaper\n");

  console.log("Step 4: Do you need to cite sources?");
  console.log("  ✅ YES → Use RAG (tracks source documents)");
  console.log("  ❌ NO  → Either approach works\n");

  console.log("=".repeat(80) + "\n");

  console.log("📋 Quick Reference:");
  console.log("─".repeat(80));
  console.log("\nPrompt Engineering:");
  console.log("  • Best for: Small, static data (< 8K tokens)");
  console.log("  • Example: FAQ bot with 5-10 questions");
  console.log("  • Pros: Simple, fast, cheap");
  console.log("  • Cons: Doesn't scale, hard to update large datasets\n");

  console.log("RAG (Retrieval Augmented Generation):");
  console.log("  • Best for: Large, searchable knowledge bases");
  console.log("  • Example: 1000+ documentation pages");
  console.log("  • Pros: Scalable, easy updates, source attribution");
  console.log("  • Cons: Requires vector store, retrieval overhead\n");

  console.log("Fine-Tuning:");
  console.log("  • Best for: Changing model behavior/style");
  console.log("  • Example: Company-specific code generation");
  console.log("  • Pros: Changes how model writes/reasons");
  console.log("  • Cons: Expensive, slow, hard to update\n");

  console.log("=".repeat(80));
  console.log("\n✅ In this course, we focus on RAG because it's the most versatile");
  console.log("   approach for building production AI applications with custom data!");
}

main().catch(console.error);
