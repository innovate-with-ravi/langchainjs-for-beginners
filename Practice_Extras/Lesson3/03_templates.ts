import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";

const model = new ChatOpenAI({
  model: process.env.AI_MODEL,
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

// Create template with variables in curly braces
const template = ChatPromptTemplate.fromMessages([
  ["system", "You are a helpful assistant that translates {input_language} to {output_language}"],
  ["human", "{text}"],
]);

// Pipe to model to create a reusable chain
const chain = template.pipe(model);

const res = await chain.invoke({
  input_language: "English",
  output_language: "French",
  text: "I love you",
});

console.log(res);
