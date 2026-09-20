# Jev Browser Architecture & Design Specifications

## 1. Executive Summary

`JevBrowser` is an autonomous AI browser platform providing isolated task spaces and probabilistic action intelligence powered by Jev (`typesafe-ai/jev`).

---

## 2. Core Architectural Components

### 2.1 The Dual-Mode Task Space Subsystem (`src/browser/`)

Jev Browser implements an isomorphic abstraction layer allowing seamless execution across desktop browser sessions and headless cloud/container environments:

```typescript
export interface TaskSpace {
  spaceId: number;
  name: string;
  page(label: string): Page;
  close(): Promise<void>;
}
```

- **`src/browser/native.ts`**:
  Connects to the desktop browser native runtime when running locally, inheriting user logins, cookies, active tabs, and rendering real-time visual cursor movements for human-AI co-browsing.
- **`src/browser/standalone.ts`**:
  When the desktop runtime is unavailable (e.g. CI, Docker, servers, cloud agents), launches Playwright Chromium with an identical interface, emulating the same task space isolation, `@ref` locators, and snapshot structures.
- **`src/browser/task-space.ts`**:
  Auto-detects the active runtime and transparently instantiates the appropriate task space.

---

## 3. Snapshot Translation & Ref Locators (`src/browser/snapshot-parser.ts`)

Pages are represented as compact structured text snapshots where elements are referenced via `@ref` tags (e.g. `@1`, `@2`):

```text
root (viewport snapshot: 5 interactive elements)
  @1 button "Sign in" [loc=button:sign-in]
  @2 textbox "Username" [loc=input:username]
```

### Parsing Pipeline:
1. `parseSnapshot(text)` parses the text, extracting `@ref`, accessibility role, accessible name, and stable locators (`loc=...`).
2. Groups element capabilities into `clickable`, `typeable`, and `selectable`.
3. In standalone mode, `generateStandaloneSnapshot(page)` stamps `data-jev-ref="@N"` onto interactive DOM elements in the viewport and formats an identical snapshot string.

---

## 4. Jev Autonomous Decision Engine (`src/jev/`)

Traditional browser agents pass entire DOM trees or multi-megabyte screenshots to vision models, leading to high latency, token bloat, and hallucinated coordinates.

Jev replaces this with **probabilistic action compilation**:
1. **Action-Space Filtering (`compileActionSpace`)**:
   - Strips noisy boilerplate ("jump to content", non-functional anchors, duplicate paths).
   - Constrains the action space to a strict maximum of 240 elements.
2. **Criteria Compilation (`buildCriteria`)**:
   - Converts actionable DOM items into structured choices (`click_e1`, `type_e2`, `select_e3`) alongside universal navigation choices (`scroll_down`, `scroll_up`, `back`, `done`).
3. **Structured Verification (`validateStepAnswers`)**:
   - Validates that the LLM choice is strictly within the offered criteria set. Any out-of-bounds selection is rejected.
4. **Stuck-State Detection & Alternate Branching (`pickAlternate`)**:
   - If consecutive steps produce no state change or loop in place, the engine automatically backtracks and tests the next most probable action branch.

---

## 5. Security & Network Isolation (`src/jev/security.ts`)

`JevBrowser` implements strict defense-in-depth:
- **SSRF Mitigation**: Validates all start URLs and outbound navigation targets against private IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, `::1`, and CGNAT `100.64.0.0/10`).
- **Web Port Policy**: Only allows public ports 80 and 443.
- **Log Sanitization**: Redacts sensitive API keys and Authorization Bearer headers from stack traces.
