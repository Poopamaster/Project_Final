// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { movieTools } from "./tools/movieTools.js";
import { adminTools } from "./tools/adminTools.js";

// เพิ่ม interface สำหรับ Tool
interface Tool {
  name: string;
  args: any;
  handler: (...args: any[]) => any;
}

const server = new McpServer({
  name: "cinema-mcp-server",
  version: "1.0.0",
});

// รวม Tools ทั้งหมดไว้ใน Array เดียว พร้อม type
const allTools: Tool[] = [...movieTools, ...adminTools];

// วนลูป Register Tools อัตโนมัติ
allTools.forEach((tool) => {
  server.tool(tool.name, tool.args, tool.handler);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Cinema MCP Server started with Modular Architecture! 🚀");
}

main();