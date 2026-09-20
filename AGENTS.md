# Jev Browser Guidelines for AI Agents

## Project Overview

`jev-browser` is an autonomous browser automation platform for AI agents powered by Jev (`typesafe-ai/jev`) decision intelligence. It provides:
1. **Isolated Task Spaces**: Isolated workspaces where agents browse without interrupting users.
2. **Dual Execution Runtime**:
   - Native desktop bridge when local browser bindings are available.
   - Headless Playwright Chromium for CI/CD, cloud containers, and headless environments.
3. **Probabilistic Action Compilation**: Viewport elements compiled to clean criteria with automatic backtracking on stuck states.
4. **Model Context Protocol (MCP)**: Native stdio server exposing `jev_browser_navigate` and `jev_browser_snapshot`.

---

## Directory Layout

- `src/` — Main TypeScript codebase:
  - `src/browser/` — Task space management, Page abstractions, snapshot parser, native bridge, and standalone driver.
  - `src/jev/` — Jev decision intelligence (navigator, provider, questions, compiler, security).
  - `src/cli.ts` — CLI runner (`run`, `nodejs`, `mcp`).
  - `src/mcp.ts` — Model Context Protocol stdio server.
  - `src/library.ts` — Programmatic SDK exports.
- `skills/jev-browser/` — Agent skill package for Claude Code, Codex, Hermes, OpenClaw, Antigravity.
- `scripts/` — Installation (`install-skill.mjs`), MCP configuration (`print-mcp-config.mjs`), and validation (`validate-skill.mjs`).
- `test/` — Node.js native test suite (`unit.test.mjs`, `compiler.test.mjs`, `install.test.mjs`).
- `dist/` — Compiled JavaScript output.

---

## Development Commands

```bash
# Build TypeScript
npm run build

# Run test suite
npm test

# Complete check (typecheck, build, test, validate)
npm run check

# Install skill to system agent clients
node scripts/install-skill.mjs
```
