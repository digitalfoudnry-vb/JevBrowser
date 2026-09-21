#!/usr/bin/env node
// Copies the canonical skill only. Does not edit MCP settings or credentials.
import { cp, lstat, mkdir, readdir, rm } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../jevskills/jev-browser/', import.meta.url));
export const clientRoots = {
  antigravity: '.gemini/config/skills',
  claude: '.claude/skills',
  codex: '.agents/skills',
  hermes: '.hermes/skills',
  openclaw: '.openclaw/skills',
};

export async function installSkill({ client, home = homedir(), apply = false, force = false }) {
  if (client !== 'all' && !Object.hasOwn(clientRoots, client)) throw new Error('Choose antigravity, claude, codex, hermes, openclaw, or all');
  const clients = client === 'all' ? Object.keys(clientRoots) : [client];
  const destinations = clients.map(name => ({ client: name, path: join(resolve(home), clientRoots[name], 'jev-browser') }));
  // Inspect every destination before writing any of them; preserve existing installations unless force is requested.
  for (const item of destinations) {
    const existing = await lstat(item.path).catch(error => { if (error.code === 'ENOENT') return null; throw error; });
    if (existing && !force) throw new Error(`Already exists; review it before updating: ${item.path}`);
  }
  async function rejectLinks(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || (!entry.isDirectory() && !entry.isFile())) throw new Error('Skill source must contain regular files and directories only');
      if (entry.isDirectory()) await rejectLinks(join(directory, entry.name));
    }
  }
  await rejectLinks(source);
  if (apply) {
    const created = [];
    try {
      for (const item of destinations) {
        await mkdir(dirname(item.path), { recursive: true });
        if (force) {
          await rm(item.path, { recursive: true, force: true }).catch(() => {});
        }
        await mkdir(item.path); // Exclusive: do not replace a raced-in installation.
        created.push(item.path);
        for (const entry of await readdir(source)) {
          await cp(join(source, entry), join(item.path, entry), { recursive: true, force: false, errorOnExist: true });
        }
      }
    } catch (error) {
      for (const path of created.reverse()) await rm(path, { recursive: true, force: true });
      throw error;
    }
  }
  return { applied: apply, destinations, next: 'Register the MCP server using the platform setup guide; copying the skill alone does not start it.' };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('node scripts/install-skill.mjs --client antigravity|claude|codex|hermes|openclaw|all [--home /path/to/home] [--apply] [--force]\nDefaults to preview only.');
    return;
  }
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--apply') options.apply = true;
    else if (args[i] === '--force') options.force = true;
    else if (['--client', '--home'].includes(args[i]) && args[i + 1] && !args[i + 1].startsWith('--')) options[args[i].slice(2)] = args[++i];
    else throw new Error(`Unknown argument or missing value: ${args[i]}`);
  }
  console.log(JSON.stringify(await installSkill(options), null, 2));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
