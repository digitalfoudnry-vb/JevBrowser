<div align="center">

<img src="assets/logo.png" alt="Jev Browser Logo" width="180" />

# Jev Browser Skill
### *Autonomous AI Browser powered by Jev Decision Intelligence*

</div>

A reusable browser skill and local MCP server for **Claude Code, Codex, Hermes and OpenClaw**. The skill is packaged in [`jevskills/jev-browser`](jevskills/jev-browser/SKILL.md). Jev selects browser actions through Vercel AI Gateway; Playwright executes them. The host agent uses its normal chat model.

This is an independent, MIT-licensed derivative of [jkudish/jev-browser](https://github.com/jkudish/jev-browser), with security and reliability changes. See [NOTICE](NOTICE.md), [security review](docs/security-review.md) and [security boundaries](SECURITY.md). It is not an official vendor integration or a security certification.

## Setup

Requires Node.js 22.18 or later. Clone `https://github.com/digitalfoudnry-vb/JevBrowser.git`, then run inside the checkout:

```sh
npm ci --ignore-scripts
npm run build
npm run browser:install
```

Dependencies and Chromium are installed explicitly; no install lifecycle script downloads or runs a browser. The package is private and not published to npm. Use the built local entry point, not `npx @jkudish/jev-browser`.

Configure the server environment:

```text
JEV_PROVIDER=vercel
AI_GATEWAY_API_KEY=<your Vercel AI Gateway key>
```

Create the key in [Vercel AI Gateway](https://vercel.com/docs/ai-gateway/getting-started). Do not commit it. No deployment to Vercel is required.

See the [four-platform setup guide](jevskills/jev-browser/references/platforms.md) for skill locations, MCP registration, configuration examples and verification.

Preview skill installation for all four clients, then apply it when ready:

```sh
node scripts/install-skill.mjs --client all
node scripts/install-skill.mjs --client all --apply
```

Select one client with `--client claude`, `codex`, `hermes` or `openclaw`. Existing installations are never overwritten. The installer copies skills only; it does not change host settings or credentials. Register the MCP server separately using the guide or the templates in `integrations/`.

This package targets local agent runtimes with Node/Chromium access. Cloud-only chats need a separately deployed connector, which is not provided here.

## Use

Ask the host agent to use the `jev-browser` skill. It calls the `jev_navigate` tool with a task and start URL. Results include final page content, action trace, provider usage and optionally a screenshot.

CLI example, with credentials already configured in the environment:

```sh
node dist/index.js run "Read the page and identify its purpose" https://example.com --no-screenshot
```

The browser can reach only the starting hostname by default. Use `--allowed-hosts example.com,cdn.example.com` to explicitly include needed public resources or destinations. Hosts must be exact; private addresses, embedded URL credentials, non-HTTP(S) schemes and nonstandard web ports are blocked. Redirects and popup requests receive the same policy.

Typing is off by default. `--allow-typing` allows field entry; `--submit-after-typing` additionally presses Enter and requires `--allow-mutations`. Mutating HTTP methods are blocked unless authorized and enabled. A GET request can still change state on an unsafe website; these controls are not a guarantee of read-only browsing.

For field-text generation through Vercel, set:

```text
JEV_BROWSER_TYPE_BASE_URL=https://ai-gateway.vercel.sh/v1
JEV_BROWSER_TYPE_API_KEY=<your Gateway key>
JEV_BROWSER_TYPE_MODEL=anthropic/claude-sonnet-4.6
```

Jev returns decisions, not generated field text. Without a typing provider, a keyword heuristic is used. Configured generator failures stop the field action instead of silently entering fallback text.

Direct TypeSafe, OpenRouter and Cloudflare provider paths are retained. Set `JEV_PROVIDER` explicitly to avoid unintentional automatic routing. See the source for provider-specific variables; Vercel is the documented default integration for this fork.

## Validation

```sh
npm run check
npm run browser:install
npm run test:browser
npm audit --audit-level=low
```

Unit and browser fixture tests need no model credentials and make no paid API calls. `npm run test:e2e` is separate and requires explicit credentials for live tests. The CI template in `docs/ci-workflow.yml` runs the offline checks, real Chromium fixture tests, dependency audit and skill validation. Move it to `.github/workflows/ci.yml` after authorizing a GitHub credential with workflow permission.

See [security review](docs/security-review.md) for findings and remaining limits. Passing these checks does not prove the absence of vulnerabilities or imply third-party acceptance.
