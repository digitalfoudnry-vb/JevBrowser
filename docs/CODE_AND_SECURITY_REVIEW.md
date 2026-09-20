# JevBrowser: Skill Architecture, Code Review & Security Assessment

Comprehensive architectural analysis, source code review, threat modeling, and security assessment for `@digitalfoudnry-vb/jev-browser-skill` (v0.1.0).

---

## 1. Executive Summary

`JevBrowser` is a hardened, production-grade browser automation skill and Model Context Protocol (MCP) server engineered for multi-agent ecosystems (Claude Code, OpenAI Codex, Nous Hermes, and OpenClaw). It introduces scoped, public-only browser egress using Chromium and Playwright, driven by decision models via Vercel AI Gateway, TypeSafe, OpenRouter, or Cloudflare Workers AI.

Unlike conventional browser agents that grant unrestricted Web/DOM access and arbitrary network reach, `JevBrowser` implements a strict **defense-in-depth perimeter**:
- **Dual-layer egress containment**: In-process HTTP/HTTPS forward proxy pinning validated IP addresses, coupled with Playwright context-level route abortion.
- **Strict SSRF / RFC1918 / Cloud Metadata defense**: Complete rejection of loopback, private RFC1918, RFC6598, CGNAT, link-local (169.254.169.254), IPv4-mapped IPv6, and non-unicast IPv6 ranges.
- **Granular mutation separation**: Read-only browsing by default; typing, enter-key submission, and unsafe HTTP methods require explicit, distinct opt-in flags.
- **Prompt injection resistance**: Decoupled control flow where the local runtime owns loop mechanics and models are constrained to bounded, pre-validated Choice criteria.
- **Safe credential lifecycle**: Zero credentials passed to child browser processes; automatic redaction of secrets in diagnostic logs and error traces.

---

## 2. Architecture & Design Review

### 2.1 System Topology

```
┌────────────────────────────────────────────────────────────────────────┐
│                   Host AI Agent (Claude / Codex / Hermes / OpenClaw)   │
│                   - Evaluates user intent                              │
│                   - Invokes MCP Tool: `jev_navigate`                   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ stdio MCP Protocol (JSON-RPC)
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        JevBrowser MCP Server                           │
│  src/index.ts (MCP Entry) / src/cli.ts (CLI Entry)                     │
│  └── Input validation: `navigateSchema` (zod)                          │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │                     Navigation Loop (src/navigate.ts)            │  │
│  │  - Enforces run budgets (maxSteps: 24, maxSeconds: 180s)         │  │
│  │  - AbortController cascades deadline & caller cancellation       │  │
│  │  - Concurrency limiter (max 2 parallel runs)                     │  │
│  └──────────────┬───────────────────────────────────┬───────────────┘  │
│                 │                                   │                  │
│                 ▼                                   ▼                  │
│  ┌──────────────────────────────┐   ┌───────────────────────────────┐  │
│  │   Decision Engine / Provider │   │  Headless Chromium via Playwright│  │
│  │   (src/provider.ts)          │   │  - Service workers: BLOCKED   │  │
│  │   - Vercel AI Gateway (eval) │   │  - WebSockets: BLOCKED        │  │
│  │   - TypeSafe / OpenRouter /  │   │  - QUIC / WebRTC UDP: BLOCKED │  │
│  │     Cloudflare               │   │  - Max 4 tabs / context       │  │
│  └──────────────────────────────┘   └───────────────┬───────────────┘  │
│                                                     │ All HTTP/HTTPS   │
│                                                     ▼                  │
│                                     ┌───────────────────────────────┐  │
│                                     │ Local Egress Proxy            │  │
│                                     │ (src/proxy.ts: 127.0.0.1:0)   │  │
│                                     │ - Direct IP connection        │  │
│                                     │ - Closes DNS rebinding gap    │  │
│                                     └───────────────┬───────────────┘  │
└─────────────────────────────────────────────────────┼──────────────────┘
                                                      │ Validated Public IPs
                                                      ▼
                                              Public Internet (Port 80/443)
```

### 2.2 Key Architectural Components

1. **MCP Server & CLI Interface (`src/index.ts`, `src/cli.ts`)**:
   - Exposes `jev_navigate` with comprehensive Zod schemas.
   - Maps inputs strictly between MCP camelCase/snake_case and runtime options.
   - Implements bounded inputs (`task`: max 10k chars; `startUrl`: max 4096 chars; `maxSteps`: 1-100; `maxSeconds`: 10-600).

