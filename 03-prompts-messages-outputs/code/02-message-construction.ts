/**
 * Message Construction Patterns
 * Run: npx tsx 03-prompts-messages-outputs/code/02-message-construction.ts
 *
 * 🤖 Try asking GitHub Copilot Chat (https://github.com/features/copilot):
 * - "How do I build a multi-turn conversation with message arrays?"
 * - "Can I serialize and deserialize message arrays for storage & how?"
 */

import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage, AIMessage, ToolMessage, BaseMessage } from "langchain";
import "dotenv/config";

async function main() {
  console.log("🔨 Message Construction Patterns\n");

  const model = new ChatOpenAI({
    model: process.env.AI_MODEL,
    configuration: { baseURL: process.env.AI_ENDPOINT },
    apiKey: process.env.AI_API_KEY,
  });

  // ==========================================
  // PATTERN 1: Basic Message Types
  // ==========================================
  console.log("=".repeat(80));
  console.log("\n📝 PATTERN 1: Basic Message Types\n");

  const systemMsg = new SystemMessage("You are a helpful programming assistant.");
  const humanMsg = new HumanMessage("What is a variable?");

  console.log("Message types:");
  console.log(`   • SystemMessage: ${systemMsg.content}`);
  console.log(`   • HumanMessage: ${humanMsg.content}\n`);

  const response1 = await model.invoke([systemMsg, humanMsg]);
  console.log(`🤖 AI Response: ${response1.content}\n`);

  // ==========================================
  // PATTERN 2: Multi-Turn Conversations
  // ==========================================
  console.log("=".repeat(80));
  console.log("\n💬 PATTERN 2: Multi-Turn Conversations\n");

  const conversationMessages = [
    new SystemMessage("You are a math tutor for beginners."),
    new HumanMessage("What is 5 + 3?"),
    new AIMessage("5 + 3 equals 8!"),
    new HumanMessage("Now what is 8 * 2?"),
  ];

  console.log("Conversation history:");
  conversationMessages.forEach((msg, i) => {
    if (i == 0) console.log(msg);

    const role = msg.type;
    console.log(`   ${i + 1}. [${role}]: ${msg.content}`);
  });

  const response2 = await model.invoke(conversationMessages);
  console.log(`\n🤖 AI Response: ${response2.content}\n`);

  console.log("💡 Key insights:");
  console.log("   • SystemMessage sets the AI's role (first message)");
  console.log("   • HumanMessage represents user input");
  console.log("   • AIMessage represents previous AI responses");
  console.log("   • Order matters - messages build conversation context");

  // ==========================================
  // PATTERN 3: Dynamic Message Construction
  // ==========================================
  console.log("\n" + "=".repeat(80));
  console.log("\n🎯 PATTERN 3: Dynamic Message Construction\n");

  function createConversation(
    role: string,
    examples: { question: string; answer: string }[], //Array<{ question: string; answer: string }>
    newQuestion: string
  ): BaseMessage[] {
    const messages: BaseMessage[] = [new SystemMessage(`You are a ${role}.`)];

    // Add examples (few-shot pattern using messages)
    examples.forEach(({ question, answer }) => {
      messages.push(new HumanMessage(question));
      messages.push(new AIMessage(answer));
    });

    // Add the new question
    messages.push(new HumanMessage(newQuestion));

    return messages;
  }

  const emojiMessages = createConversation(
    "emoji translator",
    [
      { question: "happy", answer: "😊" },
      { question: "sad", answer: "😢" },
      { question: "excited", answer: "🎉" },
    ],
    "surprised"
  );

  console.log("Dynamically constructed conversation:");
  emojiMessages.forEach((msg, i) => {
    console.log(`   ${i + 1}. [${msg.type}]: ${msg.content}`);
  });

  const response3 = await model.invoke(emojiMessages);
  console.log(`\n🤖 AI Response: ${response3.content}\n`);

  console.log("💡 This pattern is useful for:");
  console.log("   • Building few-shot prompts programmatically(dynamically)");
  console.log("   • Creating conversation builders");
  console.log("   • Managing state in agents");
  console.log("   • Storing/loading conversation history from databases");

  // ==========================================
  // PATTERN 4: Message Metadata
  // ==========================================
  console.log("\n" + "=".repeat(80));
  console.log("\n🏷️  PATTERN 4: Messages with Metadata\n");

  const messageWithMetadata = new HumanMessage({
    content: "What's the weather like?",
    // Additional metadata can be stored -> it can be any key:value pair
    additional_kwargs: {
      timestamp: new Date().toISOString(),
      userId: "user-123",
    },
  });

  console.log("Message with metadata:");
  console.log(`   Content: ${messageWithMetadata.content}`);
  console.log(`   Metadata: ${JSON.stringify(messageWithMetadata.additional_kwargs, null, 2)}\n`);

  console.log("💡 Use metadata for:");
  console.log("   • Tracking conversation timestamps");
  console.log("   • {{Storing user IDs for multi-user systems}}");
  console.log("   • {{Adding context without affecting AI processing like commented text}}");
  console.log("   • {{Debugging and ((logging))}}");

  // ==========================================
  // COMPARISON WITH AGENTS
  // ==========================================
  console.log("\n" + "=".repeat(80));
  console.log("\n🚀 How Agents Use Messages\n");

  console.log("When you use createAgent() (Chapter 7), it:");
  console.log("   1. Takes message arrays as input");
  console.log("   2. Processes messages through middleware");
  console.log("   3. Adds ToolMessage for tool calls/{results}");
  console.log("   {{4. Returns updated message array with agent's response}}\n");

  console.log("Example agent flow:");
  console.log("   [HumanMessage] → Agent → [HumanMessage, ToolMessage, AIMessage]");
  console.log("                              ↑");
  console.log("                        Agent adds tool");
  console.log("                        call and response\n");

  console.log("✅ Messages are the foundation of agent systems!");
  console.log("   Learn this pattern → use it in Chapter 7 (Agents & MCP)\n");

  console.log("=".repeat(80));
}

main().catch(console.error);

/*
Why This Matters for Agents:

 - Agents need to construct messages dynamically based on tool results
 - Few-shot examples improve agent decision-making and consistency
 - Programmatic message building allows {{loading conversation history from databases}}
*/
