/**
 * Agentic RAG System
 * Run: npx tsx 07-agentic-rag-systems/code/02-agentic-rag.ts
 *
 * This example demonstrates the modern agentic RAG pattern where an AI agent
 * intelligently decides when to search your documents vs. answering directly
 * from its general knowledge. Unlike traditional RAG that always searches,
 * agentic RAG gives your AI autonomy to determine whether retrieval is necessary.
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "How does the agent decide when to use the retrieval tool vs answering directly?" -- my assumption: maybe the llm learns about retrieval tool from its description & schema etc..
 * - "How would I add metadata filtering to the retrieval tool?"
 */

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { createAgent, HumanMessage, tool } from "langchain";
import * as z from "zod";
import "dotenv/config";

async function main() {
  console.log("🤖 Agentic RAG System Example\n");

  // 1. Setup embeddings and model
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

  // 2. Create knowledge base about LangChain and RAG
  const docs = [
    new Document({
      pageContent:
        "LangChain.js was released in 2023 as the JavaScript/TypeScript port of the Python LangChain library. It enables developers to build LLM-powered applications using familiar web technologies.",
      metadata: { source: "langchain-history", topic: "introduction" },
    }),
    new Document({
      pageContent:
        "RAG (Retrieval Augmented Generation) combines document retrieval with LLM generation. It allows models to access external knowledge without retraining, making responses more accurate and up-to-date.",
      metadata: { source: "rag-explanation", topic: "concepts" },
    }),
    new Document({
      pageContent:
        "Vector stores like Pinecone, Weaviate, and Chroma enable semantic search over documents. They store embeddings and perform fast similarity searches to find relevant content.",
      metadata: { source: "vector-stores", topic: "infrastructure" },
    }),
    new Document({
      pageContent:
        "LangChain supports multiple document loaders for PDFs, web pages, databases, and APIs. Text splitters help break large documents into chunks that fit within LLM context windows while preserving semantic meaning.",
      metadata: { source: "document-processing", topic: "development" },
    }),
  ];

  console.log(`📚 Creating vector store with ${docs.length} documents...\n`);

  // 3. Create vector store
  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

  // 4. Create retrieval tool from vector store
  // The agent will decide when to use this tool based on the question
  const retrievalTool = tool(
    async (input) => {
      console.log(`   🔍 Agent is searching for: "${input.query}"`);

      const results = await vectorStore.similaritySearch(input.query, 2);
      return results.map((doc) => `[${doc.metadata.source}]: ${doc.pageContent}`).join("\n\n");
    },
    {
      name: "searchLangChainDocs",
      description:
        "Search LangChain documentation for specific information about LangChain.js, RAG systems, vector stores, and document processing. Use this when you need factual information from the LangChain knowledge base.",

      schema: z.object({
        query: z.string().describe("The search query to find relevant LangChain documentation"),
      }),
    }
  );

  // 5. Create agent with retrieval tool
  // The agent will autonomously decide when to search vs answer directly
  const agent = createAgent({
    model,
    tools: [retrievalTool],
  });

  // 6. Ask different types of questions to see agent decision-making
  const questions = [
    // General knowledge - agent should answer directly without searching
    "What is the capital of France?",

    // Document-specific questions - agent should use the retrieval tool
    "When was LangChain.js released?",
    "What is RAG and why is it useful?",
  ];

  console.log("💡 Watch how the agent decides when to search vs answer directly:\n");

  for (const question of questions) {
    console.log("=".repeat(80));
    console.log(`\n❓ Question: ${question}\n`);

    const response = await agent.invoke({
      messages: [new HumanMessage(question)],
    });

    // The agent's final response
    const finalMessage = response.messages[response.messages.length - 1];
    console.log("🤖 Answer:", finalMessage.content);
    console.log();
  }

  console.log("=".repeat(80));
  console.log("\n💡 Key Observations:");
  console.log("   - Agent answers general knowledge questions directly (no search)");
  console.log("   - Agent uses retrieval tool for document-specific questions");
  console.log("   - Agent autonomously decides WHEN to search based on context");
  console.log("   - More efficient than traditional RAG that always searches");
  console.log("\n🎯 Agentic RAG Benefits:");
  console.log("   ✓ Reduced API calls (only searches when needed)");
  console.log("   ✓ Faster responses for general knowledge questions");
  console.log("   ✓ Better user experience with intelligent decision-making");
  console.log("   ✓ Scalable to multiple retrieval sources and tools");
}

main().catch(console.error);
