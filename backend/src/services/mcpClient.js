const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const path = require("path");
const fs = require("fs");

const mcpServerScriptPath = path.resolve(__dirname, "../../../mcp-server/dist/index.js");

console.log("Checking MCP Server Path:", mcpServerScriptPath);
if (!fs.existsSync(mcpServerScriptPath)) {
    console.error("Error: Could not find MCP Server file. Did you run 'npm run build' in mcp-server?");
    process.exit(1);
}

const transport = new StdioClientTransport({
    command: "node",
    args: [mcpServerScriptPath],
});

const client = new Client(
    {
        name: "cinema-backend-client",
        version: "1.0.0",
    },
    {
        capabilities: {},
    }
);

async function startMcpClient() {
    try {
        console.log("Connecting to MCP Server...");
        await client.connect(transport);
        console.log("Connected to MCP Server!");

        const tools = await client.listTools();
        console.log("\n--- Available Tools ---");
        console.log(JSON.stringify(tools, null, 2));
        console.log("-----------------------\n");
        
        return client;
    } catch (error) {
        console.error("Failed to connect to MCP Server:", error);
    }
}

module.exports = { startMcpClient, client };