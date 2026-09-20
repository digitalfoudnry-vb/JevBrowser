# Attribution & Notices

**Jev Browser** is developed and maintained by **[digitalfoundry.ai](https://digitalfoundry.ai/)**.

## Upstream Software & Open Source Derivations

This project incorporates and builds upon open-source software under the terms of the MIT License:

1. **Jev Browser Foundation (`jkudish/jev-browser`)**
   - Source: https://github.com/jkudish/jev-browser (commit `8d90c51bedbe7cd07596bfaa532ded019a31d2a8`, version 0.4.0)
   - Copyright (c) 2026 Joey Kudish
   - License: MIT
   - Provides core Jev navigator decision intelligence, question schemas, and LLM evaluation contracts.

2. **Standalone Task Space & Isolation Architecture**
   - Derived in part from architectural design concepts in `citrolabs/ego-lite`.
   - Copyright (c) 2026 CitroLabs
   - License: MIT
   - Provides task space isolation mechanisms, macOS application bundle patterns, and cross-platform native browser bridge abstractions.

## digitalfoundry.ai Contributions & Enhancements

- Multi-agent Task Spaces with zero-interference mouse and keyboard decoupling.
- Dual execution runtime bridging native desktop Chrome / Edge / Brave and Playwright headless Chromium.
- Model Context Protocol (MCP) stdio integration with strict security guardrails.
- Native SSRF protections and private subnet egress filtering (`src/jev/security.ts`).
- Native macOS desktop application bundle (`Jev Browser.app`).
- Comprehensive regression, compiler, unit, and end-to-end test suites.
- Interactive showcase website, Remotion video assets, and agent automation demos.

## Media & Audio Assets

- **Audio SFX**: Sourced from Kenney game audio libraries ([Kenney.nl](https://kenney.nl/)), licensed under **Creative Commons CC0 1.0 Universal (Public Domain Dedication)**.
- **Branding & Visuals**: Logos, motion design videos, and documentation graphics are Copyright (c) 2026 digitalfoundry.ai.

## Non-Endorsement Disclaimer

This software is independently maintained by digitalfoundry.ai and does not imply endorsement by any upstream author, organization, or model provider (including TypeSafe, Vercel, Anthropic, OpenAI, or Google).

