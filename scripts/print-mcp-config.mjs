#!/usr/bin/env node
import * as path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");
const binPath = path.join(projectRoot, "dist", "index.js");

const configs = {
  claudeDesktop: {
    mcpServers: {
      "jev-browser": {
        command: "node",
        args: [binPath, "mcp"],
        env: {
          JEV_PROVIDER: "vercel",
          AI_GATEWAY_API_KEY: "${AI_GATEWAY_API_KEY}",
        },
      },
    },
  },
  cursor: {
    "mcp.servers": {
      "jev-browser": {
        command: "node",
        args: [binPath, "mcp"],
      },
    },
  },
  codexToml: `[mcp.servers.jev-browser]
command = "node"
args = ["${binPath}", "mcp"]
env = { JEV_PROVIDER = "vercel" }
`,
};

console.log("=== Jev Browser MCP Configurations ===\n");
console.log("1. Claude Desktop (~/Library/Application Support/Claude/claude_desktop_config.json):");
console.log(JSON.stringify(configs.claudeDesktop, null, 2));
console.log("\n2. Cursor / Windsurf Settings:");
console.log(JSON.stringify(configs.cursor, null, 2));
console.log("\n3. Codex (codex.toml):");
console.log(configs.codexToml);
