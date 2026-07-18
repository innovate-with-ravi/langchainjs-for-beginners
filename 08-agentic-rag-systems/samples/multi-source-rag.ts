/**
 * Chapter 7 Sample: Agentic Multi-Source RAG System
 *
 * This demonstrates how an agent intelligently decides which document sources
 * (text, markdown, web) to search based on the question context.
 *
 * Run: npx tsx 07-agentic-rag-systems/samples/multi-source-rag.ts
 */

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { createAgent, HumanMessage, AIMessage, tool } from "langchain";
import * as z from "zod";
import readline from "readline";
import "dotenv/config";

const documents = [
  // Text sources
  new Document({
    pageContent: "LangChain simplifies building AI applications with modular components",
    metadata: { source_type: "text", source: "article.txt", date: "2024-01-15" },
  }),
  new Document({
    pageContent: "Vector databases store embeddings for semantic search capabilities",
    metadata: { source_type: "text", source: "notes.txt", date: "2024-01-20" },
  }),
  // Markdown sources
  new Document({
    pageContent: "# Getting Started\n\nInstall LangChain using npm install @langchain/core",
    metadata: {
      source_type: "markdown",
      source: "README.md",
      date: "2024-02-01",
    },
  }),
  new Document({
    pageContent: "## Best Practices\n\nAlways validate user input before processing",
    metadata: {
      source_type: "markdown",
      source: "GUIDE.md",
      date: "2024-02-05",
    },
  }),
  // Web sources
  new Document({
    pageContent: "LangChain.js provides JavaScript bindings for the LangChain framework",
    metadata: {
      source_type: "web",
      source: "https://js.langchain.com",
      date: "2024-02-10",
    },
  }),
  new Document({
    pageContent: "RAG combines retrieval with generation for accurate AI responses",
    metadata: {
      source_type: "web",
      source: "https://docs.langchain.com/rag",
      date: "2024-02-15",
    },
  }),
];

