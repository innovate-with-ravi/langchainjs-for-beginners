/**
 * Working with Metadata
 * Run: npx tsx 07-documents-embeddings-semantic-search/code/04-metadata.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "How can I filter search results by metadata values like category or date?"
 * - "Can I add custom metadata after documents are loaded?"
 */

import { DirectoryLoader } from "@langchain/classic/document_loaders/fs/directory";
import { TextLoader } from "@langchain/classic/document_loaders/fs/text";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import path from "node:path";

async function main() {
  console.log("🏷️  Document Metadata Example\n");

  // Create documents with rich metadata
  //   const docs = [
  //     new Document({
  //       pageContent: `
  // LangChain.js is a framework for building AI applications. It provides abstractions for working with language models, vector stores, and chains.
  // The framework supports multiple LLM providers including OpenAI, Anthropic, and Azure.
  //       `.trim(),
  //       metadata: {
  //         source: "langchain-intro.md",
  //         category: "tutorial",
  //         difficulty: "beginner",
  //         date: "2024-01-15",
  //         author: "Tech Team",
  //         tags: ["langchain", "javascript", "ai"],
  //       },
  //     }),
  //     new Document({
  //       pageContent: `
  // RAG (Retrieval Augmented Generation) systems combine document retrieval with
  // language model generation. This approach allows LLMs to access external knowledge
  // and provide more accurate, contextual responses without retraining the model.
  //       `.trim(),
  //       metadata: {
  //         source: "rag-explained.md",
  //         category: "concept",
  //         difficulty: "intermediate",
  //         date: "2024-02-20",
  //         author: "AI Research Team",
  //         tags: ["rag", "retrieval", "llm"],
  //       },
  //     }),
  //     new Document({
  //       pageContent: `
  // Vector databases store embeddings and enable semantic search. Unlike traditional
  // keyword search, semantic search understands meaning and context. Popular vector
  // databases include Pinecone, Weaviate, and Chroma.
  //       `.trim(),
  //       metadata: {
  //         source: "vector-db-guide.md",
  //         category: "infrastructure",
  //         difficulty: "intermediate",
  //         date: "2024-03-10",
  //         author: "Data Team",
  //         tags: ["vectors", "embeddings", "database"],
  //       },
  //     }),
  //   ];

  const loader = new DirectoryLoader("./data", {
    ".txt": (path) => new TextLoader(path),
    ".pdf": (path) => new PDFLoader(path),
  });

  let docs = await loader.load();
  // console.log(docs[0]);

  // Iterate through the documents and inject custom metadata
  docs.forEach((doc, index) => {
    doc.metadata.category = "engineering";
    doc.metadata.processedDate = new Date().toISOString();
    doc.metadata.chunkIndex = index; // Highly recommended for tracking chunk order
    doc.metadata.source = path.basename(doc.metadata.source);
  });

  console.log(`📚 Created ${docs.length} documents with metadata\n`);
  docs = docs.map((doc) => {
    return new Document({
      pageContent: doc.pageContent,

      metadata: {
        source: path.basename(doc.metadata.source),
        ...doc.metadata,
      },
      id: doc.id,
    });
  });

  // Display documents and their metadata
  docs.forEach((doc, i) => {
    console.log(`Document ${i + 1}:`);
    console.log("─".repeat(80));
    console.log("Content:", doc.pageContent.substring(0, 80) + "...");
    console.log("\nMetadata:");
    console.log(JSON.stringify(doc.metadata, null, 2));
    console.log("\n");
  });

  // Split documents - metadata is preserved!
  console.log("=".repeat(80));
  console.log("\n✂️  Splitting documents (metadata is preserved):\n");

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 100,
    chunkOverlap: 20,
  });

  const splitDocs = await splitter.splitDocuments(docs);

  console.log(`Split ${docs.length} documents into ${splitDocs.length} chunks\n`);

  // Show first few chunks with metadata
  splitDocs.slice(0, 5).forEach((doc, i) => {
    console.log(`Chunk ${i + 1}:`);
    console.log("Content:", doc.pageContent);
    console.log("Source:", doc.metadata.source);
    console.log("Category:", doc.metadata.category);
    console.log("Tags:", doc.metadata.tags);
    console.log();
  });

  // Filter documents by metadata
  console.log("=".repeat(80));
  console.log("\n🔍 Filtering by metadata:\n");

  // filter by difficulty(beginner)
  const beginnerDocs = docs.filter((doc) => doc.metadata.difficulty === "beginner");
  console.log(`Beginner documents: ${beginnerDocs.length}`);
  beginnerDocs.forEach((doc) => console.log(`   - ${doc.metadata.source}`));

  // filter by tags(includes ai)
  const aiDocs = docs.filter((doc) => doc.metadata.tags?.includes("ai"));
  console.log(`\nDocuments tagged "ai": ${aiDocs.length}`);
  aiDocs.forEach((doc) => console.log(`   - ${doc.metadata.source}`));

  console.log("\n✅ Metadata is essential for organizing and filtering documents!");
}

main().catch(console.error);

/*
Real-world use cases:

Filter search results by document type or date
Track which document a chunk came from -> referce in chatbots etc..
Implement access control (user permissions) -> ask for key to unlock file!
Build faceted search interfaces
*/
