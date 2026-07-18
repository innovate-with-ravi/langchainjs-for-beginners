/**
 * Chapter 7 Assignment Solution: Bonus Challenge
 * Conversational Agentic RAG
 *
 * Run: npx tsx 07-agentic-rag-systems/solution/conversational-rag.ts
 */

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { Document } from "@langchain/core/documents";
import { createAgent, HumanMessage, AIMessage, tool } from "langchain";
import * as z from "zod";
import * as readline from "readline";
import "dotenv/config";

// Knowledge base about TypeScript
const knowledgeBase = [
  new Document({
    pageContent:
      "TypeScript is a strongly typed programming language that builds on JavaScript. It adds optional static typing to JavaScript, which can help catch errors early in development.",
    metadata: { title: "TypeScript Overview", section: "Introduction" },
  }),
  new Document({
    pageContent:
      "TypeScript's main benefits include better IDE support, early error detection, improved code maintainability, and enhanced refactoring capabilities. It helps teams build more robust applications.",
    metadata: { title: "TypeScript Benefits", section: "Advantages" },
  }),
  new Document({
    pageContent:
      "TypeScript supports interfaces which define the shape of objects. Interfaces can include properties, methods, and index signatures. They enable type checking and serve as documentation.",
    metadata: { title: "TypeScript Interfaces", section: "Type System" },
  }),
  new Document({
    pageContent:
      "Generics in TypeScript allow you to create reusable components that work with multiple types. They provide type safety while maintaining flexibility. Common examples include Array<T> and Promise<T>.",
    metadata: { title: "TypeScript Generics", section: "Additional Features" },
  }),
  new Document({
    pageContent:
      "TypeScript enums allow you to define a set of named constants. They can be numeric or string-based and help make code more readable and less error-prone when working with sets of related values.",
    metadata: { title: "TypeScript Enums", section: "Type System" },
  }),
];

async function main() {
  console.log("💬 Conversational Agentic RAG System\n");
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
  const searchTypeScriptDocs = tool(
    async (input) => {
      console.log(`   🔍 Agent searching for: "${input.query}"`);
      const results = await vectorStore.similaritySearch(input.query, 2);

      if (results.length === 0) {
        return "No relevant TypeScript documentation found.";
      }

      return results.map((doc) => `[${doc.metadata.title}]: ${doc.pageContent}`).join("\n\n");
    },
    {
      name: "searchTypeScriptKnowledgeBase",
      description:
        "Search the TypeScript knowledge base for information about TypeScript features, benefits, interfaces, generics, and enums. Use this when you need specific information about TypeScript from the documentation.",
      schema: z.object({
        query: z.string().describe("The search query to find relevant TypeScript documentation"),
      }),
    }
  );

  // 4. Create agent with retrieval tool
  const agent = createAgent({
    model,
    tools: [searchTypeScriptDocs],
  });

  // 5. Initialize conversation history
  const conversationHistory: (HumanMessage | AIMessage)[] = [];

  // Track if running in CI mode for automated testing
  const isCI = process.env.CI === "true";
  let questionCount = 0;

  // 6. Create readline interface for interactive conversation
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("💡 Instructions:");
  console.log("   - Ask questions about TypeScript");
  console.log("   - Ask follow-up questions to test conversation memory");
  console.log("   - Type 'reset' to start a new conversation");
  console.log("   - Type 'exit' or 'quit' to end\n");
  console.log("=".repeat(80) + "\n");

  // 7. Conversation loop
  const askQuestion = () => {
    rl.question("You: ", async (input) => {
      const userInput = input.trim();

      // Handle special commands
      if (userInput.toLowerCase() === "exit" || userInput.toLowerCase() === "quit") {
        console.log("\n👋 Goodbye! Thanks for chatting!\n");
        rl.close();
        return;
      }

      if (userInput.toLowerCase() === "reset") {
        conversationHistory.length = 0;
        console.log("\n🔄 Conversation reset. Starting fresh!\n");
        askQuestion();
        return;
      }

      if (!userInput) {
        askQuestion();
        return;
      }

      // Add user message to history
      const userMessage = new HumanMessage(userInput);
      conversationHistory.push(userMessage);

      try {
        // Invoke agent with full conversation history
        const response = await agent.invoke({
          messages: [...conversationHistory],
        });

        // Get agent's response
        const agentMessage = response.messages[response.messages.length - 1];

        // Add agent's response to history
        conversationHistory.push(new AIMessage(agentMessage.content as string));

        console.log(`\nAgent: ${agentMessage.content}\n`);
        console.log("=".repeat(80) + "\n");

        // In CI mode, exit after answering one question
        questionCount++;
        if (isCI && questionCount >= 1) {
          console.log("✅ CI Mode: Answered one question successfully. Exiting.\n");
          rl.close();
          return;
        }
      } catch (error) {
        console.error("Error:", error);
      }

      // Continue conversation
      askQuestion();
    });
  };

  // Start the conversation
  askQuestion();
}

main().catch(console.error);
