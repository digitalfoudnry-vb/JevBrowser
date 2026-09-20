<div align="center">

<img src="assets/logo.png" alt="Jev Browser Logo" width="180" />

# 🌐 Jev Browser
### *Autonomous AI Browser powered by Jev Decision Intelligence*

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](tsconfig.json)
[![Tests: 100% Passing](https://img.shields.io/badge/Tests-10%2F10%20Passing-brightgreen.svg)](test)
[![MCP Compliant](https://img.shields.io/badge/MCP-1.17-purple.svg)](src/mcp.ts)

</div>

---

## 💡 Overview

**Jev Browser** is a high-performance browser automation environment designed for autonomous AI agents:
1. **Isolated Task Spaces**:
   - Run parallel browser tasks in isolated workspaces without interfering with user browsing.
   - Support for multiple concurrent tabs and shared session continuity.
   - Real-time visual feedback and action descriptions.
   - Fast, compact accessibility snapshots with `@ref` indexing (`@1`, `@2`, ...).

2. **Jev Autonomous Decision Intelligence (`typesafe-ai/jev`)**:
   - **Probabilistic Action Compilation**: Viewport interactive elements are compiled into clean discrete criteria with fallback ranking.
   - **Stuck-State Self-Healing**: Automatically detects loop traps and tests viable branch alternates.
   - **Multi-Provider AI Gateway**: Built-in adapters for Vercel AI Gateway, TypeSafe SDK, OpenRouter, and Cloudflare Workers AI.
   - **Universal Dual-Mode Execution**: Operates inside native browser desktop sessions when running locally, or falls back to headless Chromium when executing in CI, cloud servers, or containerized agents.

---

## 🚀 Quick Start

### 1. Installation

```bash
# Clone and build
git clone https://github.com/digitalfoudnry-vb/JevBrowser.git
cd JevBrowser
npm install
npm run build

# Link binary globally
npm link
```

### 2. Autonomous Navigation CLI

Run an autonomous research goal end-to-end without writing any code:

```bash
jev-browser run "Find the latest release notes and key changes for Node.js 22" "https://nodejs.org"
```

Useful CLI Options:
- `--max-steps <n>`: Maximum autonomous navigation steps (default: `24`).
- `--max-seconds <n>`: Maximum execution timeout in seconds (default: `180`).
- `--allow-typing`: Enable text and search query input.
- `--screenshot <path>`: Save a final screenshot JPEG to disk.
- `--format <text|markdown>`: Format of the returned markdown report.

### 3. Scripting via Heredoc

Run scripts with full browser APIs (`taskSpace`, `page`, `goto`, `snapshot`, `click`, `fill`) alongside Jev helpers:

```bash
jev-browser nodejs <<'EOF'
const task = await taskSpace("market research");
const page = task.page("p1");

await page.goto("https://news.ycombinator.com");
console.log("Space ID:", task.spaceId);

const snap = await page.snapshot();
console.log(snap.content);

// Click an element using ref
await page.click("@1", { label: "Open first discussion" });
EOF
```

Single-line execution:
```bash
jev-browser nodejs -e '
const task = await taskSpace("health check");
const page = task.page("p1");
await page.goto("https://example.com");
console.log(await page.snapshot());
'
```

---

## 🤖 Multi-Client Agent Skills

`jev-browser` includes pre-packaged skills and one-click installers for all major AI coding agents:

```bash
# Preview destinations
node scripts/install-skill.mjs --dry-run

# Install to all detected clients on your system
node scripts/install-skill.mjs
```

Supported Clients:
- **Claude Code**: `~/.claude/skills/jev-browser`
- **OpenAI Codex CLI**: `~/.codex/skills/jev-browser`
- **Hermes Agent**: `~/.hermes/skills/jev-browser`
- **OpenClaw**: `~/.openclaw/skills/jev-browser`
- **Google Antigravity**: `~/.gemini/config/skills/jev-browser`

---

## 🔌 Model Context Protocol (MCP)

`jev-browser` exposes an MCP stdio server with tools:
- `jev_browser_navigate`: Fully autonomous goal execution with markdown reporting.
- `jev_browser_snapshot`: Extract structured accessibility snapshot with `@ref` locators.

### MCP Configuration

Run `node scripts/print-mcp-config.mjs` to view auto-generated config for your tools, or add:

#### Claude Desktop (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "jev-browser": {
      "command": "node",
      "args": ["/path/to/JevBrowser/dist/index.js", "mcp"],
      "env": {
        "JEV_PROVIDER": "vercel",
        "AI_GATEWAY_API_KEY": "your-key"
      }
    }
  }
}
```

#### Codex (`codex.toml`)
```toml
[mcp.servers.jev-browser]
command = "node"
args = ["/path/to/JevBrowser/dist/index.js", "mcp"]
env = { JEV_PROVIDER = "vercel" }
```

---

## ⚙️ Architecture & Dual-Mode Runtime

```
                 +-------------------------------------------------------+
                 |              CLI / Agent / MCP Request                |
                 +-------------------------------------------------------+
                                             |
                                  [taskSpace("task")]
                                             |
                     +-----------------------+-----------------------+
                     |                                               |
         (Native Desktop Available?)                       (Headless / Server)
                     v                                               v
        +--------------------------+                   +---------------------------+
        |   Native Browser Bridge  |                   |   Standalone Chromium     |
        |                          |                   |      (Playwright)         |
        | - Active browser profile |                   | - Headless execution      |
        | - Visual mouse cursor    |                   | - Isolated sandbox        |
        | - Desktop tab spaces     |                   | - Cross-platform (CI/CD)  |
        +--------------------------+                   +---------------------------+
                     |                                               |
                     +-----------------------+-----------------------+
                                             |
                                             v
                           +-----------------------------------+
                           |        Jev Decision Engine        |
                           |                                   |
                           | - Structured Snapshot Parser      |
                           | - Action-Space Compiler (max 240) |
                           | - SSRF / Loopback Guard           |
                           | - Self-Healing Probabilistic Loop |
                           +-----------------------------------+
```

---

## 🔒 Security & Safe Browsing

- **SSRF / RFC1918 Guard**: Blocks access to loopback (`127.0.0.1`), LAN subnets (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`), metadata IP (`169.254.169.254`), and CGNAT.
- **Port Restriction**: Restricts web traffic to ports 80 and 443.
- **Credential Protection**: Redacts sensitive API keys and authorization tokens from logs and error traces.
- **Action Sandbox**: Restricts agent decisions strictly to elements compiled from the verified snapshot.

---

## 🧪 Testing & Verification

Run the entire test suite:

```bash
# Run unit, compiler, and installer tests
npm test

# Validate skills and package compliance
npm run validate:skill
```

---

## 📄 License

MIT License. Copyright (c) 2026 digitalfoundry.