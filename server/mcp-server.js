import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { getJson } from "serpapi";

const SERPAPI_KEY = process.env.SERPAPI_KEY?.trim();

const formatSearchError = (error) => {
  if (!error) {
    return "Unknown web search error.";
  }

  if (typeof error === "string") {
    return error;
  }

  if (error.message) {
    return error.message;
  }

  if (error.error) {
    return error.error;
  }

  return JSON.stringify(error);
};

// Create MCP server instance
const server = new McpServer({
  name: "serpapi-search",
  version: "1.0.0",
});

// Register the search tool
server.registerTool(
  "search_web",
  {
    description:
      "Search the web using SerpAPI. Returns search results including organic results, snippets, and related information.",
    inputSchema: {
      query: z.string().describe("The search query to execute"),
      num: z
        .number()
        .optional()
        .describe("Number of results to return (default: 10)"),
    },
  },
  async ({ query, num = 10 }) => {
    try {
      if (!SERPAPI_KEY) {
        throw new Error(
          "SERPAPI_KEY is missing. Set it before starting the backend."
        );
      }

      const results = await getJson({
        engine: "google",
        q: query,
        num: num,
        api_key: SERPAPI_KEY,
      });

      if (results?.error) {
        throw new Error(`SerpAPI returned an error: ${results.error}`);
      }

      // Return all results as plain text
      const fullResults = JSON.stringify(results);

      return {
        content: [
          {
            type: "text",
            text: fullResults,
          },
        ],
      };
    } catch (error) {
      const errorMessage = formatSearchError(error);
      console.error("[MCP] Web search failed:", {
        query,
        error: errorMessage,
      });

      return {
        content: [
          {
            type: "text",
            text: `Error performing web search: ${errorMessage}`,
          },
        ],
      };
    }
  }
);

// Main function to run the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("SerpAPI MCP Server running on stdio");
}

// Always run the server when this file is executed
// This is needed when spawned as a child process
main().catch((error) => {
  console.error("Fatal error in MCP server:", error);
  process.exit(1);
});

export default server;
