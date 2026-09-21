# Platform setup

One skill directory and one local stdio MCP server serve Claude Code, Codex,
Hermes and OpenClaw. Copying the skill installs instructions; registering the
server installs the browser tool. Both are required.

## Common runtime

On the machine that will execute the MCP server, build the repository with
`npm ci --ignore-scripts`, `npm run build`, then `npm run browser:install`.
Keep the checkout in a stable location. Node.js 22.18+ is required.

Save the following settings in a protected local environment file outside the
repository. Replace the key locally, not in a chat message:

```text
JEV_PROVIDER=vercel
AI_GATEWAY_API_KEY=<your Vercel AI Gateway key>
```

Restrict the file to the operating-system user running the server (for example,
mode 600 on macOS/Linux). The MCP launch arguments below let Node read this
file directly, even when the host filters inherited environment variables.
Existing environment values take precedence over Node's env-file values, so
remove conflicting provider settings from the host launch environment.

Optional field-text generation settings use the same Gateway account:

```text
JEV_BROWSER_TYPE_BASE_URL=https://ai-gateway.vercel.sh/v1
JEV_BROWSER_TYPE_API_KEY=<your Vercel AI Gateway key>
JEV_BROWSER_TYPE_MODEL=anthropic/claude-sonnet-4.6
```

The common server command is `node`; the two arguments are
`--env-file=/absolute/path/to/jev-browser.env` and
`/absolute/path/to/JevBrowser/dist/index.js`. Use absolute paths, including to
Node itself if a desktop/service process does not inherit your shell PATH.

## Install the skill

From the repository, preview all four personal skill destinations:

```sh
node scripts/install-skill.mjs --client all
```

After reviewing the destinations, add `--apply` to copy the skill, or select a
single client with `--client claude`, `codex`, `hermes` or `openclaw`. The installer
refuses to replace existing skills and never changes host configuration. It
works on macOS, Linux and Windows paths; browser/runtime execution still needs
the platform's supported Playwright environment.

| Client | Personal skill directory |
| --- | --- |
| Google Antigravity | `~/.gemini/config/skills/jev-browser/` |
| Claude Code | `~/.claude/skills/jev-browser/` |
| Codex | `~/.agents/skills/jev-browser/` |
| Hermes | `~/.hermes/skills/jev-browser/` |
| OpenClaw | `~/.openclaw/skills/jev-browser/` |

For non-default profiles or custom skill roots, copy this skill directory to
the configured skill root instead. Do not duplicate a skill in several roots
that the same host scans. No symlink support is required by this package.

## Google Antigravity

Merge this object into `~/.gemini/antigravity/mcp_config.json` (or `~/.gemini/config/mcp_config.json`):

```json
{
  "mcpServers": {
    "jev-browser": {
      "command": "node",
      "args": ["--env-file=/absolute/path/to/jev-browser.env", "/absolute/path/to/JevBrowser/dist/index.js"]
    }
  }
}
```

Antigravity will automatically discover the skill in `~/.gemini/config/skills/jev-browser/` and enforce the default browser automation guideline from `~/.gemini/config/rules/default-browser.md`.


## Claude Code

Register a user-scoped local server:

```sh
claude mcp add --transport stdio --scope user jev-browser -- node --env-file=/absolute/path/to/jev-browser.env /absolute/path/to/JevBrowser/dist/index.js
```

Use quotes around paths containing spaces. Confirm it with `claude mcp get
jev-browser` or `/mcp`, then invoke `/jev-browser` in a new session. For config
file use, the repository includes `integrations/claude.json`; merge only its
`jev-browser` entry with your existing MCP servers.

This route targets local Claude Code sessions. A local skill directory is not
an installation into claude.ai, Cowork or a cloud runner. The browser runtime
must run wherever the MCP server is started; this repository does not expose a
remote HTTP MCP service.

## Codex

Merge this block into your Codex `config.toml` (normally `~/.codex/config.toml`):

