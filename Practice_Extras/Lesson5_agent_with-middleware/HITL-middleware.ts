import { createAgent, tool } from "langchain";
import { humanInTheLoopMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { z } from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import "dotenv/config";

function readEmail(emailId: string): string {
  return `Email content for ID: ${emailId}`;
}

const readEmailTool = tool(
  async (input) => {
    return readEmail(input.emailId);
  },
  {
    name: "readEmailTool",
    description: "Reads an email by its ID",
    schema: z.object({
      emailId: z.string(),
    }),
  }
);

function sendEmail(recipient: string, subject: string, body: string): string {
  return `Email sent to ${recipient} with subject '${subject}'`;
}

const sendEmailTool = tool(
  async (input) => {
    return sendEmail(input.recipient, input.subject, input.body);
  },
  {
    name: "sendEmailTool",
    description: "Sends the mail to a recipient",
    schema: z.object({
      recipient: z.string().describe("The email of recipient"),
      subject: z.string().describe("Subject of mail"),
      body: z.string().describe("The body of mail"),
    }),
  }
);

const model = new ChatOpenAI({
  model: String(process.env.AI_MODEL),
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: String(process.env.AI_API_KEY),
});

const agent = createAgent({
  model: model,
  tools: [readEmailTool, sendEmailTool],
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        sendEmailTool: {
          allowedDecisions: ["approve", "edit", "reject"],
          description: "Sending email requires sender's permission",
        },
        readEmailTool: false, // Safe operation, auto-approved
      },
      descriptionPrefix: "Tool execution pending approval",
    }),
  ],
  checkpointer: new MemorySaver(),
});

const config = { configurable: { thread_id: "some_id" } };
async function run() {
  console.log("🤖 Agent is thinking...\n");

  const stream = await agent.streamEvents(
    {
      messages: [
        new HumanMessage(
          "Send an email to nitingenz@gmail.com from Ravi saying hello, what's the plan for weekend? You must use sendEmailTool to send the mail"
        ),
      ],
    },
    { ...config, version: "v3" }
  );

  // Use a single consumer: Iterate over LLM messages to get both text and the generated tool calls
  for await (const message of stream.messages) {
    // 1. Consume conversational text
    for await (const token of message.text) {
      process.stdout.write(token);
    }

    // 2. Consume the tool calls the LLM *decided* to make before the execution pauses
    const finalMsg = await message.output;

    if (finalMsg.tool_calls?.length) {
      for (const call of finalMsg.tool_calls) {
        console.log(`\n\n🛠️ [AGENT THOUGHT]: I need to use the '${call.name}' tool.`);
        console.log(`📦 [ARGUMENTS]: ${JSON.stringify(call.args)}\n`);
      }
    }
  }

  // Check whether the run paused for human input
  if (stream.interrupted) {
    console.log(`\n\n🚨 Agent Paused! Interrupt found.`);
    console.log(`Action Requested: ${JSON.stringify(stream.interrupts, null, 2)}`);

    console.log("\n✅ Approving execution and resuming...\n");

    // Resume with streaming after human decision
    const resumeStream = await agent.streamEvents(
      new Command({
        resume: { decisions: [{ type: "approve" }] },
      }),
      { ...config, version: "v3" }
    );

    // Stream the final response text after the tool finishes running
    for await (const message of resumeStream.messages) {
      for await (const token of message.text) {
        process.stdout.write(token);
      }
    }

    console.log("\n\n🎉 Workflow Complete.");
  } else {
    console.log("\n\nNo interrupts triggered.");
  }
}

run().catch(console.error);
