import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatOpenAI } from "@langchain/openai";
import { AIMessage, BaseMessage, createAgent, HumanMessage, SystemMessage } from "langchain";
import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

// Configure the GitHub Node
const mcpClient = new MultiServerMCPClient({
  github: {
    transport: "stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-github"],
    env: {
      GITHUB_PERSONAL_ACCESS_TOKEN: process.env.GITHUB_PERSONAL_ACCESS_TOKEN!,
    },
  },

  linter: {
    transport: "http",
    url: "http://localhost:3000/mcp",
    // Crucial: Use the headers object in this config to pass your "Authorization":
    headers: {
      authorization: `Bearer ${process.env.GITHUB_PERSONAL_ACCESS_TOKEN}`,
    },
  },
});

const model = new ChatOpenAI({
  model: process.env.AI_MODEL,
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

const tools = await mcpClient.getTools();

const agent = createAgent({
  model,
  tools,
});

const query = `Fetch this file: https://github.com/innovate-with-ravi/Online-Student-Feedback-System/blob/main/02_feedbackForm.html
and now analyze this using tool: 'analyze_code'`;

const res = await agent.invoke({ messages: [new HumanMessage(query)] });
console.log(res.messages.at(-1)!.content);

process.exit(0);
