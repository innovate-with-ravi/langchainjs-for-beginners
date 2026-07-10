import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config"; // necessary otherwise configuration-error

import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

/*just used to specify type in ts & do not include in final js*/
import { AIMessage, HumanMessage, SystemMessage, type BaseMessage } from "langchain";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

let messages: BaseMessage[] = [];
messages.push(new SystemMessage("You are a coding tutuor who teaches AI mainly"));

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

  let chunks = await model.stream(messages);
  let res = "";

  process.stdout.write("🤖: ");
  for await (const chunk of chunks) {
    const content = chunk.content.toString();

    if (content) {
      process.stdout.write(content);
      res += content;
    }
  }

  console.log();
  // Maintains conversation history
  messages.push(new AIMessage(res));

  // Shows the conversation history length after each exchange
  console.log(`Conversation length: ${messages.length}`);
}