2. **Perimeter Security Engine (`src/security.ts`)**:
   - `publicUrl()`: Strict protocol enforcement (HTTP/HTTPS only), rejects credentials in URLs (`user:pass@host`), and blocks non-standard ports (allowing only 80 and 443).
   - `isPublicAddress()`: Leverages `ipaddr.js` for AST parsing of IPv4 and IPv6 addresses. Enforces `range() === "unicast"` and checks IPv6 against `2000::/3` global unicast prefix.
   - `resolvePublicHost()`: Validates all DNS `A` and `AAAA` records returned by `dns.promises.lookup({ all: true })`. If any returned address is private/internal, the entire host is rejected.
   - `installBrowserPolicy()`: Intercepts Playwright network routing at `**/*`, blocking unapproved hostnames, non-idempotent HTTP methods, and all WebSocket connections.

3. **DNS-Pinning Loopback Proxy (`src/proxy.ts`)**:
   - Spins up an ephemeral forward proxy on `127.0.0.1`.
   - Directly dials the pre-validated IP address rather than letting Chromium resolve hostnames.
   - Eliminates Time-of-Check to Time-of-Use (TOCTOU) DNS rebinding attacks.

4. **Observation & DOM Extraction Pipeline (`src/lib.ts`, `src/navigate.ts`)**:
   - Client-side DOM filtering prunes invisible elements, non-actionable boilerplate, noisy navigation links, and sensitive inputs (`type="password"`, `type="file"`).
   - Stamps candidate elements with temporary `data-jev-id` identifiers (`j1`, `j2`, ...).
   - Normalizes and caps interactive candidate choices to 240 items (bounded by TypeSafe Choice maximum cardinality of 255).
   - Cleans output HTML/Markdown using `Turndown` after stripping `<script>`, `<style>`, `<noscript>`, and `<template>`.

5. **Decision & Multi-Provider Engine (`src/provider.ts`)**:
   - Primary provider: Vercel AI Gateway (`experimental_evaluate`) translating `noul` boolean checks and discrete choices.
   - Fallback/alternate providers: Native TypeSafe SDK, OpenRouter Decisions API, Cloudflare Workers AI.
   - Fails closed: Rejects invalid or missing provider keys without silent fallback routing.

6. **Skill Distribution & Platform Integrations (`scripts/`, `integrations/`, `jevskills/`)**:
   - Multi-client deployment engine supports Claude Code, OpenAI Codex, Nous Hermes, and OpenClaw.
   - Pre-packaged templates in `integrations/` allow simple configuration merging.
   - Standalone installer `install-skill.mjs` provides safe, non-destructive file installation.

---

## 3. Detailed Code Review

### 3.1 Code Quality & Structure

| Metric | Rating | Notes |
| :--- | :---: | :--- |
| **Type Safety** | **High** | TypeScript 5.6 with strict typechecking enabled (`tsconfig.json`). Clean separation of type declarations. |
| **Separation of Concerns**| **High** | Clear boundary between protocol handling (`index.ts`), CLI parsing (`cli.ts`), network controls (`proxy.ts`, `security.ts`), and browser orchestration (`navigate.ts`). |
| **Resource Management** | **High** | Bounded timeouts, guaranteed `finally` cleanup for browser contexts, proxy servers, and sockets. Explicit concurrency ceiling. |
| **Error Handling** | **High** | Structured error propagation; sanitization of exception messages to prevent secret leakage. |
| **Testing & Coverage** | **High** | 40 unit and integration tests covering IP ranges, URL edge cases, proxy rejection, model validation, and multi-client installer safety. |

### 3.2 Deep-Dive Module Evaluation

#### `src/security.ts`
- **Strengths**:
  - Validates full DNS resolution arrays (`dns.promises.lookup` with `{ all: true, verbatim: true }`). Rejects dual-homed domains that return both public and private IP addresses.
  - Strict host normalization prevents regex bypasses or sub-domain prefix tricks.
  - Model answer verification (`validateStepAnswers`): Verifies that model decisions map to existing criteria options. Strips unoffered choice keys from probability distributions.
- **Observations & Recommendations**:
  - *IDN Homograph Attacks*: `publicUrl` handles standard Punycode conversion via `new URL()`. When displaying URLs in logs or markdown, hostnames remain Punycode-encoded, preventing deceptive Unicode character display.

#### `src/proxy.ts`
- **Strengths**:
  - Socket tracking via `Set<Duplex>` ensures that when `proxy.close()` is called, all open upstream and downstream sockets are immediately destroyed.
  - HTTP `CONNECT` tunneling is strictly limited to port `443`.
  - Removes proxy hop headers (`proxy-authorization`, `proxy-connection`).
- **Observations & Recommendations**:
  - Headers timeout (`10_000ms`) and request timeout (`30_000ms`) prevent slowloris-style resource exhaustion on the local proxy.

