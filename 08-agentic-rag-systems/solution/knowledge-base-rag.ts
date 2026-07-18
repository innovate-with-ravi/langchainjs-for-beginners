/**
 * Chapter 7 Assignment Solution: Challenge 1
 * Personal Knowledge Base Q&A (Agentic RAG)
 *
 * Run: npx tsx 07-agentic-rag-systems/solution/knowledge-base-rag.ts
 */

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { createAgent, HumanMessage, tool } from "langchain";
import * as z from "zod";
import "dotenv/config";

// Sample knowledge base - you can replace with your own documents
const knowledgeBase = [
  new Document({
    pageContent:
      "TypeScript is a typed superset of JavaScript that compiles to plain JavaScript. It adds optional static typing, classes, and interfaces to JavaScript, making it easier to build and maintain large-scale applications.",
    metadata: { title: "TypeScript Basics", source: "my-notes" },
  }),
  new Document({
    pageContent:
      "React hooks like useState and useEffect allow functional components to have state and side effects. useState returns a state variable and a setter function, while useEffect runs side effects after render.",
    metadata: { title: "React Hooks", source: "my-notes" },
  }),
  new Document({
    pageContent:
      "Docker containers package applications with their dependencies, ensuring consistent behavior across environments. Containers are lightweight, portable, and share the host OS kernel, making them more efficient than virtual machines.",
    metadata: { title: "Docker Containers", source: "my-notes" },
  }),
  new Document({
    pageContent:
      "REST APIs follow principles like statelessness, client-server architecture, and uniform interface. HTTP methods (GET, POST, PUT, DELETE) map to CRUD operations. Status codes indicate request outcomes.",
    metadata: { title: "REST API Design", source: "my-notes" },
  }),
  new Document({
    pageContent:
      "Git branching strategies like Git Flow and trunk-based development help teams manage code changes. Feature branches isolate work, pull requests enable code review, and merge commits preserve history.",
    metadata: { title: "Git Workflows", source: "my-notes" },
  }),
  new Document({
    pageContent:
      "Node.js event loop handles asynchronous operations efficiently. The call stack executes synchronous code, while the callback queue holds async callbacks. The event loop moves callbacks to the stack when it's empty.",
    metadata: { title: "Node.js Event Loop", source: "my-notes" },
  }),
  new Document({
    pageContent:
      "Database indexing improves query performance by creating data structures that allow fast lookups. B-tree indexes work well for range queries, while hash indexes excel at equality comparisons. Over-indexing can slow writes.",
    metadata: { title: "Database Indexing", source: "my-notes" },
  }),
];

async function main() {
  console.log("📚 Personal Knowledge Base Q&A (Agentic RAG)\n");
  console.log("=".repeat(80) + "\n");

  // 1. Setup
  const embeddings = new OpenAIEmbeddings({
    model: process.env.AI_EMBEDDING_MODEL || "text-embedding-3-small",
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  console.log(`Creating vector store with ${knowledgeBase.length} documents...\n`);

  // 2. Create vector store
  const vectorStore = await MemoryVectorStore.fromDocuments(knowledgeBase, embeddings);

  // 3. Create retrieval tool for the agent
  const searchKnowledgeBase = tool(
    async (input) => {
      console.log(`   🔍 Agent searching for: "${input.query}"`);
      const results = await vectorStore.similaritySearch(input.query, 3);

      if (results.length === 0) {
        return "No relevant information found in the knowledge base.";
      }

      return results.map((doc) => `[${doc.metadata.title}]: ${doc.pageContent}`).join("\n\n");
    },
    {
      name: "searchMyNotes",
      description:
        "Search my personal knowledge base for information about TypeScript, React, Docker, REST APIs, Git, Node.js, and databases. Use this when you need specific technical information from my notes.",
      schema: z.object({
        query: z.string().describe("The search query to find relevant information from my notes"),
      }),
    }
  );

  // 4. Create agent with retrieval tool
  const agent = createAgent({
    model,
    tools: [searchKnowledgeBase],
  });

  // 5. Test with mix of questions
  const questions = [
    // General knowledge - agent should answer directly
    "What is 2 + 2?",
    "What is the capital of France?",

    // Knowledge base questions - agent should search
    "What is TypeScript?",
    "How does the Node.js event loop work?",
    "What are the benefits of Docker containers?",

    // Not in knowledge base - agent may search but won't find
    "What is Python?",
  ];

  console.log("💡 Testing agent with different types of questions:\n");
  console.log("Watch how the agent intelligently decides when to search vs answer directly!\n");

  for (const question of questions) {
    console.log("=".repeat(80));
    console.log(`\n❓ Question: ${question}\n`);

    const response = await agent.invoke({
      messages: [new HumanMessage(question)],
    });

    const finalMessage = response.messages[response.messages.length - 1];
    console.log("🤖 Answer:", finalMessage.content);
    console.log();
  }

  console.log("=".repeat(80));
  console.log("\n✅ Key Observations:");
  console.log("   - Agent answers general knowledge questions directly (no search needed)");
  console.log("   - Agent searches knowledge base for technical questions");
  console.log("   - Agent decides WHEN to search based on question context");
  console.log("   - More efficient than always searching!");
  console.log("\n💡 This is the power of Agentic RAG - intelligent, autonomous retrieval!");
}

main().catch(console.error);
