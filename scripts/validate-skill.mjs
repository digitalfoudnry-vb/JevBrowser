import { readFile, access } from 'node:fs/promises';
import assert from 'node:assert/strict';
const root = new URL('../jevskills/jev-browser/', import.meta.url);
const skill = await readFile(new URL('SKILL.md', root), 'utf8');
assert.match(skill, /^---\nname: jev-browser\ndescription: .+\n---\n/);
assert.ok(!/\b(TODO|FIXME|TBD)\b/.test(skill), 'Unfinished skill scaffold');
for (const [, path] of skill.matchAll(/\]\((references\/[^)]+)\)/g)) await access(new URL(path, root));
assert.ok(Buffer.byteLength(skill) < 32_000, 'Skill entry point should stay concise');
console.log('Skill metadata and references validated');
