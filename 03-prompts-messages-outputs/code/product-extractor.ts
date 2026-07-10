import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import "dotenv/config";
import z from "zod";

const productSchema = z.object({
  name: z.string().describe("Name of product"),
  price: z.number().positive().describe("Price of product in dollars").default(1),
  category: z
    .enum(["Electronics", "Clothing", "Food", "Books", "Home"])
    .describe("Category to which product belongs")
    .nullish(),
  inStock: z.boolean().describe("Whether the product is availabe or out-of-stock"),
  rating: z.number().min(1).max(5).describe("The ratings from 1 to 5 enclosed").nullish(),
  features: z.array(z.string()).describe("Key Features of product").nullish(),
});

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
  temperature: 0,
});

const structuredModel = model.withStructuredOutput(productSchema, { strict: true });

const temp = ChatPromptTemplate.fromMessages([
  ["system", "Extract product information from given product description."],
  ["human", "product description: {input}"],
]);

const chain = temp.pipe(structuredModel);

const inputs = [
  "MacBook Pro 16-inch with M3 chip, $2,499. Currently in stock. Users rate it 4.8/5. Features: Liquid Retina display, 18-hour battery, 1TB SSD",
  "Cozy wool sweater, blue color, medium size. $89, available now! Customers love it - 4.5 stars. Hand-washable, made in Ireland",
  "The Great Gatsby by F. Scott Fitzgerald. Classic novel, paperback edition for $12.99. In stock. Rated 4.9 stars. 180 pages, published 1925",
];

for (const inp of inputs) {
  console.log(await chain.invoke({ input: inp }));
}
