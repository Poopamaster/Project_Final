import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

// สร้าง Server Instance
const server = new Server(
  {
    name: "my-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// นิยาม Tools ที่ AI เรียกใช้ได้
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "get_server_status",
        description: "Get the status of the backend server",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
    ],
  };
});

// Logic เมื่อ Tool ถูกเรียกใช้งาน
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "get_server_status") {
    return {
      content: [
        {
          type: "text",
          text: "Backend Server is active and ready.",
        },
      ],
    };
  }
  throw new Error("Tool not found");
});

// เริ่มต้น Server ผ่าน Stdio (Standard Input/Output)
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});