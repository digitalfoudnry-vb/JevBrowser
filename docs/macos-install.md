# Jev Browser for macOS Installation & Setup

Created by **[digitalfoundry.ai](https://digitalfoundry.ai/)**

Jev Browser provides a first-class native desktop experience for macOS users running Apple Silicon (M1/M2/M3/M4) and Intel architectures.

---

## Prerequisites

- **macOS**: Monterey (12.0) or later.
- **Node.js**: Version 22.18 or higher.
- **AI Agent Client**: Claude Code, Codex CLI, Cursor, Hermes, or OpenClaw.

---

## Installation Options

### Option 1: Automatic One-Line Terminal Setup (Recommended)

Run the automated installer script:

```bash
curl -fsSL https://raw.githubusercontent.com/digitalfoudnry-vb/JevBrowser/main/scripts/install-mac.sh | bash
```

This script:
1. Clones Jev Browser into `~/.jev-browser`.
2. Compiles TypeScript sources.
3. Installs dedicated headless Chromium runtime.
4. Auto-registers the `jev-browser` skill into Claude Code, Codex, Hermes, and OpenClaw skill stores.
5. Builds `Jev Browser.app` in `dist/macos/`.
6. Links the CLI binary to `~/.local/bin/jev-browser`.

---

### Option 2: Build the macOS App from Source

```bash
git clone https://github.com/digitalfoudnry-vb/JevBrowser.git
cd JevBrowser
npm install
npm run build
bash scripts/build-macos-app.sh
```

You can now drag `dist/macos/Jev Browser.app` directly into `/Applications`.

---

## Chrome Profile & Cookie Migration

On first launch, Jev Browser provides an optional one-click migration wizard for existing Chrome profiles:

- **What gets migrated**:
  - Saved session cookies (authenticated logins on GitHub, X, LinkedIn, AWS, etc.).
  - Bookmarks and history.
  - Active browser settings.
- **How it works**:
  - Jev Browser copies session states into isolated task space profiles under `~/.jev-browser/profiles/`.
  - Your primary Chrome browser files and running instances are never locked, modified, or interrupted.

---

## Running Tasks

### In Agent CLI
Simply instruct your agent in natural language:
```text
/jev-browser Navigate to news.ycombinator.com and summarize the top 3 discussions
```

### In Terminal
```bash
jev-browser run "Check system status" https://status.digitalfoundry.ai
```
