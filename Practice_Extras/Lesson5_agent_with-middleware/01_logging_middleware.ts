import { AIMessage, createAgent, createMiddleware, HumanMessage } from "langchain";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

const model = new ChatOpenAI({
  model: process.env.AI_MODEL,
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

let reqCount = 0;

const requestLoggingMiddleware = createMiddleware({
  name: "requestLoggingMiddleware",

  // returns model's response (AIMessage)
  wrapModelCall: async (request, handler) => {
    // <-- ADD async
    reqCount++;
    console.log(`[requestLoggingMiddleware]: reqCount - ${reqCount}`);

    // <-- FIX array indexing with .at(-1)
    const lastMsg = request.messages.at(-1)?.content || "";
    console.log(`[requestLoggingMiddleware]: request - ${lastMsg.slice(0, 40)}...`);

    try {
      return await handler(request); // <-- ADD await to catch network errors
    } catch (error: any) {
      console.log(`[requestLoggingMiddleware]: API error... returning fallback!`);
      // FIX: Return exactly what the AI would return — a single AIMessage.
      return new AIMessage(`Sorry, I couldn't process that. API error occurred: ${error.message}`);
    }
  },
});

const agent = createAgent({
  model: model,
  middleware: [requestLoggingMiddleware],
});

const queries = [
  "Explain the concept of quantum computing to a five-year-old using only the vocabulary found in the movie Finding Nemo.",
  "Rewrite the famous balcony scene from Romeo and Juliet, but set it during a chaotic Black Friday sale at a major retail store.",
  "Write a suspenseful short story about a lighthouse keeper who discovers that the warnings aren't for ships, but for the lighthouse itself.",
];

for (const query of queries) {
  const response = await agent.invoke({ messages: [new HumanMessage(query)] });
  console.log("response:", response.messages[response.messages.length - 1].content);
}
