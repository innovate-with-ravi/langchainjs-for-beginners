import { ChatPromptTemplate, FewShotChatMessagePromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";
import z from "zod";

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
  temperature: 0,
});

// examples[i] = {input: string, output: string}
const examples = [
  {
    input: "Premium wireless headphones with noise cancellation, $199",
    // python f-string gets confused so we added {{
    // also enclose keys in ""
    output: `{{
      "name": "Headphones",
      "price": 199,
      "category": "Wireless",
      "highlights": ["Noise Cancellation"],
  }}`,
  },
  {
    input: "Organic cotton t-shirt in blue, comfortable fit, $29.99",
    output: `{{
      "name": "t-shirt",
      "price": 29.99,
      "category": "Blue",
      "highlights": ["Comfortable fit", "Organic Cotton"],
  }}`,
  },
  {
    input: "Gaming laptop with RTX 4070, 32GB RAM, $1,499",
    output: `{{
      "name": "Laptop",
      "price": 1499,
      "category": "Gaming",
      "highlights": ["RTX 4070", "32GB RAM"],
  }}`,
  },
];

const exampleTemplate = ChatPromptTemplate.fromMessages([
  ["human", "Product Description: {input}"],
  ["ai", "JSON: {output}"],
]);

const fewShotTemplate = new FewShotChatMessagePromptTemplate({
  examplePrompt: exampleTemplate,
  examples: examples,
  inputVariables: [],
});

// console.log(await fewShotTemplate.format([]));

const finalTemplate = ChatPromptTemplate.fromMessages([
  ["system", "Generate structured output for given product description based on examples"],
  fewShotTemplate as any,
  ["human", "product description: {description}"],
]);

const productSchema = z.object({
  name: z.string().describe("Name of product"),
  price: z.number().positive().describe("Price of product in dollars"),
  category: z.string().describe("Category to which product belongs"),
  highlight: z.array(z.string()).describe("Key Features of product"),
});

const structuredModel = model.withStructuredOutput(productSchema, { strict: true });
// const chain = finalTemplate.pipe(structuredModel);
const chain = finalTemplate.pipe(model);

const testDescriptions = [
  "Waterproof smartwatch with heart rate monitor and GPS tracking, $249.50",
  "Stainless steel espresso machine with built-in milk frother, $350",
  "Lightweight running shoes in neon green, breathable mesh, $120",
  "Ergonomic mesh office chair with lumbar support and adjustable armrests, $185.99",
  "Indoor potted Monstera plant, 2 feet tall, low maintenance, $45",
  "Hardcover sci-fi novel, signed first edition, 400 pages, $28",
  "Water-resistant travel backpack with 15-inch laptop sleeve, 30L capacity, $89.99",
  "Hydrating facial serum with hyaluronic acid and vitamin C, 30ml, $42",
  "Cordless power drill kit with 2 batteries and 50-piece accessory set, $115",
  "Orthopedic dog bed for large breeds, machine washable cover, grey, $75.50",
];

for (const desc of testDescriptions) {
  const res = await chain.invoke({ description: desc });

  console.log(res.content);
}
