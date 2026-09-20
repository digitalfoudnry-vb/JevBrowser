# Security and reliability review

Review date: 2026-09-20. Baseline: upstream commit
`8d90c51bedbe7cd07596bfaa532ded019a31d2a8` (v0.4.0).

Scope: TypeScript browser loop, MCP/CLI inputs, provider adapters, dependency
lockfile, installation behavior, skill instructions and CI. This was a source
review with regression tests, not an independent penetration test or certification.

## Findings addressed

| Finding | Impact | Change and evidence |
| --- | --- | --- |
| Unrestricted browser destinations | Pages could reach local services or metadata endpoints | Public-only URL/IP validation; exact host scope; browser proxy pins validated DNS IPs. Tests cover loopback, private IPv4/IPv6, mapped IPv4, mixed DNS answers, numeric IP encodings and proxy rejection. |
| DNS check/connection gap | A hostname could change between validation and connection | Proxy connects to the validated numeric address; Chromium does not resolve destinations a second time. |
| Typing always pressed Enter | Filling a field could unintentionally submit a form | Field entry, Enter and unsafe HTTP methods are separate opt-ins. Real browser regression test covers form submission. |
| Browser routes could be bypassed by service workers and WebSockets | Network scope might not cover every request path | Service workers and WebSockets blocked, loopback proxy bypass removed, QUIC/non-proxied WebRTC UDP disabled. |
| Deadlines did not interrupt every browser operation | Page evaluation could outlive task cancellation | Abort closes the browser, launch is bounded, cancellation reason determines status, and cleanup closes proxy sockets. Concurrent runs limited to two and pages to four. |
| Inconsistent CLI/library/MCP limits | Direct calls could bypass MCP validation | Shared strict schema; finite time/step/output limits; CLI rejects unknown flags and missing values. |
| Model output was trusted as an executable choice | Invalid actions or dropdown indices could cause unintended behavior | Validate offered choices and probabilities; invalid dropdown selections fail instead of choosing the first option. |
| Provider selection silently fell back | Typo or missing typing credentials could route data elsewhere | Explicit provider selection now fails closed; direct TypeSafe client no longer caches stale environment configuration. |
| Generator errors silently entered heuristic text | Forms could receive incorrect fallback text | Configured generator failures stop field entry; typing trace no longer includes generated text. |
| Page text mixed with instructions | Prompt injection could redirect decision-making | Explicit untrusted-page guidance plus host/method enforcement; model resistance is not guaranteed. |
| Provider error bodies could appear in tool results | Responses might expose sensitive diagnostic data | Remove raw OpenRouter/Cloudflare error bodies; redact known environment secret values in returned errors; browser process omits secret-shaped environment variables. |
| Six dependency advisories (one high) | Vulnerable transitive SDK dependencies | Upgrade AI SDK provider packages, regenerate lockfile, and enforce audit checks. |
| Implicit install/build/browser downloads | Installing could execute setup without a distinct operator step | Remove lifecycle installation hooks; build and Chromium install are explicit. CI actions are pinned and have read-only repository permissions. |
| Markdown extraction retained script/style content | Output included irrelevant active-content text | Remove script/style/noscript/template nodes before Markdown conversion. |

## Checks

- TypeScript check and build: passed locally.
- Unit/security/provider tests: 35 passed, including the mocked Vercel evaluation contract and MCP handshake; no paid requests.
- Dependency audit: zero reported vulnerabilities after upgrades, on this review date.
- Codex skill-creator validator: passed.
- Hermes Skills Guard `skills-guard-v5`, from Hermes commit
  `c6550d87c7e75127fabf9b7ccec81099f86c0db5`: **SAFE**, community installation
  policy **ALLOWED**, zero findings. The scanner ran against `jevskills/jev-browser`
  with no force option or ignore file. This is a static skill scan, not an audit
  of the TypeScript runtime. Summary saved in `hermes-skill-scan.json`.
- Real Chromium fixture tests: 6 passed, including full-loop mocked Vercel browsing, form entry without submission, loopback blocking, cancellation, and a deadline test against an infinite JavaScript loop.
- GitHub CI could not be enabled: the authenticated GitHub OAuth token lacks `workflow` scope and GitHub rejected the initial push. The workflow is provided as `docs/ci-workflow.yml`; local checks passed. Linux CI remains unverified until a suitably scoped credential enables it.

## Remaining boundaries

- No authenticated live Vercel/Jev calls were made in this review. The adapter
  was tested with a mocked response through the real SDK. Real account billing,
  model availability and live-site success remain deployment checks.
- Browser controls are not an OS sandbox or a proof against Chromium exploits.
  Application routing/proxy coverage must be reinforced by network isolation in
  high-risk deployments. DNS lookups use the host resolver.
- Allowed public sites may mutate state via GET, disclose page data, contain
  misleading instructions, or return oversized content. Output limits are not
  a complete browser-memory quota. No prompt-injection immunity is claimed.
- Exact-host scope intentionally blocks undeclared CDNs and cross-site redirects;
  add necessary public hosts deliberately. Private sites/login profiles are unsupported.
- Hosted provider calls receive page state. Provider endpoints are trusted operator
  configuration and are outside browser egress restrictions. Screenshots and page
  outputs are not generally scrubbed of sensitive content.
- The input-price estimate excludes typing calls and provider-specific fees.
- The NVIDIA advisory scanner and third-party marketplace review were not run.
  Passing Hermes Skills Guard does not mean Nous accepted this into its catalog.

No claim is made that every possible bug or vulnerability has been eliminated.
