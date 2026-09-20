import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { jevNavigate } from "./jev/navigator.js";
import { taskSpace } from "./browser/task-space.js";
export async function startMcpServer(version = "0.1.0") {
    const server = new McpServer({
        name: "jev-browser",
        version,
    });
    const navigateHandler = async ({ task, start_url, max_steps, max_seconds, allow_typing, format, screenshot }) => {
        const result = await jevNavigate(task, start_url, {
            maxSteps: max_steps,
            maxSeconds: max_seconds,
            allowTyping: allow_typing,
            format: format ?? "markdown",
            screenshot: screenshot ?? "final",
        });
        const { screenshot_base64_jpeg, ...rest } = result;
        const content = [
            { type: "text", text: JSON.stringify(rest, null, 2) },
        ];
        if (screenshot_base64_jpeg) {
            content.push({ type: "image", data: screenshot_base64_jpeg, mimeType: "image/jpeg" });
        }
        return {
            content,
            isError: ["error", "timeout", "cancelled"].includes(result.status),
        };
    };
    const navigateSchema = {
        title: "Autonomous Navigation with Jev Browser",
        description: "Autonomously navigate a browser session to achieve a goal. " +
            "Powered by Jev decision intelligence with automatic snapshot interpretation, stop-gate evaluation, and step tracing.",
        inputSchema: {
            task: z.string().min(1).describe("What the agent should accomplish on the website."),
            start_url: z.string().url().describe("Starting HTTP(S) URL."),
            max_steps: z.number().int().min(1).max(100).optional().describe("Maximum autonomous steps (default 24)."),
            max_seconds: z.number().min(10).max(600).optional().describe("Maximum runtime in seconds (default 180)."),
            allow_typing: z.boolean().optional().describe("Allow typing into input fields (default false)."),
            format: z.enum(["text", "markdown"]).optional().describe("Format of final page extraction (default markdown)."),
            screenshot: z.enum(["final", "none"]).optional().describe("Whether to return final screenshot (default final)."),
        },
    };
    const snapshotHandler = async ({ task_space, page }) => {
        const ts = await taskSpace(task_space);
        const p = ts.page(page);
        const snap = await p.snapshot({ interactiveOnly: true, includeActionMarks: true });
        return {
            content: [{ type: "text", text: snap.content }],
        };
    };
    const snapshotSchema = {
        title: "Capture Jev Browser Structured Snapshot",
        description: "Captures a structured snapshot with action refs (@1, @2, etc.) from the active browser page.",
        inputSchema: {
            task_space: z.string().default("default").describe("Task space name."),
            page: z.string().default("p1").describe("Page label (default 'p1')."),
        },
    };
    server.registerTool("jev_browser_navigate", navigateSchema, navigateHandler);
    server.registerTool("jev_navigate", navigateSchema, navigateHandler);
    server.registerTool("jev_browser_snapshot", snapshotSchema, snapshotHandler);
    server.registerTool("jev_snapshot", snapshotSchema, snapshotHandler);
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error(`[jev-browser] ready — MCP stdio server active`);
}
//# sourceMappingURL=mcp.js.map