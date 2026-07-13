import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatGroq } from "@langchain/groq";
import { createAgent, HumanMessage } from "langchain";
import "dotenv/config";
import path, { dirname } from "node:path";

async function runAgent() {
  console.log("🚀 Initializing Client Agent...");

  const __filename = import.meta.filename;
  const __dirname = dirname(__filename);

  // create mcpClient
  const model = new ChatGroq({
    model: process.env.GROQ_AI_MODEL!,
    apiKey: process.env.GROQ_API_KEY,
  });

  // Spin up the server script as a background child process using stdio
  const mcpClient = new MultiServerMCPClient({
    weatherForecast: {
      transport: "stdio",
      // code to run server like: command(npx) args[0] args[1]
      command: "npx",
      args: ["tsx", path.join(__dirname, "server/weather-server.ts")],
    },
  });

  try {
    console.log("📟 Discovering tools hosted on the MCP Server...");
    const tools = await mcpClient.getTools();

    console.log(`✅ Retrieved ${tools.length} active tools from process stream:`);
    tools.forEach((t) => console.log(`   • ${t.name}: ${t.description}`));

    const agent = createAgent({ model, tools });

    const userQuery = "Can you tell me how the weather looks in Indore right now?";
    console.log(`\n👤 User: ${userQuery}`);

    const systemResponse = await agent.invoke({
      messages: [new HumanMessage(userQuery)],
    });

    const finalOutput = systemResponse.messages.at(-1)!;
    console.log(`🤖 Agent: ${finalOutput.content}`);
  } catch (err) {
    console.error("❌ Runtime exception inside the client execution block:", err);
  } finally {
    await mcpClient.close();
    console.log("\n🔌 MCP client background process connection closed.");
  }
}

await runAgent();
