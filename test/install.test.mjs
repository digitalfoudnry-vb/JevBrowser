import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { installSkill } from '../scripts/install-skill.mjs';
import { configuration } from '../scripts/print-mcp-config.mjs';

test('preview creates no user directories', async () => {
  const home = await mkdtemp(join(tmpdir(), 'jev-install-'));
  try {
    const preview = await installSkill({client:'all', home});
    assert.equal(preview.destinations.length,4); assert.equal(preview.applied,false);
    assert.deepEqual(await readdir(home),[]);
  } finally { await rm(home,{recursive:true,force:true}); }
});
test('all four clients receive the same self-contained skill and references', async () => {
  const home = await mkdtemp(join(tmpdir(), 'jev-install-'));
  try {
    const result = await installSkill({client:'all',home,apply:true});
    const original = await readFile(new URL('../jevskills/jev-browser/SKILL.md',import.meta.url),'utf8');
    for (const item of result.destinations) {
      assert.equal(await readFile(join(item.path,'SKILL.md'),'utf8'),original);
      assert.match(await readFile(join(item.path,'references/platforms.md'),'utf8'),/OpenClaw/);
    }
  } finally { await rm(home,{recursive:true,force:true}); }
});
test('conflicting installation prevents writes to every client and preserves user files', async () => {
  const home = await mkdtemp(join(tmpdir(), 'jev-install-'));
  try {
    const existing=join(home,'.hermes/skills/jev-browser');
    await mkdir(existing,{recursive:true}); await writeFile(join(existing,'SKILL.md'),'User customization');
    await assert.rejects(installSkill({client:'all',home,apply:true}),/Already exists/);
    assert.deepEqual(await readdir(home),['.hermes']);
    assert.equal(await readFile(join(existing,'SKILL.md'),'utf8'),'User customization');
  } finally { await rm(home,{recursive:true,force:true}); }
});
test('generated launch configs preserve paths with spaces and shell metacharacters as arguments', () => {
  const envFile='/tmp/Local Keys/jev $KEY.env';
  const serverFile='/tmp/Browser Project/dist/index.js';
  for (const client of ['claude','hermes','openclaw']) {
    const value=JSON.parse(configuration(client,envFile,serverFile));
    const server=client==='claude'?value.mcpServers['jev-browser']:client==='hermes'?value.mcp_servers['jev-browser']:value.mcp.servers['jev-browser'];
    assert.equal(server.command,process.execPath);
    assert.deepEqual(server.args,[`--env-file=${envFile}`,serverFile]);
  }
  const toml=configuration('codex',envFile,serverFile);
  const args=JSON.parse(toml.split('\n').find(line=>line.startsWith('args = ')).slice(7));
  assert.deepEqual(args,[`--env-file=${envFile}`,serverFile]);
});
test('invalid client and non-absolute config paths fail without side effects',async()=>{
  await assert.rejects(installSkill({client:'../escape'}));
  assert.throws(()=>configuration('claude','relative.env'));
  assert.throws(()=>configuration('invalid','/tmp/file.env'));
});
