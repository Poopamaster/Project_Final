import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { adminTools } from "./tools/adminTools.js";
import { movieTools } from "./tools/movieTools.js"; // 🌟 1. Import movieTools เข้ามาด้วย

interface Tool {
  name: string;
  description: string;
  args: any;
  handler: (...args: any[]) => any;
}

const server = new McpServer({
  name: "cinema-admin-mcp",
  version: "1.0.0",
});

// 🌟 2. โหลดเครื่องมือของ Admin (งานหลังบ้าน)
adminTools.forEach((tool: Tool) => {
  server.tool(
      tool.name,
      tool.description,
      tool.args,
      tool.handler
  );
});

// 🌟 3. โหลดเครื่องมือของ Customer ให้ Admin ใช้ด้วย! (งานหน้าบ้าน)
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
  console.error("🛠️ Admin MCP Server started! (Access: Admin + Movie Tools)");
}

main();