async function main() {
  console.log("🗂️  Agentic Multi-Source RAG System\n");
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

  console.log("📚 Loading multi-source knowledge base...");
  const vectorStore = await MemoryVectorStore.fromDocuments(documents, embeddings);
  console.log("✅ Knowledge base ready!\n");

  // Create source-specific retrieval tools
  const searchAllSources = tool(
    async (input) => {
      const results = await vectorStore.similaritySearch(input.query, 3);
      return results
        .map(
          (doc, i) =>
            `[${i + 1}] [${doc.metadata.source_type.toUpperCase()}] ${doc.metadata.source} (${doc.metadata.date})
Content: ${doc.pageContent}`
        )
        .join("\n\n");
    },
    {
      name: "searchAllSources",
      description:
        "Search across ALL document sources (text files, markdown docs, web pages). Use this when you need comprehensive information from any available source.",
      schema: z.object({
        query: z.string().describe("The search query"),
      }),
    }
  );

  // first find all results form vector store
  // then filter source_type == text results
  const searchTextFiles = tool(
    async (input) => {
      const allResults = await vectorStore.similaritySearch(input.query, 10);

      const filtered = allResults.filter((doc) => doc.metadata.source_type === "text");

      return filtered
        .slice(0, 3)
        .map(
          (doc, i) =>
            `[${i + 1}] ${doc.metadata.source} (${doc.metadata.date})
Content: ${doc.pageContent}`
        )
        .join("\n\n");
    },
    {
      name: "searchTextFiles",
      description:
        "Search ONLY text files (.txt). Use this when you specifically need information from plain text sources like articles or notes.",
      schema: z.object({
        query: z.string().describe("The search query"),
      }),
    }
  );

  const searchMarkdownDocs = tool(
    async (input) => {
      const allResults = await vectorStore.similaritySearch(input.query, 10);

      const filtered = allResults.filter((doc) => doc.metadata.source_type === "markdown");
      return filtered
        .slice(0, 3)
        .map(
          (doc, i) =>
            `[${i + 1}] ${doc.metadata.source} (${doc.metadata.date})
Content: ${doc.pageContent}`
        )
        .join("\n\n");
    },
    {
      name: "searchMarkdownDocs",
      description:
        "Search ONLY markdown documentation (.md). Use this when you need documentation, guides, or README files.",
      schema: z.object({
        query: z.string().describe("The search query"),
      }),
    }
  );

  const searchWebPages = tool(
    async (input) => {
      const allResults = await vectorStore.similaritySearch(input.query, 10);
      const filtered = allResults.filter((doc) => doc.metadata.source_type === "web");
      return filtered
        .slice(0, 3)
        .map(
          (doc, i) =>
            `[${i + 1}] ${doc.metadata.source} (${doc.metadata.date})
Content: ${doc.pageContent}`
        )
        .join("\n\n");
    },
    {
      name: "searchWebPages",
      description:
        "Search ONLY web pages. Use this when you need information from online sources or official documentation websites.",
      schema: z.object({
        query: z.string().describe("The search query"),
      }),
    }
  );

  // Create agent with all source-specific tools
  const agent = createAgent({
    model,
    tools: [searchAllSources, searchTextFiles, searchMarkdownDocs, searchWebPages],
  });

  console.log("=".repeat(80) + "\n");

  // Check CI mode
  if (process.env.CI === "true") {
    console.log("Running in CI mode\n");

    const testQuestions = [
      "What is LangChain?", // Agent might search all sources
      "How do I get started with installation?", // Agent might search markdown
      "Tell me about vector databases", // Agent might search text or all
    ];

    for (const question of testQuestions) {
      console.log(`❓ Question: ${question}\n`);

      const response = await agent.invoke({
        messages: [new HumanMessage(question)],
      });

      const lastMessage = response.messages[response.messages.length - 1];
      console.log(`🤖 Answer: ${lastMessage.content}\n`);

      // Show which tool was used
      const toolUse = response.messages.find(
        (msg) => msg instanceof AIMessage && msg.tool_calls && msg.tool_calls.length > 0
      );
      if (toolUse && toolUse instanceof AIMessage && toolUse.tool_calls) {
        console.log(`✅ Agent chose: ${toolUse.tool_calls[0].name}\n`);
      }

      console.log("─".repeat(80) + "\n");
    }

    console.log("✅ Agentic multi-source RAG working correctly!");
    return;
  }

  // Interactive mode
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  function ask(prompt: string): Promise<string> {
    return new Promise((resolve) => rl.question(prompt, resolve));
  }

  console.log("🤖 The agent can intelligently choose between:");
  console.log("   • searchAllSources - Search all document types");
  console.log("   • searchTextFiles - Search only .txt files");
  console.log("   • searchMarkdownDocs - Search only .md files");
  console.log("   • searchWebPages - Search only web sources");
  console.log("\nThe agent will decide which source(s) to search based on your question!\n");

  while (true) {
    const question = await ask("\n❓ Question (or 'quit'): ");
    if (question.toLowerCase() === "quit") break;

    console.log("\n🤔 Agent is analyzing your question and choosing source(s)...\n");

    const response = await agent.invoke({
      messages: [new HumanMessage(question)],
    });

    const lastMessage = response.messages[response.messages.length - 1];
    console.log("─".repeat(80));
    console.log(`\n🤖 Answer: ${lastMessage.content}\n`);

    // Show which tool(s) the agent chose
    const toolMessages = response.messages.filter(
      (msg) => msg instanceof AIMessage && msg.tool_calls && msg.tool_calls.length > 0
    ) as AIMessage[];

    if (toolMessages.length > 0) {
      console.log("📊 Agent Decision:");
      toolMessages.forEach((msg) => {
        if (msg.tool_calls) {
          msg.tool_calls.forEach((call) => {
            console.log(`   ✓ Used: ${call.name}`);
          });
        }
      });
    }

    console.log("\n" + "─".repeat(80));
  }

  rl.close();
  console.log("\n✅ Complete!");
  console.log("\n💡 Key Insights:");
  console.log("   ✓ Agent intelligently chooses which source types to search");
  console.log("   ✓ No manual source selection needed - agent decides based on context");
  console.log("   ✓ More efficient than always searching all sources");
  console.log("   ✓ Demonstrates multi-tool agent decision-making");
}

main().catch(console.error);
