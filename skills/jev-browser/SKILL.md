---
name: jev-browser
description: High-performance browser environment powered by Jev autonomous decision intelligence. Use for web navigation, form filling, research, extraction, QA, and multi-tab automation with profile persistence and structured snapshots.
metadata:
  version: "1.0.0"
  date: "2026-09-20"
---

# jev-browser

`jev-browser` provides an autonomous browser automation environment powered by the probabilistic decision engine of **Jev** (`typesafe-ai/jev`).

It delivers:
1. **Isolated Workspaces**: Manage distinct browser tasks with `taskSpace(name)`, `page(label)`, `goto(url)`, `snapshot()`, pointer actions, and multi-tab isolation.
2. **Autonomous Jev Intelligence**: Probabilistic action-space compilation, multi-step goal convergence, automatic stuck-state backtracking, and noise filtering.
3. **Dual Execution Runtime**:
   - **Native Mode**: Seamlessly attaches to the desktop browser runtime when available, inheriting logged-in sessions, visual mouse indicators, and window state.
   - **Standalone Mode**: Self-contained headless Chromium engine running in CI, Docker, servers, or headless agent environments.
4. **Model Context Protocol (MCP)**: Native stdio server exposing `jev_browser_navigate` and `jev_browser_snapshot`.

---

## Quick Reference & Modes

### 1. Autonomous Navigation CLI

To run an autonomous goal from start to finish without writing code:

```bash
jev-browser run "Find the release date of Python 3.13" "https://en.wikipedia.org"
```

Useful flags:
- `--max-steps <n>`: Step budget (default: `24`).
- `--max-seconds <n>`: Timeout budget in seconds (default: `180`).
- `--allow-typing`: Enable text input and search query submission.
- `--screenshot <path>`: Capture final page screenshot to a file.
- `--format <text|markdown>`: Output format for the final extracted summary.

### 2. Interactive Scripting (`nodejs` heredoc)

Run JavaScript scripts with pre-imported `taskSpace`, `profiles`, and `jevNavigate`:

```bash
jev-browser nodejs <<'EOF'
const task = await taskSpace("research task");
const page = task.page("p1");

await page.goto("https://news.ycombinator.com");
console.log("TaskSpace ID:", task.spaceId);

const snap = await page.snapshot();
console.log(snap.content);

// Click an element using ref
await page.click("@1", { label: "Open first story" });
EOF
```

Single-line script execution via `-e`:
```bash
jev-browser nodejs -e '
const task = await taskSpace("quick check");
const page = task.page("p1");
await page.goto("https://example.com");
console.log(await page.snapshot());
'
```

### 3. Programmatic Autonomous Call inside Scripts

Combine scripted setup with autonomous Jev completion:

```bash
jev-browser nodejs <<'EOF'
const task = await taskSpace("investigate pricing");
const page = task.page("p1");
await page.goto("https://stripe.com");

// Delegate complex sub-goal to Jev
const result = await jevNavigate(
  "Find pricing for recurring subscriptions and international transactions",
  "https://stripe.com/pricing",
  { maxSteps: 10, allowTyping: false }
);

console.log(result.extracted_content);
EOF
```

---

## Core Concepts & Rules

### Task Spaces & Multi-Tab Isolation
- Use **one TaskSpace** per user request. Do not create new task spaces to recover from timeouts; recover within the existing space.
- Every task space begins with default Page `p1`. Reuse `p1` with `page.goto()` instead of creating extra tabs unless multi-page comparison is needed.
- In native mode, tabs appear inside the user's browser window with real-time visual mouse animations.

### Structured Snapshots (`@ref` IDs)
- Calling `await page.snapshot()` returns clean, compact text where every actionable element has an `@N` reference (e.g. `@1 button "Submit"`, `@2 textbox "Search"`).
- Target elements directly with `page.click("@1")` or `page.fill("@2", "query")`.
- The snapshot omits empty boilerplate, script tags, and noise containers while retaining stable accessibility semantics.

### Pointer & Interaction Helpers
- `page.click(refOrSelector, { label })`: Click with optional human-readable HUD label.
- `page.fill(refOrSelector, text)`: Focus, clear, and input text into textboxes or searchboxes.
- `page.hover(refOrSelector, { label })`: Move cursor over element.
- `page.scroll(direction, { amount })`: Scroll viewport (`"down"`, `"up"`).
- `page.screenshot({ fullPage })`: Capture base64 JPEG screenshot.

---

## Security & Defense-in-Depth

`jev-browser` enforces strict security boundaries:
1. **SSRF / Loopback Protection**: Blocks requests to `localhost`, `127.0.0.1`, RFC1918 private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local metadata addresses (`169.254.169.254`), and CGNAT ranges.
2. **Credential Redaction**: `safeError` strips API keys and Authorization bearer tokens from logs and console errors.
3. **Choice Range Validation**: Autonomous action selection strictly validates against the elements compiled from the current viewport snapshot.
