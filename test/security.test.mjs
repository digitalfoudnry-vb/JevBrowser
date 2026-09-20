import assert from 'node:assert/strict';
import { test } from 'node:test';
import http from 'node:http';
import net from 'node:net';
import { isPublicAddress, publicUrl, resolvePublicHost, normalizeHosts, navigateSchema, safeError, validateStepAnswers } from '../dist/security.js';
import { startPublicProxy } from '../dist/proxy.js';
import { navigate } from '../dist/navigate.js';
import { parseArgs } from '../dist/cli.js';

for (const address of ['127.0.0.1','10.0.0.1','172.16.0.1','192.168.1.1','169.254.169.254','0.0.0.0','100.64.0.1','224.0.0.1','255.255.255.255','::','::1','fe80::1','fc00::1','::ffff:127.0.0.1','2002:7f00:1::','2001:db8::1']) {
  test(`blocks non-public address ${address}`, () => assert.equal(isPublicAddress(address), false));
}
test('accepts public IPs', () => {
  assert.equal(isPublicAddress('1.1.1.1'), true);
  assert.equal(isPublicAddress('2606:4700:4700::1111'), true);
});
test('URL parsing rejects credentials, alternate schemes, numeric loopback and private hosts', () => {
  for (const url of ['file:///etc/passwd','javascript:alert(1)','https://user:pass@example.com','http://2130706433','http://0x7f000001','http://127.1','http://[::1]','http://localhost','https://metadata.internal','https://example.com:8080'])
    assert.throws(() => publicUrl(url), undefined, url);
});
test('DNS rejects mixed public/private answers and returns the validated IP', async () => {
  await assert.rejects(resolvePublicHost('example.com', async () => [{address:'1.1.1.1'}, {address:'10.0.0.1'}]));
  await assert.rejects(resolvePublicHost('example.com', async () => []));
  let calls = 0;
  assert.equal(await resolvePublicHost('example.com', async () => { calls++; return [{address:'1.1.1.1'}]; }), '1.1.1.1');
  assert.equal(calls, 1);
});
test('host allowlist does not accept suffix patterns or URL tricks', () => {
  for (const host of ['*.example.com','example.com/path','example.com?x','user@example.com','example.com:443'])
    assert.throws(() => normalizeHosts([host]));
  assert.deepEqual([...normalizeHosts(['EXAMPLE.COM'])], ['example.com']);
});
test('all entry points share limits and conservative defaults', async () => {
  const base = {task:'Read a page',startUrl:'https://example.com'};
  const parsed = navigateSchema.parse(base);
  assert.equal(parsed.allowTyping, false);
  assert.equal(parsed.submitAfterTyping, false);
  for (const invalid of [{maxSteps:Infinity},{maxSteps:1.5},{maxSeconds:-1},{maxChars:1e9},{format:'zip'},{task:''}]) {
    assert.equal((await navigate({...base,...invalid})).status, 'error');
  }
  assert.equal((await navigate({...base,submitAfterTyping:true})).status, 'error');
  const controller = new AbortController(); controller.abort();
  assert.equal((await navigate(base,controller.signal)).status, 'cancelled');
});
test('malformed model output and action injection fail closed', () => {
  const answers = {action:{choice:'click_e1',probabilities:{click_e1:0.8,click_e999:0.2}},goal_done:{noul:0},stuck:{noul:0}};
  assert.deepEqual(validateStepAnswers(answers,{click_e1:'Link'}).action.probabilities,{click_e1:0.8});
  assert.throws(() => validateStepAnswers({...answers,action:{choice:'type_e1'}},{click_e1:'Link'}));
  assert.throws(() => validateStepAnswers({...answers,goal_done:{noul:NaN}},{click_e1:'Link'}));
});
test('known environment secrets are redacted', () => {
  process.env.JEV_TEST_SECRET = 'a-secret-for-tests-only';
  try { assert.equal(safeError(new Error('oops a-secret-for-tests-only Bearer abcdef')), 'oops [REDACTED] Bearer [REDACTED]'); }
  finally { delete process.env.JEV_TEST_SECRET; }
});
test('CLI rejects missing values and unknown switches', () => {
  assert.throws(() => parseArgs(['task','https://example.com','--max-steps']));
  assert.throws(() => parseArgs(['task','https://example.com','--typo']));
  assert.deepEqual(parseArgs(['task','https://example.com','--allowed-hosts','example.com,cdn.example.com']).allowedHosts,['example.com','cdn.example.com']);
});
test('proxy blocks HTTP and CONNECT to loopback without contacting the target', async () => {
  const proxy = await startPublicProxy(new Set(['127.0.0.1','example.com']));
  try {
    const address = new URL(proxy.server);
    const status = await new Promise((resolve,reject) => {
      http.get({host:address.hostname,port:address.port,path:'http://127.0.0.1/'},res => {res.resume();resolve(res.statusCode);}).on('error',reject);
    });
    assert.equal(status,403);
    const reply = await new Promise((resolve,reject) => {
      const client = net.connect(Number(address.port),address.hostname,()=>client.write('CONNECT 127.0.0.1:443 HTTP/1.1\r\nHost: 127.0.0.1:443\r\n\r\n'));
      client.on('data',data=>{resolve(data.toString());client.destroy();});client.on('error',reject);
    });
    assert.match(reply,/403 Forbidden/);
  } finally {await proxy.close();}
});
test('MCP handshake exposes guarded options and rejects unbounded input', async () => {
  const {Client}=await import('@modelcontextprotocol/sdk/client/index.js');
  const {StdioClientTransport}=await import('@modelcontextprotocol/sdk/client/stdio.js');
  const {fileURLToPath}=await import('node:url');
  const client=new Client({name:'security-test',version:'1.0.0'});
  const transport=new StdioClientTransport({command:process.execPath,args:[fileURLToPath(new URL('../dist/index.js',import.meta.url))],env:{},stderr:'pipe'});
  try {
    await client.connect(transport);
    const {tools}=await client.listTools();
    assert.equal(tools.length,1);assert.equal(tools[0].name,'jev_navigate');
    assert.equal(tools[0].annotations.destructiveHint,true);
    assert.ok(tools[0].inputSchema.properties.allowed_hosts);
    const result=await client.callTool({name:'jev_navigate',arguments:{task:'Read',start_url:'https://example.com',max_chars:2_000_000}});
    assert.equal(result.isError,true);
  } finally {await client.close();}
});
