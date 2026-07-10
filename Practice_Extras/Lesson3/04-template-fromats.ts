import { ChatPromptTemplate, PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

const model = new ChatOpenAI({
  model: process.env.AI_MODEL,
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

// PromptTemplate
const stringTemplate = PromptTemplate.fromTemplate("Write a {adjective} {item} about {topic}.");

const prompt = await stringTemplate.format({
  adjective: "funny",
  item: "poem",
  topic: "JavaScript",
});

console.log(prompt);
