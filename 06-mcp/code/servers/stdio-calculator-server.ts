/**
 * Simple MCP Server for stdio Transport (Local Development)
 *
 * This server runs as a subprocess and communicates via stdio.
 * It's perfect for {{local development and testing}}.
 *
 * This file is used by 02-mcp-stdio-local.ts
 */

// learn more here: https://modelcontextprotocol.io/docs/develop/build-server#building-your-server-2

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { evaluate } from "mathjs";

// Create MCP server
const mcpServer = new Server(
  { name: "stdio-calculator", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// Define tools - ListToolsRequestSchema
mcpServer.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "calculate",
      description: "Perform mathematical calculations using mathjs",

      inputSchema: {
        type: "object",

        properties: {
          expression: {
            type: "string",
            description: "Math expression to evaluate (e.g., '2 + 2', 'sqrt(16)', 'sin(pi/2)')",
          },
        },
        required: ["expression"],
      },
    },
    {
      name: "convert_temperature",
      description: "Convert temperature between Celsius and Fahrenheit",

      inputSchema: {
        type: "object",

        properties: {
          value: { type: "number", description: "Temperature value to convert" },
          from: { type: "string", enum: ["celsius", "fahrenheit"], description: "Source unit" },
          to: { type: "string", enum: ["celsius", "fahrenheit"], description: "Target unit" },
        },
        required: ["value", "from", "to"],
      },
    },
  ],
}));

// Handle tool execution - CallToolRequestSchema
mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "calculate") {
    const { expression } = args as { expression: string };

    try {
      const result = evaluate(expression);
      return {
        content: [
          {
            type: "text",
            text: `${expression} = ${result}`,
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Invalid expression: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  if (name === "convert_temperature") {
    const { value, from, to } = args as { value: number; from: string; to: string };

    if (from === to) {
      return {
        content: [
          {
            type: "text",
            text: `${value}°${from.toUpperCase()[0]} = ${value}°${to.toUpperCase()[0]}`,
          },
        ],
      };
    }

    let result: number;
    if (from === "celsius" && to === "fahrenheit") {
      result = (value * 9) / 5 + 32;
    } else if (from === "fahrenheit" && to === "celsius") {
      result = ((value - 32) * 5) / 9;
    } else {
      throw new Error(`Invalid conversion: ${from} to ${to}`);
    }

    return {
      content: [
        {
          type: "text",
          text: `${value}°${from.toUpperCase()[0]} = ${result.toFixed(2)}°${to.toUpperCase()[0]}`,
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Connect via stdio transport
const transport = new StdioServerTransport();
await mcpServer.connect(transport);

// Log to stderr (stdout is used for MCP communication)
console.error("📟 stdio MCP Calculator Server running...");
console.error("🔧 Tools: calculate, convert_temperature");