```toml
[mcp_servers.jev-browser]
command = "node"
args = ["--env-file=/absolute/path/to/jev-browser.env", "/absolute/path/to/JevBrowser/dist/index.js"]
startup_timeout_sec = 30
tool_timeout_sec = 210
enabled_tools = ["jev_navigate"]
```

Restart/reload the client and select `$jev-browser`. The desktop app, CLI and
IDE can use this local configuration when running on the same configured host.
A separate cloud environment needs its own runtime installation and credentials.

## Hermes

Merge an entry under `mcp_servers` in your profile's `config.yaml`:

```yaml
mcp_servers:
  jev-browser:
    command: node
    args:
      - --env-file=/absolute/path/to/jev-browser.env
      - /absolute/path/to/JevBrowser/dist/index.js
    timeout: 210
    tools:
      include: [jev_navigate]
```

Reload MCP or restart Hermes, and request the `jev-browser` skill. Use MCP
configuration, not Custom Endpoints: Jev's evaluation API is inside the tool.

## OpenClaw

Merge this object into the OpenClaw configuration on the runtime host:

```json
{
  "mcp": {
    "servers": {
      "jev-browser": {
        "command": "node",
        "args": ["--env-file=/absolute/path/to/jev-browser.env", "/absolute/path/to/JevBrowser/dist/index.js"],
        "requestTimeoutMs": 210000,
        "toolFilter": { "include": ["jev_navigate"] }
      }
    }
  }
}
```

Check `openclaw mcp probe jev-browser` and `openclaw skills list`. Request the
`jev-browser` skill. OpenClaw may present the tool with a server prefix. If a
sandbox or tool allowlist hides the server, enable only this server/tool through
the host's normal policy; do not disable the sandbox or broadly allow tools.
Older OpenClaw versions without native MCP need an upgrade or the CLI route
below if the user has already enabled local command execution.

## Generate configuration without hand-editing paths

The repository can print the correct host object using its actual Node binary
and runtime path:

```sh
node scripts/print-mcp-config.mjs --client codex --env-file /absolute/path/to/jev-browser.env
```

Select `claude`, `codex`, `hermes` or `openclaw`. This prints a snippet only; merge
it into the appropriate existing config, preserving unrelated settings. The
Hermes output is JSON, which is also valid YAML. Config files contain the path
to the secret file, not the secret. The generator does not read that file.

Client timeouts above allow the default 180-second run plus cleanup. Increase
the client timeout if you intentionally increase `max_seconds` beyond 180.

## CLI alternative

If the host has an authorized terminal tool but cannot expose MCP, it may run:

```sh
node --env-file=/absolute/path/to/jev-browser.env /absolute/path/to/JevBrowser/dist/index.js run "Read the page and summarize its purpose" https://example.com --max-steps 12 --max-seconds 90 --format markdown --no-screenshot
```

Pass task text and URLs as separately quoted arguments (or an argument array);
do not interpolate page text into shell code. Runtime security controls are the
same for CLI and MCP. Use `--allowed-hosts` for scoped extra hosts, and never
add typing/submission flags beyond the user's existing authorization.

## Compatibility and verification

The skill installer, generated configurations and MCP handshake are tested;
full interactive sessions in each vendor application are not certified by
these tests. After setup, verify that the host sees the tool, then run one
user-authorized public-page task. An unavailable tool is a setup problem, not
a reason to change the chat model or bypass installation/security checks.

Official references (checked 2026-09-20):

- [Claude Code skills](https://code.claude.com/docs/en/skills) and [MCP](https://code.claude.com/docs/en/mcp).
- [Codex skills](https://learn.chatgpt.com/docs/build-skills) and [MCP](https://learn.chatgpt.com/docs/extend/mcp?surface=cli).
- [Hermes skills](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills) and [MCP](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp).
- [OpenClaw skills](https://docs.openclaw.ai/tools/skills) and [MCP configuration](https://docs.openclaw.ai/gateway/config-extensions).
