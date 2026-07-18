import { OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import "dotenv/config";

const books = [
  {
    title: "The AI Revolution",
    summary: "How artificial intelligence is transforming society and business",
  },
  {
    title: "JavaScript Mastery",
    summary: "Complete guide to modern web development with JavaScript",
  },
  {
    title: "Data Science Handbook",
    summary: "Statistical analysis and machine learning for beginners",
  },
  {
    title: "The Startup Playbook",
    summary: "Building and scaling technology companies from scratch",
  },
  { title: "Mystery at Midnight", summary: "A detective solves crimes in Victorian London" },
  { title: "Space Odyssey", summary: "Humans explore distant galaxies and alien civilizations" },
  { title: "Cooking Basics", summary: "Essential techniques for home chefs and food enthusiasts" },
  { title: "Python for Data", summary: "Using Python for data analysis and visualization" },
];

const docs = books.map((book) => {
  return new Document({
    pageContent: book.summary,
    metadata: {
      title: book.title,
    },
  });
});

const embeddings = new OpenAIEmbeddings({
  model: process.env.AI_EMBEDDING_MODEL || "text-embedding-3-small",
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

const queries = [
  "books about programming",
  "stories set in space",
  "learning about AI and technology",
  "cooking and recipes",
];

for (const query of queries) {
  console.log(`🔍 Query: "${query}"\n`);
  console.log("─".repeat(80));

  const results = await vectorStore.similaritySearchWithScore(query, 3);

  results.forEach(([doc, score], index) => {
    console.log(`\n${index + 1}. ${doc.metadata.title}`);
    console.log(`   Relevance: ${(score * 100).toFixed(1)}%`);
    console.log(`   Summary: ${doc.pageContent}`);
  });

  console.log("\n" + "─".repeat(80) + "\n");
}
