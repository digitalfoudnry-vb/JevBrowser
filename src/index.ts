#!/usr/bin/env node
// jev-browser: a Jev-driven browser agent.
//   jev-browser run "<task>" <url> [options]   CLI
//   jev-browser                                 MCP stdio server

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { createRequire } from "node:module";
import { navigate } from "./navigate.js";
import { runCli, runNodejsCli } from "./cli.js";

if (process.argv[2] === "run") {
  process.exit(await runCli(process.argv.slice(3)));
}
if (process.argv[2] === "nodejs") {
  process.exit(await runNodejsCli(process.argv.slice(3)));
}
if (process.argv[2] === "--help" || process.argv[2] === "-h") {
  process.exit(await runCli(["--help"]));
}

// Resolved at runtime so the MCP handshake version always matches the package.
const { version: packageVersion } = createRequire(import.meta.url)("../package.json") as { version: string };

const server = new McpServer({ name: "jev-browser", version: packageVersion });

const navigateConfig = {
  annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
  title: "Navigate a browser with Jev",
  description:
    "Give a task and a start URL; a Jev-driven agent navigates a real headless browser until the goal is met, " +
    "the stuck gate fires, or a budget (steps/seconds) is exhausted. Returns the final page in a chosen format " +
    "(text, markdown, html, or an aria snapshot), the full step trace with confidences, console/page/network " +
    "errors captured along the way, token usage with estimated cost, and a final screenshot.",
  inputSchema: {
    task: z.string().min(1).max(10_000).describe("What the agent should accomplish, in natural language."),
    start_url: z
      .string()
      .url()
      .refine((v) => /^https?:\/\//.test(v), "start_url must be an http(s) URL")
      .describe("Where to start."),
    max_steps: z.number().int().min(1).max(100).optional().describe("Hard step cap. Default 24."),
    max_seconds: z.number().min(10).max(600).optional().describe("Wall-clock cap in seconds. Default 180."),
    allow_typing: z.boolean().optional().describe("Permit field entry only when authorized by the user. Default false."),
    submit_after_typing: z.boolean().optional().describe("Press Enter after filling; requires allow_typing and allow_mutations. Default false."),
    allow_mutations: z.boolean().optional().describe("Permit non-GET/HEAD/OPTIONS requests for a user-authorized workflow. Default false."),
    allowed_hosts: z.array(z.string().max(253)).max(50).optional().describe("Exact public hosts authorized for this task, including resources. Defaults to the start host; no wildcards."),
    format: z
      .enum(["text", "markdown", "html", "aria"])
      .optional()
      .describe(
        "Final page payload format: text (default, 8k chars), markdown (16k, via turndown), " +
          "html (1MB, for app-side parsing), aria (16k, Playwright aria snapshot YAML).",
      ),
    max_chars: z.number().int().min(100).optional().describe("Override the format's default character cap."),
    screenshot: z.enum(["final", "none"]).optional().describe("Final viewport JPEG. Default 'final'."),
  },
};

const navigateHandler = async ({ task, start_url, ...rest }: any, extra: any) => {
  const result = await navigate(
    {
      task,
      startUrl: start_url,
      maxSteps: rest.max_steps,
      maxSeconds: rest.max_seconds,
      allowTyping: rest.allow_typing,
      submitAfterTyping: rest.submit_after_typing,
      allowMutations: rest.allow_mutations,
      allowedHosts: rest.allowed_hosts,
      format: rest.format,
      maxChars: rest.max_chars,
      screenshot: rest.screenshot,
    },
    extra.signal,
  );

  const { screenshot_base64_jpeg, ...json } = result as Record<string, unknown>;
  const content: Array<{ type: "text"; text: string } | { type: "image"; data: string; mimeType: string }> = [
    { type: "text", text: JSON.stringify(json, null, 2) },
  ];
  if (typeof screenshot_base64_jpeg === "string") {
    content.push({ type: "image", data: screenshot_base64_jpeg, mimeType: "image/jpeg" });
  }
  return { content, isError: ["error", "timeout", "cancelled"].includes(String(json.status)) };
};

  server.registerTool("jev_navigate", navigateConfig, navigateHandler);

  await server.connect(new StdioServerTransport());
  console.error(`[jev-browser] ready — Jev model ${process.env.JEV_BROWSER_MODEL ?? "jev-latest"}`);
