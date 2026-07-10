import { ChatOpenAI } from "@langchain/openai";
import z from "zod";
import "dotenv/config";
import { tool } from "langchain";

const weatherTool = tool(
  async (input) => {
    // always specify type of maps (like: type) as it avoid typeof key issues
    const fTemp: Record<string, number> = { indore: 62, dehli: 55, mumbai: 65, goa: 80, tokyo: 55 };
    const cTemp: Record<string, number> = { indore: 24, dehli: 20, mumbai: 25, goa: 35, tokyo: 20 };
    const weather: Record<string, string> = {
      indore: "sunny",
      dehli: "cold",
      mumbai: "windy",
      goa: "sunny",
      tokyo: "rainy",
    };

    const city: string = input.city;
    const units: string = input.units;

    let temp: string =
      units.toLowerCase() == "celsius"
        ? `${cTemp[city]}C, ${weather[city]}`
        : `${fTemp[city]}F, ${weather[city]}`;

    if (!Object.keys(weather).includes(city)) temp = `80F, sunny`;

    return `Temperature in ${city} is ${temp}`;
  },
  {
    name: "getWeather",
    description: "Get current weather for a city",
    schema: z.object({
      city: z.string().describe("City whose temperature is to be found"),
      units: z
        .enum(["celsius", "fahrenheit"])
        .describe("The unit in which user likes to know temperature"),
    }),
  }
);

const model = new ChatOpenAI({
  model: process.env.AI_MODEL,
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

const queries = [
  "What's the weather in Tokyo?",
  "Tell me the temperature in Paris in celsius",
  "Is it raining in London?",
];
const modelWithTool = model.bindTools([weatherTool]);

for (const q of queries) {
  // step1: planning
  const planning = await modelWithTool.invoke(q);
  const toolCall = planning.tool_calls ? planning.tool_calls[0] : null;

  if (toolCall && toolCall.name == "getWeather") {
    // Step 2: Execute the tool

    const toolRes = await weatherTool.invoke(
      weatherTool.schema.parse(toolCall.args) /*send the parsed args*/
    );

    console.log("toolRes:", toolRes);

    const finalRes = await modelWithTool.invoke([
      { role: "human", content: q },
      planning,
      { role: "tool", content: toolRes, tool_call_id: toolCall.id },
    ]);

    console.log(finalRes.content);
  }
}
