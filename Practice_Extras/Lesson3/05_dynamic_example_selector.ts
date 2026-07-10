import { SemanticSimilarityExampleSelector } from "@langchain/core/example_selectors";
// import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "@langchain/openai";

// Create embeddings for semantic similarity
const embeddings = new OpenAIEmbeddings({
  apiKey: process.env.AI_API_KEY,
  configuration: { baseURL: process.env.AI_ENDPOINT },
});

// Create vector store from examples
const exampleSelector = await SemanticSimilarityExampleSelector.fromExamples(
  [
    { input: "happy", output: "😊" },
    { input: "sad", output: "😢" },
    { input: "excited", output: "🎉" },
    { input: "angry", output: "😠" },
  ],
  embeddings,
  MemoryVectorStore,
  { k: 2 } // Select 2 most similar examples
);

// Use in FewShotChatMessagePromptTemplate
const fewShotTemplate = new FewShotChatMessagePromptTemplate({
  examplePrompt: exampleTemplate,
  exampleSelector: exampleSelector, // Replaces static "examples" array
  inputVariables: ["input"],
});