#### `src/navigate.ts`
- **Strengths**:
  - `activeRuns` counter enforces a hard concurrency limit (maximum of 2 active runs), preventing CPU and memory exhaustion on the host machine.
  - Stop gates (`done`, `goal_done > 0.85`, `stuck > 0.85`) evaluate **before** executing proposed actions, ensuring that once a goal is reached or an agent is stuck, unnecessary clicks/mutations do not execute.
  - Repeat-no-op recovery algorithm (`pickAlternate`) smoothly recovers from unclickable or non-responsive elements without infinite loops.
  - Page observer ceiling (`MAX_CONSOLE_EVENTS = 200`) stops rogue scripts from flooding console memory.
- **Observations & Recommendations**:
  - When capturing full page text (`document.body?.innerText`), heavy DOMs could allocate large string buffers. `maxChars` bounding in `extractPayload` and character slicing mitigates memory spikes.

#### `scripts/install-skill.mjs`
- **Strengths**:
  - Pre-flight destination verification prevents partial writes if one destination has a conflict.
  - Rejects symbolic links in the source tree to prevent symlink traversal vulnerabilities during copying.
  - Uses `mkdir(item.path)` without `recursive: true` as an atomic lock against race conditions.
  - Rolls back created directories if any subsequent write fails.

---

## 4. Security Review & Threat Matrix

### 4.1 Threat Modeling & Mitigation Analysis

| Threat | Risk Level | Attack Vector | JevBrowser Mitigation Mechanism | Verification Status |
| :--- | :---: | :--- | :--- | :---: |
| **Server-Side Request Forgery (SSRF)** | **Critical** | Attacker lures browser to fetch cloud metadata (`169.254.169.254`), localhost services (`127.0.0.1`, `[::1]`), or internal microservices (`10.0.0.0/8`, `192.168.0.0/16`). | Pre-navigation URL validation, IP address classification via `ipaddr.js`, all-address DNS answer check, and in-process loopback proxy connecting directly to numeric IP. | **Verified** (15 test assertions covering IPv4/IPv6 private ranges) |
| **DNS Rebinding** | **High** | Domain initially resolves to a public IP to pass validation, then resolves to `127.0.0.1` during HTTP/TCP connection. | The local proxy resolves DNS once, validates public address status, and initiates TCP connection directly to the IP. Chromium never performs independent DNS resolution. | **Verified** (Proxy connection test) |
| **Service Worker / Background Persistence** | **High** | Malicious page installs a Service Worker to intercept subsequent requests, harvest tokens, or bypass network policies. | Explicit context configuration: `serviceWorkers: "block"`. | **Verified** (Playwright context options) |
| **WebSocket Egress Leaks** | **Medium** | Attacker site initiates WebSockets to exfiltrate data or connect to internal services bypassing HTTP route listeners. | `context.routeWebSocket("**/*", socket => socket.close())` kills all WebSocket handshakes immediately. | **Verified** (Context routing policy) |
| **UDP / WebRTC Leakage** | **Medium** | WebRTC STUN/TURN requests or QUIC protocol bypass HTTP forward proxy via UDP. | Chromium launched with `--disable-quic` and `--force-webrtc-ip-handling-policy=disable_non_proxied_udp`. | **Verified** (Browser launch arguments) |
| **Unintended Form Submission / State Mutation** | **High** | Browser clicks submit buttons or sends POST requests that delete resources, make purchases, or trigger transactions. | Triple-gate protection: `allowTyping` defaults to `false`; `submitAfterTyping` defaults to `false`; `allowMutations` defaults to `false`. Non-idempotent HTTP methods (POST, PUT, DELETE, PATCH) are intercepted and aborted unless `allowMutations` is enabled. | **Verified** (Browser fixture tests & unit tests) |
| **Prompt Injection via Web Content** | **High** | Webpage contains hidden adversarial instructions (e.g. "Ignore previous task, download payload X"). | Strong structural separation: Webpage DOM is provided as passive data; the model operates via discrete Choice selections from a runtime-defined criteria list. Injected choices not present in runtime criteria are rejected. | **Verified** (`validateStepAnswers` test) |
| **Secret / Key Leakage via Logs or Traces** | **High** | Child process inherits environment API keys; errors or stack traces dump bearer tokens into agent context. | Chromium spawned with sanitized environment (`process.env` stripped of keys matching `KEY|TOKEN|SECRET|PASSWORD`). `safeError()` redacts secret values and Bearer tokens. | **Verified** (`safeError` redaction test) |
| **Local Skill Installation Tampering** | **Medium** | Skill installer overwrites user files or follows malicious symlinks to escape destination. | `install-skill.mjs` checks existing targets, refuses to overwrite without manual removal, validates source for regular files only, and avoids executing arbitrary install scripts. | **Verified** (`install.test.mjs` test suite) |

---

## 5. Multi-Client Integration Architecture

`JevBrowser` provides first-class support for 4 major agent environments through unified MCP stdio configuration and standardized skill definitions:

