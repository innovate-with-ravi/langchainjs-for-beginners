import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatGroq } from "@langchain/groq";
import { createAgent, HumanMessage, SystemMessage } from "langchain";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import "dotenv/config";

const mcpClient = new MultiServerMCPClient({
  context7: {
    transport: "http",
    url: "https://mcp.context7.com/mcp",
  },
});

let tools: any[] = [];

try {
  tools = await mcpClient.getTools();
  console.log(`Retrieved ${tools.length} tools from mcpServer`);

  for (const tool of tools) {
    console.log(`Tool: ${tool.name}
    description: ${tool.description}`);
  }
} catch (error) {
  console.log("error fetching tools:", error instanceof Error ? error.message : String(error));
}

const model = new ChatGroq({
  model: process.env.GROQ_AI_MODEL!,
  apiKey: process.env.GROQ_API_KEY,
});

const agent = createAgent({
  model,
  tools,
});

try {
  let userIP = "";

  while (userIP.trim() != "quit") {
    const rl = readline.createInterface(input, output);
    userIP = await rl.question(`🤖: Ask about any documentation or 'quit' to exit: `);
    rl.close();

    if (userIP == "quit") {
      break;
    }

    const res = await agent.invoke({ messages: [new HumanMessage(userIP)] });

    const finalOutput = res.messages.at(-1)!;
    console.log(`🤖 Agent: ${finalOutput.content}`);
  }
} catch (err) {
  console.error("❌ Runtime exception inside the client execution block:", err);
} finally {
  await mcpClient.close();
  console.log("\n🔌 MCP client background process connection closed.");
}
