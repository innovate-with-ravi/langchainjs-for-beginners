// 1. Import required modules
import { ChatGroq } from "@langchain/groq";
import { createAgent, HumanMessage, AIMessage, tool } from "langchain";
import * as z from "zod";
import "dotenv/config";
import { evaluate } from "mathjs";

export const searchTool = tool(
  async (input) => {
    // query:value
    const knowledgeBase: Record<string, string> = {
      "population of tokyo": "Tokyo has a population of approximately 14 million people.",
      "capital of france": "The capital of France is Paris.",
      "capital of japan": "The capital of Japan is Tokyo.",
      "population of new york":
        "New York City has a population of approximately 8.3 million people.",
    };

    const query: string = input.query;
    let searchRes = "No Result Found on Web!!";

    for (const key of Object.keys(knowledgeBase)) {
      /*key might inclue a word of query*/
      if (query.toLocaleLowerCase().includes(key) || key.includes(query)) {
        searchRes = knowledgeBase[query];
        break;
      }
    }

    return searchRes; // ensures error handling for no result found
  },
  {
    name: "web-search-tool",
    description: "This tool provides web-search results for queries",
    schema: z.object({
      query: z.string().describe("The search query to search on web"),
    }),
  }
);

const calculatorTool = tool(
  async (input) => {
    try {
      const res = evaluate(input.expression);
      return res;
    } catch (error: any) {
      const fallbackMsg = `Error occured: ${error instanceof Error ? error.message : String(error)}
    Try with different parameters`;
      return fallbackMsg;
    }
  },
  {
    name: "Calculator",
    description: "Calculates all mathametical expressions",
    schema: z.object({
      expression: z.string().describe("The mathematical expression to evaluate"),
    }),
  }
);

const model = new ChatGroq({
  model: "qwen/qwen3-32b",
  apiKey: process.env.GROQ_API_KEY,
});

//Note: The systemPrompt helps guide agent behavior - without it, agents may ask unnecessary clarifying questions instead of completing the task.
const agent = createAgent({
  model,
  tools: [searchTool, calculatorTool],
  systemPrompt:
    "You are a helpful assistant who uses appropriate tools for most tasks. Do NOT ask clarifying questions - proceed with reasonable assumptions.",
});

const queries = [
  "What is the population of Tokyo multiplied by 2?",
  "Search for the capital of France and tell me how many letters are in its name",
];

for (const query of queries) {
  const response = await agent.invoke({ messages: [new HumanMessage(query)] });

  const toolCallsNames = response.messages
    .filter(
      (msg) => msg instanceof AIMessage && msg.tool_calls?.length && msg.tool_calls?.length > 0
    )
    .map((msg) => (msg as AIMessage).tool_calls!.map((tc) => tc.name));

  console.log(`Tools used: ${[...new Set(toolCallsNames)].join(", ")}`);

  const lastMessage = response.messages[response.messages.length - 1];
  console.log(lastMessage.content);
}
