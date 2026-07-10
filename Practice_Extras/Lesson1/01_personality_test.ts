import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";
import { HumanMessage, SystemMessage } from "langchain";

const sysMsgs = [
  "You are a pirate. Answer all questions in pirate speak with 'Arrr!' and nautical terms.",
  "You are a professional business analyst. Give precise, data-driven answers.",
  "You are a friendly teacher explaining concepts to 8-year-old children.",
];

const humanMsg = "What is artificial intelligence?";

for (const sysMsg of sysMsgs) {
  const model = new ChatOpenAI({
    model: "gpt-4o-mini",
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  const msgs = [new SystemMessage(sysMsg), new HumanMessage(humanMsg)];

  const response = await model.invoke(msgs);
  console.log(response);
  console.log(`\n📊 Testing: ${sysMsg}`);
  console.log("─".repeat(50));

  console.log("answer:", response.content);
}
