import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { movieTools } from "./tools/movieTools.js";

interface Tool {
  name: string;
  description: string;
  args: any;
  handler: (...args: any[]) => any;
}

const server = new McpServer({
  name: "cinema-customer-mcp",
  version: "1.0.0",
});

// โหลดเฉพาะเครื่องมือของ Customer
movieTools.forEach((tool: Tool) => {
  server.tool(
      tool.name,
      tool.description,
      tool.args,
      tool.handler
  );
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🍿 Customer MCP Server started! (Access: Movie Tools)");
}

main();