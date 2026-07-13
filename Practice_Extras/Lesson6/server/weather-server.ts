import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio";
import z from "zod";

// Create server instance
const mcpServer = new McpServer({
  name: "weather",
  version: "1.0.0",
});

// Helper function for making NWS API requests
mcpServer.registerTool(
  // name
  "get_forecast",
  // details object {title, description, inputSchema}
  {
    title: "get_forecast",
    description: "Get the current weather forecast for a location.",
    inputSchema: z.object({
      city: z.string().describe("The name of the city to check weather for"),
    }),
  },
  // callback - work to do? function to execute
  async ({ city }) => {
    // Pure mock data to isolate the connection layer
    const lowerCity = city.toLowerCase().trim();
    let forecastText = "72°F and partly cloudy";

    if (lowerCity.includes("indore")) forecastText = "32°C and sunny";
    if (lowerCity.includes("tokyo")) forecastText = "20°C and rainy";

    // notice:
    /* 
    return {
      content:[
      {type, text}
      ]
    }
    */
    return {
      content: [{ type: "text", text: `The current forecast for ${city} is ${forecastText}.` }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await mcpServer.connect(transport);

  console.error("Weather MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error inside main execution block:", error);
  process.exit(1);
});
