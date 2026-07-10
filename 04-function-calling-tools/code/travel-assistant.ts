// 1. Import required modules
import { ChatOpenAI } from "@langchain/openai";
import { tool } from "langchain";
import * as z from "zod";
import "dotenv/config";

const model = new ChatOpenAI({
  model: process.env.AI_MODEL,
  configuration: { baseURL: process.env.AI_ENDPOINT },
  apiKey: process.env.AI_API_KEY,
});

const CurrencyConverter = tool(
    async (input)=>{
        // amount from & to
    }
)