import { jevNavigate } from "./jev/navigator.js";
import { safeError } from "./jev/security.js";
import { taskSpace, profiles, listTaskSpaces } from "./browser/task-space.js";
import { startMcpServer } from "./mcp.js";
import * as fs from "node:fs/promises";
import { dirname } from "node:path";
const HELP = `jev-browser: Autonomous AI Browser powered by Jev intelligence.

Usage:
  jev-browser run "<task>" <start-url> [options]    Autonomous Jev navigation
  jev-browser nodejs                               Execute JavaScript with pre-imported browser & Jev helpers
  jev-browser mcp                                  Run as stdio Model Context Protocol server
  jev-browser                                      Start MCP stdio server (when run by agent)

Options for "run":
  --max-steps <n>       Maximum autonomous steps (default 24)
  --max-seconds <n>     Maximum runtime in seconds (default 180)
  --allow-typing        Enable typing into input fields (off by default)
  --format <fmt>        Output format: markdown (default), text
  --screenshot <path>   Save final screenshot JPEG to file
  --no-screenshot       Disable screenshot capture
  -h, --help            Show this message

Environment:
  JEV_PROVIDER          vercel (default), typesafe, openrouter, or cloudflare
  AI_GATEWAY_API_KEY    Vercel AI Gateway key (when JEV_PROVIDER=vercel)
  TYPESAFE_API_KEY      TypeSafe API key (when JEV_PROVIDER=typesafe)
`;
export async function runCli(argv) {
    if (argv.length === 0 || argv[0] === "mcp") {
        await startMcpServer();
        return 0;
    }
    const cmd = argv[0];
    if (cmd === "--help" || cmd === "-h") {
        console.log(HELP);
        return 0;
    }
    if (cmd === "run") {
        const runArgs = argv.slice(1);
        let task;
        let startUrl;
        let maxSteps = 24;
        let maxSeconds = 180;
        let allowTyping = false;
        let format = "markdown";
        let screenshotPath;
        let noScreenshot = false;
        const positional = [];
        for (let i = 0; i < runArgs.length; i++) {
            const arg = runArgs[i];
            if (arg === "--max-steps" && runArgs[i + 1])
                maxSteps = Number(runArgs[++i]);
            else if (arg === "--max-seconds" && runArgs[i + 1])
                maxSeconds = Number(runArgs[++i]);
            else if (arg === "--allow-typing")
                allowTyping = true;
            else if (arg === "--format" && runArgs[i + 1])
                format = runArgs[++i];
            else if (arg === "--screenshot" && runArgs[i + 1])
                screenshotPath = runArgs[++i];
            else if (arg === "--no-screenshot")
                noScreenshot = true;
            else if (arg === "--help" || arg === "-h") {
                console.log(HELP);
                return 0;
            }
            else if (!arg.startsWith("-")) {
                positional.push(arg);
            }
        }
        if (positional.length < 2) {
            console.error("Error: 'run' requires both a task and start URL.\n" + HELP);
            return 1;
        }
        task = positional[0];
        startUrl = positional[1];
        try {
            const result = await jevNavigate(task, startUrl, {
                maxSteps,
                maxSeconds,
                allowTyping,
                format,
                screenshot: noScreenshot ? "none" : "final",
            });
            if (screenshotPath && result.screenshot_base64_jpeg) {
                await fs.mkdir(dirname(screenshotPath), { recursive: true });
                await fs.writeFile(screenshotPath, Buffer.from(result.screenshot_base64_jpeg, "base64"));
                delete result.screenshot_base64_jpeg;
                result.screenshot_saved_to = screenshotPath;
            }
            console.log(JSON.stringify(result, null, 2));
            return ["done", "goal_achieved"].includes(result.status) ? 0 : 1;
        }
        catch (err) {
            console.error(safeError(err));
            return 1;
        }
    }
    if (cmd === "nodejs" || cmd === "-e") {
        // Heredoc or script execution mode
        let scriptCode = "";
        if (cmd === "-e" && argv[1]) {
            scriptCode = argv[1];
        }
        else {
            // Read from stdin
            const chunks = [];
            for await (const chunk of process.stdin) {
                chunks.push(Buffer.from(chunk));
            }
            scriptCode = Buffer.concat(chunks).toString("utf8");
        }
        if (!scriptCode.trim()) {
            console.error("No script provided to nodejs execution mode");
            return 1;
        }
        try {
            const asyncFn = new Function("taskSpace", "profiles", "listTaskSpaces", "jevNavigate", `return (async () => {
          ${scriptCode}
        })();`);
            await asyncFn(taskSpace, profiles, listTaskSpaces, jevNavigate);
            return 0;
        }
        catch (err) {
            console.error(safeError(err));
            return 1;
        }
    }
    console.error(`Unknown command: ${cmd}\n${HELP}`);
    return 1;
}
//# sourceMappingURL=cli.js.map