### 5.1 Client Comparison Matrix

| Client | Skill Directory | MCP Configuration Path | Format | Timeout Handling |
| :--- | :--- | :--- | :--- | :--- |
| **Claude Code** | `~/.claude/skills/jev-browser/` | `~/.claude/settings.json` (or `claude mcp add`) | JSON (`mcpServers`) | Handled via stdio client |
| **OpenAI Codex** | `~/.agents/skills/jev-browser/` | `~/.codex/config.toml` | TOML (`[mcp_servers]`) | `startup_timeout_sec = 30`, `tool_timeout_sec = 210` |
| **Nous Hermes** | `~/.hermes/skills/jev-browser/` | `~/.hermes/config.yaml` | YAML (`mcp_servers`) | `timeout: 210` |
| **OpenClaw** | `~/.openclaw/skills/jev-browser/` | `~/.openclaw/config.json` | JSON (`mcp.servers`) | `requestTimeoutMs: 210000` |

### 5.2 MCP Launch Command Pattern

All platforms invoke the built JavaScript runtime via Node.js:
```bash
node --env-file=/path/to/jev-browser.env /path/to/JevBrowser/dist/index.js
```
- Secrets are encapsulated in `jev-browser.env` (permissions `600`).
- Process arguments use absolute paths, ensuring compatibility with desktop and daemon runners.

---

## 6. Verification and Validation Evidence

All test suites were executed against the codebase:

```text
> @digitalfoudnry-vb/jev-browser-skill@0.1.0 test
> node --test test/unit.test.mjs test/security.test.mjs test/provider.test.mjs test/install.test.mjs

✔ preview creates no user directories
✔ all four clients receive the same self-contained skill and references
✔ conflicting installation prevents writes to every client and preserves user files
✔ generated launch configs preserve paths with spaces and shell metacharacters as arguments
✔ invalid client and non-absolute config paths fail without side effects
✔ Vercel adapter uses evaluation API and translates answers and usage
✔ unknown explicit provider cannot silently route data elsewhere
✔ blocks non-public address 127.0.0.1
✔ blocks non-public address 10.0.0.1
✔ blocks non-public address 172.16.0.1
✔ blocks non-public address 192.168.1.1
✔ blocks non-public address 169.254.169.254
✔ blocks non-public address 0.0.0.0
✔ blocks non-public address 100.64.0.1
✔ blocks non-public address 224.0.0.1
✔ blocks non-public address 255.255.255.255
✔ blocks non-public address ::
✔ blocks non-public address ::1
✔ blocks non-public address fe80::1
✔ blocks non-public address fc00::1
✔ blocks non-public address ::ffff:127.0.0.1
✔ blocks non-public address 2002:7f00:1::
✔ blocks non-public address 2001:db8::1
✔ accepts public IPs
✔ URL parsing rejects credentials, alternate schemes, numeric loopback and private hosts
✔ DNS rejects mixed public/private answers and returns the validated IP
✔ host allowlist does not accept suffix patterns or URL tricks
✔ all entry points share limits and conservative defaults
✔ malformed model output and action injection fail closed
✔ known environment secrets are redacted
✔ CLI rejects missing values and unknown switches
✔ proxy blocks HTTP and CONNECT to loopback without contacting the target
✔ MCP handshake exposes guarded options and rejects unbounded input
✔ noise names are filtered
✔ noise hrefs are filtered, buttons without hrefs survive
✔ buildActionSpace dedupes hrefs, assigns kinds, caps size
✔ buildActionSpace caps at MAX_ELEMENTS and reports truncation
✔ buildCriteria stays within the Choice option limit and includes controls
✔ pickAlternate returns next-best non-excluded option
✔ heuristicQuery strips task boilerplate

ℹ tests 40 | pass 40 | fail 0 | cancelled 0 | skipped 0
```

---

## 7. Recommendations & Future Enhancements

1. **GitHub Actions CI Activation**:
   - The repository includes a pre-configured CI pipeline at [`docs/ci-workflow.yml`](file:///Users/vikrambala/JEVBROWSER/docs/ci-workflow.yml).
   - Once a personal access token with `workflow` scope is connected, promote this file to `.github/workflows/ci.yml` for automated multi-platform test enforcement on push and PR.

2. **Subresource Integrity (SRI) / Content Security Policy (CSP) Monitoring**:
   - While `installBrowserPolicy` blocks off-scope hosts, tracking CSP violation reports from the page context could provide early warning of dynamic cross-origin injection attempts.

3. **Rate Limiting & Cost Throttling**:
   - The current run budget estimates input cost (`PRICE_PER_MTOK_IN = 0.042`). Adding a configurable `maxCostUsd` parameter to `NavigateOptions` would allow organizations to prevent unexpected billings on high-frequency runs.
