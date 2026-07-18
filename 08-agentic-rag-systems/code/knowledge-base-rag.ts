import { Document } from "@langchain/core/documents";
import { semanticChunker } from "../../Practice_Extras/Lesson7/semantic-chunking";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { createAgent, HumanMessage, tool } from "langchain";
import z from "zod";

export const engineeringDocs = [
  new Document({
    pageContent:
      "Consistent Hashing is a critical System Design pattern used to distribute data across a changing cluster of database nodes. Instead of using a traditional 'hash(key) % N' approach—which requires remapping almost every single key when a node is added or removed—Consistent Hashing maps both the servers and the data keys to a circular ring space (typically 2^32 - 1). When a new node joins the cluster, only a fraction of the keys (K/N) need to be moved to the new node, drastically reducing network overhead and cache-miss storms during scaling operations.",
    metadata: {
      topic: "System Design",
      subtopic: "Horizontal Scaling",
      difficulty: "Hard",
      importance: "Critical for FAANG Architecture interviews",
    },
  }),

  new Document({
    pageContent:
      "To mitigate hotspots and load imbalances in Consistent Hashing, modern production distributed systems introduce the concept of 'Virtual Nodes' (VNodes). Instead of assigning a physical server a single location on the hash ring, each physical server is hashed multiple times using different seed values, creating dozens or hundreds of virtual positions across the ring. This ensures that if a single physical node goes down, its load is evenly redistributed across multiple remaining servers rather than overwhelming its immediate neighbor on the circular space.",
    metadata: {
      topic: "System Design",
      subtopic: "Load Balancing",
      difficulty: "Hard",
      importance: "Deep dive optimization detail",
    },
  }),

  new Document({
    pageContent:
      "The LRU (Least Recently Used) Cache eviction policy organizes data elements in order of use to identify which element hasn't been accessed for the longest time. Implementing a production-grade LRU Cache requires achieving O(1) time complexity for both 'get' and 'put' operations. This cannot be achieved using an array or a standard hash map alone. Instead, engineers must combine a Doubly Linked List with a Hash Map. The Hash Map provides O(1) lookups to the list nodes, while the Doubly Linked List allows O(1) pointer updates to move the accessed node to the head (most recently used position) or evict from the tail (least recently used position).",
    metadata: {
      topic: "Data Structures",
      subtopic: "Caching Mechanics",
      difficulty: "Medium",
      importance: "Extremely common FAANG coding/design question",
    },
  }),

  new Document({
    pageContent:
      "A Trie (also known as a Prefix Tree) is a specialized tree-based data structure used for efficient retrieval of keys within a dataset of strings. In a Trie, every node represents a single character of a string, and paths down the tree share common prefixes. This structure makes Tries exceptionally powerful for implementing autocomplete systems, spell checkers, and IP routing tables. The time complexity for searching or inserting a key of length 'L' is O(L), which is completely independent of the total number of keys stored in the database, offering massive performance benefits over standard hash maps when prefix matching is required.",
    metadata: {
      topic: "Data Structures",
      subtopic: "Advanced Trees",
      difficulty: "Medium",
      importance: "Core DSA concept for search/string manipulation",
    },
  }),
];

async function textSplit(engineeringDocs: Document[]) {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 200,
    chunkOverlap: 20,
  });

  // preserves metadata
  const docs = await splitter.createDocuments(
    engineeringDocs.map((doc) => doc.pageContent),
    engineeringDocs.map((doc) => doc.metadata)
  );
  // Display each chunk

  console.log("textSplittedDocs: ");
  docs.forEach((doc, i) => {
    console.log(`\n📄 Chunk ${i + 1}/${docs.length}`);
    console.log("─".repeat(80));
    console.log(doc.pageContent);
    console.log(`\n📏 Length: ${doc.pageContent.length} characters`);
    console.log("metadata:", doc.metadata);
  });

  return docs;
}

// here semanticChunker will be best as the provided text is not formatted
async function semanticSplit(engineeringDocs: Document[], embeddings: OpenAIEmbeddings) {
  let semanticDocs = [];

  for (const doc of engineeringDocs) {
    // create semantic chunks
    const chunks = await semanticChunker(doc.pageContent, embeddings, 0.6);

    // for each chunk, create a document
    for (const chunk of chunks) {
      semanticDocs.push(
        new Document({
          pageContent: chunk,
          metadata: doc.metadata,
        })
      );
    }
  }

  console.log("semanticSplittedDocs: ");
  semanticDocs.forEach((doc, i) => {
    console.log(`\n📄 Chunk ${i + 1}/${semanticDocs.length}`);
    console.log("─".repeat(80));
    console.log(doc.pageContent);
    console.log(`\n📏 Length: ${doc.pageContent.length} characters`);
    console.log("metadata:", doc.metadata);
  });

  return semanticDocs;
}

async function main() {
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

  textSplit(engineeringDocs);
  const docs = await semanticSplit(engineeringDocs, embeddings); // overlap missing from semanticChunker

  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

  const searchEngineeringDocs = tool(
    async (input) => {
      console.log(`   🔍 Agent searching for: "${input.query}"`);
      let results = await vectorStore.similaritySearch(input.query, 3);

      if (input.topic) results = results.filter((res) => (res.metadata.topic = input.topic));

      if (results.length === 0) {
        return "No relevant information found in the knowledge base.";
      }

      return results.map((doc) => `[${doc.metadata.topic}]: ${doc.pageContent}`).join("\n\n");
    },
    {
      name: "searchEngineeringDocs",
      description:
        "Search my custom documentation set focused on Core System Design and DSA Concepts for High-Scale Architectures. Use this to find relevant data when you a query asks about System Design or DSA Concepts.",
      schema: z.object({
        query: z
          .string()
          .describe(
            "The search query to find relevant information from my custom documentation set."
          ),

        topic: z
          .string()
          .optional()
          .describe("The topic to filter - can be one of System Design or Data Structures"),
      }),
    }
  );

  const agent = createAgent({
    model,
    tools: [searchEngineeringDocs],
  });

  const queries = [
    "What is the time complexity of a Trie insert operation?",
    "Tell me a joke about programming.",
    "Explain node additions in horizontal scaling but only check System Design documents.",
  ];

  for (const query of queries) {
    console.log("query:", query);

    const ress = await agent.invoke({ messages: [new HumanMessage(query)] });
    console.log("result:", ress.messages.at(-1)!.content);
    console.log();
  }
}

main().catch(console.error);
