import { MultiServerMCPClient } from "@langchain/mcp-adapters";
import { ChatGroq } from "@langchain/groq";
import { AIMessage, BaseMessage, createAgent, HumanMessage, SystemMessage } from "langchain";
import "dotenv/config";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

async function runAgent() {
  console.log("🚀 Initializing Client Agent...");

  // create mcpClient
  const model = new ChatGroq({
    model: process.env.GROQ_AI_MODEL!,
    apiKey: process.env.GROQ_API_KEY,
  });

  const mcpClient = new MultiServerMCPClient({
    "my-calculator": {
      transport: "http",
      url: "http://localhost:3000/mcp",
    },
  });

  try {
    console.log("📟 Discovering tools hosted on the MCP Server...");
    const tools = await mcpClient.getTools();

    console.log(`✅ Retrieved ${tools.length} active tools:`);
    tools.forEach((t) => console.log(`   • ${t.name}: ${t.description}`));

    const agent = createAgent({ model, tools });

    let messages: BaseMessage[] = [];
    messages.push(
      new SystemMessage(
        "You are a helpful math assistant who answers mainly using given calculator-tool."
      )
    );

    let userIP = "";

    // Accepts user input in a loop// Allows users to type "quit" to exit
    while (userIP.trim() != "quit") {
      const rl = readline.createInterface(input, output);

      userIP = await rl.question(`🤖: Ask any AI realted question or 'quit' to exit: `);

      rl.close();

      if (userIP == "quit") {
        break;
      }

      //   add the userIP in messages[]
      messages.push(new HumanMessage(userIP));
      const res = await agent.invoke({ messages });

      console.log("res:", JSON.stringify(res, null, 2));

      const finalOutput = res.messages.at(-1)!;
      console.log(`🤖 Agent: ${finalOutput.content}`);

      // Maintains conversation history (only AIMessage & not Toolmessage)
      messages.push(new AIMessage(finalOutput));

      // Shows the conversation history length after each exchange
      console.log(`Conversation length: ${messages.length}`);
    }
  } catch (err) {
    console.error("❌ Runtime exception inside the client execution block:", err);
  } finally {
    await mcpClient.close();
    console.log("\n🔌 MCP client background process connection closed.");
  }
}

await runAgent();
