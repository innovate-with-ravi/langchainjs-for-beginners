/**
 * Traditional RAG System
 * Run: npx tsx 07-agentic-rag-systems/code/01a-traditional-rag.ts
 *
 * This example demonstrates the traditional "always-search" RAG pattern where
 * the system searches documents for EVERY query, even simple ones that don't
 * need retrieval. Compare this to the agentic approach in 02-agentic-rag.ts.
 *
 * Traditional RAG Pattern:
 * 1. User asks a question (ANY question)
 * 2. System ALWAYS searches the vector store
 * 3. System passes retrieved documents + question to LLM
 * 4. LLM generates answer based on retrieved context
 *
 * Problem: Searches even for "What is 2+2?" - wasting time and money!
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "Why does traditional RAG search for every query?" -- because we didn't provide a retrieval tool rather we made a createRetrievalChain chain which always first searches then send context + question (combineDocsChain) to llm
 * - "What are the cost implications of always searching?"
 */

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { createStuffDocumentsChain } from "@langchain/classic/chains/combine_documents";
import { createRetrievalChain } from "@langchain/classic/chains/retrieval";
import "dotenv/config";

async function main() {
  console.log("📖 Traditional RAG System Example\n");
  console.log("=".repeat(80) + "\n");

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

  // Knowledge base about LangChain and RAG
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

  // Create vector store and retriever
  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  const retriever = vectorStore.asRetriever({ k: 2 });

  // Create RAG prompt which is sent to llm on each query
  const prompt = ChatPromptTemplate.fromTemplate(`
Answer the question based on the following context:

{context}

Question: {input}

Answer: Provide a clear answer. If the question can be answered without the context, still try to reference it if relevant.
`);

  // Create traditional RAG chain - ALWAYS searches!

  // stuffs prompt with retrieved docs({context})
  const combineDocsChain = await createStuffDocumentsChain({
    llm: model,
    prompt, // docs = {context}
  });

  const ragChain = await createRetrievalChain({
    retriever,
    combineDocsChain,
  });

  console.log("💡 Watch how traditional RAG searches for EVERY query:\n");

  // Mix of questions - general knowledge AND document-specific
  const questions = [
    "What is the capital of France?", // General knowledge - doesn't need search!
    "When was LangChain.js released?", // Document-specific - needs search
    "What is RAG and why is it useful?", // Document-specific - needs search
  ];

  for (const question of questions) {
    console.log("=".repeat(80));
    console.log(`\n❓ Question: ${question}\n`);

    console.log("   🔍 Traditional RAG: ALWAYS searching documents...");
    const response = await ragChain.invoke({
      input: question,
    });

    console.log(`🤖 Answer: ${response.answer}`);
    console.log(`\n📄 Searched ${response.context.length} documents (even if not needed)`);
    response.context.forEach((doc: Document, i: number) => {
      console.log(`   ${i + 1}. ${doc.metadata.source}`);
    });
    console.log();
  }

  console.log("=".repeat(80));
  console.log("\n💡 Key Observations:");
  console.log("   - Traditional RAG searches on EVERY query");
  console.log("   - Even 'What is the capital of France?' triggers a search");
  console.log("   - Wastes API calls, time, and money on unnecessary searches");
  console.log("   - Simple, predictable, but inefficient");
  console.log("\n🎯 Compare to Agentic RAG (Example 2):");
  console.log("   ✓ Agent decides when to search");
  console.log("   ✓ Answers general knowledge questions directly");
  console.log("   ✓ Only searches when needed for document-specific info");
  console.log("   ✓ More efficient and cost-effective");
}

main().catch(console.error);
