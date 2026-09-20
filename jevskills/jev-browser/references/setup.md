# Setup

Requires Node.js 22.18+ and a local checkout of `digitalfoudnry-vb/JevBrowser`. Use this repository, not the original npm package: the original does not contain this fork's controls.

From the checkout, install the locked dependencies with `npm ci --ignore-scripts`, run `npm run build`, and explicitly install Chromium with `npm run browser:install`. These are setup operations, not needed on each browsing request.

For Vercel decisions, configure `JEV_PROVIDER=vercel` and `AI_GATEWAY_API_KEY` in the MCP server's environment. Get the key from the Vercel AI Gateway dashboard; use a protected local secret store or environment file, never chat or a committed config. The adapter calls `typesafe-ai/jev` through the evaluation API.

Register the local server with command `node` and argument `/absolute/path/to/jev-browser-skill/dist/index.js`. The path must point to the built checkout. Configure secret environment variables explicitly if the client filters inherited variables. In Hermes use its MCP configuration, not Custom Endpoints. See the repository's `docs/hermes.md` for the complete example.

To generate field text through Vercel, also configure:

```text
JEV_BROWSER_TYPE_BASE_URL=https://ai-gateway.vercel.sh/v1
JEV_BROWSER_TYPE_MODEL=anthropic/claude-sonnet-4.6
JEV_BROWSER_TYPE_API_KEY=<same Gateway key, stored locally>
```

Without a text provider, the runtime uses a basic keyword heuristic. For exact form text, use a tool that supports deterministic field values rather than assuming this heuristic will preserve the user's wording.

Copy this skill folder into the host's skill directory, or use its supported skill installer. Registering the skill and registering the MCP server are separate steps. Restart or reload the MCP client, check that `jev_navigate` is listed, then test a public page within the user's authorized scope.
