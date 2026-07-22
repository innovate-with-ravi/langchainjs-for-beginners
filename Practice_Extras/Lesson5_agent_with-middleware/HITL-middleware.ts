import { createAgent, tool } from "langchain";
import { humanInTheLoopMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import z from "zod";
import { HumanMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import "dotenv/config";

function readEmail(emailId: string): string {
  /** Mock function to read an email by its ID. */
  return `Email content for ID: ${emailId}`;
}

const readEmailTool = tool(
  async (input) => {
    return readEmail(input.emailId);
  },
  {
    name: "",
    description: "",
    schema: z.object({
      emailId: z.string(),
    }),
  }
);

function sendEmail(recipient: string, subject: string, body: string): string {
  /** Mock function to send an email. */
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
      subject: z.string().describe("Subejct of mail"),
      body: z.string().describe("The body of mail"),
    }),
  }
);

const model = new ChatOpenAI({
  model: process.env.AI_MODEL,
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

const tools = [readEmailTool, sendEmailTool];

const agent = createAgent({
  model,
  tools,
  middleware: [
    humanInTheLoopMiddleware({
      interruptOn: {
        sendEmailTool: {
          allowedDecisions: ["approve", "edit", "reject"],
          description: "Sending email requires sernders permission",
        },
        readEmailTool: false,
        // false = Safe operation, no approval needed
        // try once with true =  All decisions (approve, edit, reject, respond) allowed
      },

      // Prefix for interrupt messages - combined with tool name and args to form the full message
      // e.g., "Tool execution pending approval: execute_sql(tool name) with (args) query='DELETE FROM...'"
      // Individual tools can override this by specifying a "description" in their interrupt config
      descriptionPrefix: "Tool execution pending approval",
    }),
  ],

  // Human-in-the-loop requires checkpointing(pausing & resuming from checkpoint) to handle interrupts.
  // In production, use a persistent checkpointer like AsyncPostgresSaver or MongoDBSaver.
  checkpointer: new MemorySaver(),
  //   You must configure a checkpointer to persist the graph state across interrupts.
});

// You must provide a thread ID to {{associate the execution with a conversation thread}},
// so the conversation can be paused and resumed (as is needed for human review).

const config = { configurable: { thread_id: "some_id" } };

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

for await (const message of stream.messages) {
  for await (const token of message.text) {
    process.stdout.write(token);
  }
}

// The interrupt contains the full HITL request with action_requests and review_configs
console.log(stream.interrupts);
// console.log(stream);

// Resume with approval decision
const resumeStream = await agent.streamEvents(
  new Command({
    resume: { decisions: [{ type: "approve" }] },
  }),
  { ...config, version: "v3" } // Same thread ID to resume the paused conversation
);

for await (const message of resumeStream.messages) {
  for await (const token of message.text) {
    process.stdout.write(token);
  }
}
