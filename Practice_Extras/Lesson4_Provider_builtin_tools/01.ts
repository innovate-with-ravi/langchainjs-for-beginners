import { ChatOpenAI, tools } from "@langchain/openai";
import "dotenv/config";

const model = new ChatOpenAI({
  model: "gpt-4o",
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

console.log(model.profile);

const response = await model.invoke("What are the latest TypeScript 5.9 features?", {
  tools: [tools.webSearch()],
});

console.log(response.content);
