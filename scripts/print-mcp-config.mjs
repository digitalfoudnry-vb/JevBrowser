#!/usr/bin/env node
// Emits reviewable configuration, never writes host config or reads secrets.
import { isAbsolute, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
export function configuration(client, envFile, serverFile = fileURLToPath(new URL('../dist/index.js', import.meta.url))) {
  if (!envFile || !isAbsolute(envFile) || !isAbsolute(serverFile)) throw new Error('Use absolute environment-file and server paths');
  if (/[\r\n\0]/.test(envFile + serverFile)) throw new Error('Paths must not contain line breaks or NUL');
  const command = process.execPath;
  const args = [`--env-file=${envFile}`, serverFile];
  const server = { command, args };
  switch (client) {
    case 'antigravity':
    case 'claude': return JSON.stringify({ mcpServers: { 'jev-browser': server } }, null, 2) + '\n';
    case 'codex': return `[mcp_servers.jev-browser]\ncommand = ${JSON.stringify(command)}\nargs = ${JSON.stringify(args)}\nstartup_timeout_sec = 30\ntool_timeout_sec = 210\nenabled_tools = ["jev_navigate"]\n`;
    // JSON is a YAML subset; Hermes can merge this object into config.yaml.
    case 'hermes': return JSON.stringify({ mcp_servers: { 'jev-browser': { ...server, timeout: 210, tools: { include: ['jev_navigate'] } } } }, null, 2) + '\n';
    case 'openclaw': return JSON.stringify({ mcp: { servers: { 'jev-browser': { ...server, requestTimeoutMs: 210000, toolFilter: { include: ['jev_navigate'] } } } } }, null, 2) + '\n';
    default: throw new Error('Choose antigravity, claude, codex, hermes, or openclaw');
  }
}
function main() {
  const options = {};
  const args = process.argv.slice(2);
  if (args.includes('--help')) { console.log('node scripts/print-mcp-config.mjs --client antigravity|claude|codex|hermes|openclaw --env-file /absolute/path/to/jev-browser.env'); return; }
  for (let i = 0; i < args.length; i++) {
    if (!['--client','--env-file'].includes(args[i]) || !args[i+1] || args[i+1].startsWith('--')) throw new Error(`Unknown argument or missing value: ${args[i]}`);
    options[args[i].slice(2)] = args[++i];
  }
  process.stdout.write(configuration(options.client, options['env-file']));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { main(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
