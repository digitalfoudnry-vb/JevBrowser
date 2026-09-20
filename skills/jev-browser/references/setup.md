# Jev Browser Setup & Environment Reference

## Installation Options

### Global NPM Link / Install
```bash
npm install -g @digitalfoudnry-vb/jev-browser
# or link locally:
npm link
```

### Install Skill into AI Agents
```bash
# Automatically install into Claude Code, Codex, Hermes, OpenClaw, and Antigravity:
node scripts/install-skill.mjs

# Or test in dry-run mode:
node scripts/install-skill.mjs --dry-run
```

## AI Provider Configuration

`jev-browser` supports multiple LLM gateways for autonomous navigation decisions:

### 1. Vercel AI Gateway (Default)
```bash
export JEV_PROVIDER="vercel"
export AI_GATEWAY_API_KEY="your-ai-gateway-key"
```

### 2. TypeSafe SDK
```bash
export JEV_PROVIDER="typesafe"
export TYPESAFE_API_KEY="your-typesafe-key"
```

### 3. OpenRouter
```bash
export JEV_PROVIDER="openrouter"
export OPENROUTER_API_KEY="your-openrouter-key"
```

### 4. Cloudflare Workers AI
```bash
export JEV_PROVIDER="cloudflare"
export CLOUDFLARE_API_KEY="your-cloudflare-key"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
```
