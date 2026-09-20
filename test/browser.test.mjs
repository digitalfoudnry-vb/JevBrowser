import assert from 'node:assert/strict';
import { test } from 'node:test';
import { chromium } from 'playwright';
import { installBrowserPolicy } from '../dist/security.js';
import { fillField } from '../dist/navigate.js';
import { startPublicProxy } from '../dist/proxy.js';

test('real Chromium: policy allows scoped reads and blocks private, off-scope and mutating requests', async () => {
  const browser=await chromium.launch({chromiumSandbox:true});
  try {
    const context=await browser.newContext({serviceWorkers:'block'});
    const served=[];
    await context.route('**/*',route=>{served.push(route.request().url());return route.fulfill({contentType:'text/html',body:'<h1>Fixture</h1>'});});
    await installBrowserPolicy(context,{allowedHosts:new Set(['example.com','127.0.0.1']),allowMutations:false});
    const page=await context.newPage();
    await page.goto('https://example.com/');
    const blocked=await page.evaluate(async()=>Promise.all([
      fetch('http://127.0.0.1/').then(()=>false,()=>true),
      fetch('https://evil.example/').then(()=>false,()=>true),
      fetch('/write',{method:'POST',body:'secret'}).then(()=>false,()=>true),
    ]));
    assert.deepEqual(blocked,[true,true,true]);
    assert.deepEqual(served,['https://example.com/']);
    await assert.rejects(page.goto('https://evil.example/redirect-target'));
  } finally {await browser.close();}
});
test('real Chromium: filling does not press Enter unless explicitly requested',async()=>{
  const browser=await chromium.launch({chromiumSandbox:true});
  try {
    const page=await browser.newPage();
    await page.setContent('<form><input id="q"></form><script>window.submissions=0;document.querySelector("form").onsubmit=e=>{e.preventDefault();window.submissions++}</script>');
    await fillField(page,'#q','search terms',false,1000);
    assert.equal(await page.inputValue('#q'),'search terms');
    assert.equal(await page.evaluate(()=>window.submissions),0);
    await fillField(page,'#q','search terms',true,1000);
    assert.equal(await page.evaluate(()=>window.submissions),1);
  } finally {await browser.close();}
});
test('real Chromium: proxy cannot bypass loopback policy',async()=>{
  const proxy=await startPublicProxy(new Set(['127.0.0.1']));
  const browser=await chromium.launch({chromiumSandbox:true,proxy:{server:proxy.server,bypass:'<-loopback>'}});
  try {
    const page=await browser.newPage();
    const response=await page.goto('http://127.0.0.1/');
    assert.equal(response.status(),403);
  } finally {await browser.close();await proxy.close();}
});
test('caller cancellation during launch closes the browser and reports cancelled',async()=>{
  const {navigate}=await import('../dist/navigate.js');
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),25);
  try {
    const result=await navigate({task:'Read',startUrl:'https://example.com',maxSeconds:10},controller.signal);
    assert.equal(result.status,'cancelled');
  } finally {clearTimeout(timer);}
});
test('full navigation loop uses Vercel judgments, fills without submission, and extracts clean Markdown',async()=>{
  const {navigate}=await import('../dist/navigate.js');
  const originalLaunch=chromium.launch.bind(chromium);
  const originalFetch=globalThis.fetch;
  const keys=['JEV_PROVIDER','AI_GATEWAY_API_KEY','JEV_BROWSER_TYPE_BASE_URL','JEV_BROWSER_TYPE_PROVIDER','OPENAI_API_KEY','OPENROUTER_API_KEY','ANTHROPIC_API_KEY','GEMINI_API_KEY','GOOGLE_GENERATIVE_AI_API_KEY'];
  const saved=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  keys.forEach(k=>delete process.env[k]);process.env.JEV_PROVIDER='vercel';process.env.AI_GATEWAY_API_KEY='mock-only';
  let calls=0;
  chromium.launch=async options=>{
    const browser=await originalLaunch(options);
    const originalContext=browser.newContext.bind(browser);
    browser.newContext=async options=>{
      const context=await originalContext(options);
      await context.route('**/*',route=>route.fulfill({contentType:'text/html',body:`<form><input aria-label="Search"></form><p id="state">Empty</p><p id="submitted">Not submitted</p><script>/* NEVER_INCLUDE_SCRIPT */document.querySelector('input').oninput=()=>document.querySelector('#state').textContent='Filled';document.querySelector('form').onsubmit=e=>{e.preventDefault();document.querySelector('#submitted').textContent='Was submitted'}</script>`}));
      return context;
    };
    return browser;
  };
  globalThis.fetch=async(url,init)=>{
    assert.match(String(url),/evaluation-model$/);
    calls++;
    const request=JSON.parse(init.body);
    const action=calls===1 ? 'type_e1' : 'done';
    assert.ok(Object.hasOwn(request.questions.action.criteria,action));
    return Response.json({answers:{action:{type:'choice',choice:action,probabilities:Object.fromEntries(Object.keys(request.questions.action.criteria).map(key=>[key,key===action?1:0]))},goal_done:{type:'boolean',probability:0},stuck:{type:'boolean',probability:0}},usage:{inputTokens:100,outputTokens:0}});
  };
  try {
    const result=await navigate({task:'Fill search with kittens',startUrl:'https://example.com',allowTyping:true,format:'markdown',screenshot:'none',maxSteps:3,maxSeconds:20});
    assert.equal(result.status,'done',JSON.stringify(result));assert.equal(calls,2);
    assert.match(result.page.content,/Filled/);assert.match(result.page.content,/Not submitted/);
    assert.doesNotMatch(result.page.content,/NEVER_INCLUDE_SCRIPT/);
    assert.equal(result.jev_provider,'vercel');assert.equal(result.usage.input_tokens,200);
    assert.equal(result.steps[0].executed_action,'type_e1');
  } finally {
    chromium.launch=originalLaunch;globalThis.fetch=originalFetch;
    for(const [key,value] of Object.entries(saved)) value===undefined ? delete process.env[key] : process.env[key]=value;
  }
});
test('deadline stops a page whose JavaScript never yields',async()=>{
  const {navigate}=await import('../dist/navigate.js');
  const originalLaunch=chromium.launch.bind(chromium);
  chromium.launch=async options=>{
    const browser=await originalLaunch(options);
    const originalContext=browser.newContext.bind(browser);
    browser.newContext=async options=>{
      const context=await originalContext(options);
      await context.route('**/*',route=>route.fulfill({contentType:'text/html',body:'<script>while(true){}</script>'}));
      return context;
    };
    return browser;
  };
  const started=Date.now();
  try {
    const result=await navigate({task:'Read',startUrl:'https://example.com',maxSeconds:1,screenshot:'none'});
    assert.equal(result.status,'timeout',JSON.stringify(result));
    assert.ok(Date.now()-started<5000,'Deadline should close a blocked renderer promptly');
  } finally {chromium.launch=originalLaunch;}
});
