# Hermes installation

The browser runtime and the skill are two separate components. Hermes keeps its current chat model and calls Jev for browser decisions through MCP.

1. Clone this repository and follow the README setup to build the server and install Chromium.
2. Store the Vercel AI Gateway key in a protected environment file or secret mechanism available to Hermes. Do not paste the key into chat. Hermes filters subprocess environments, so map required variables explicitly.
3. Merge the following entry into `~/.hermes/config.yaml`, preserving existing servers. Replace the absolute path. If `node` is not on the Hermes service's PATH, use its absolute executable path.

```yaml
mcp_servers:
  jev-browser:
    command: node
    args:
      - /absolute/path/to/jev-browser-skill/dist/index.js
    env:
      JEV_PROVIDER: vercel
      AI_GATEWAY_API_KEY: "${AI_GATEWAY_API_KEY}"
      JEV_BROWSER_TYPE_BASE_URL: https://ai-gateway.vercel.sh/v1
      JEV_BROWSER_TYPE_MODEL: anthropic/claude-sonnet-4.6
      JEV_BROWSER_TYPE_API_KEY: "${AI_GATEWAY_API_KEY}"
    tools:
      include: [jev_navigate]
```

The last three variables enable the optional field-text model. Omit them for navigation-only use.

4. Copy `jevskills/jev-browser/` from this checkout to `~/.hermes/skills/jev-browser/`. If that destination already exists, inspect it before replacing anything. For another Hermes profile, use that profile's skills directory.
5. Reload MCP or restart Hermes. Confirm that its tool list contains `jev_navigate` (possibly prefixed by the client). Ask: “Use the jev-browser skill to read https://example.com and summarize what the page says.”

No entry in Hermes's Custom Endpoints screen is needed for this tool. Vercel's evaluation API is called inside the MCP server.

The repository is public. The reusable skill lives at `jevskills/jev-browser/`; this is a non-default skill path, so use that path explicitly with installers or copy the folder as described above. Do not bypass a failed skill security scan; investigate its actual finding.

References: [Hermes MCP documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/mcp), [Hermes skills documentation](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills).
