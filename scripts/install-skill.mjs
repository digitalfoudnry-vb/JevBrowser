#!/usr/bin/env node
import * as fs from "node:fs/promises";
import * as path from "node:path";
import * as os from "node:os";

const CLIENTS = {
  claude: path.join(os.homedir(), ".claude", "skills", "jev-browser"),
  codex: path.join(os.homedir(), ".codex", "skills", "jev-browser"),
  hermes: path.join(os.homedir(), ".hermes", "skills", "jev-browser"),
  openclaw: path.join(os.homedir(), ".openclaw", "skills", "jev-browser"),
  antigravity: path.join(os.homedir(), ".gemini", "config", "skills", "jev-browser"),
};

export async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export function parseInstallArgs(argv) {
  let dryRun = false;
  let client = null;
  let customDest = null;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--dry-run") dryRun = true;
    else if (arg === "--client" && argv[i + 1]) client = argv[++i];
    else if (arg === "--dest" && argv[i + 1]) customDest = argv[++i];
  }

  return { dryRun, client, customDest };
}

async function main() {
  const args = parseInstallArgs(process.argv.slice(2));
  const projectRoot = path.resolve(import.meta.dirname, "..");
  const skillSrc = path.join(projectRoot, "skills", "jev-browser");

  const targets = [];
  if (args.customDest) {
    targets.push({ name: "custom", path: path.resolve(args.customDest) });
  } else if (args.client) {
    const p = CLIENTS[args.client.toLowerCase()];
    if (!p) {
      console.error(`Unknown client '${args.client}'. Available: ${Object.keys(CLIENTS).join(", ")}`);
      process.exit(1);
    }
    targets.push({ name: args.client, path: p });
  } else {
    for (const [name, p] of Object.entries(CLIENTS)) {
      targets.push({ name, path: p });
    }
  }

  console.log(`Installing JevBrowser skill from: ${skillSrc}`);
  for (const target of targets) {
    if (args.dryRun) {
      console.log(`[dry-run] Would copy to: ${target.path} (${target.name})`);
    } else {
      try {
        await copyDir(skillSrc, target.path);
        console.log(`✔ Installed to: ${target.path} (${target.name})`);
      } catch (err) {
        console.warn(`⚠ Skipped ${target.name} (${target.path}): ${err.message}`);
      }
    }
  }
}

if (process.argv[1] && import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
