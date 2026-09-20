import assert from 'node:assert/strict';
import { test } from 'node:test';
import { askJev } from '../dist/provider.js';
import { stepQuestions } from '../dist/questions.js';

test('Vercel adapter uses evaluation API and translates answers and usage', async () => {
  const originalFetch = globalThis.fetch;
  const previous = {JEV_PROVIDER:process.env.JEV_PROVIDER, AI_GATEWAY_API_KEY:process.env.AI_GATEWAY_API_KEY};
  process.env.JEV_PROVIDER='vercel'; process.env.AI_GATEWAY_API_KEY='test-key-never-sent';
  let calls=0;
  globalThis.fetch=async (url,init) => {
    calls++;
    assert.match(String(url),/evaluation-model$/);
    assert.equal(new Headers(init.headers).get('ai-model-id'),'typesafe-ai/jev');
    const request=JSON.parse(init.body);
    assert.equal(request.questions.goal_done.type,'boolean');
    return Response.json({answers:{action:{type:'choice',choice:'done',probabilities:{done:1}},goal_done:{type:'boolean',probability:0.96},stuck:{type:'boolean',probability:0}},usage:{inputTokens:120,outputTokens:0},providerMetadata:{typesafe:{confidence:{action:0.91}}}});
  };
  try {
    const result=await askJev({task:'read'},stepQuestions({done:'Done'}),'jev-latest');
    assert.equal(result.provider,'vercel'); assert.equal(result.answers.goal_done.noul,0.96);
    assert.equal(result.answers.action.confidence,0.91); assert.equal(result.usage.input_tokens,120); assert.equal(calls,1);
  } finally {
    globalThis.fetch=originalFetch;
    for (const [key,value] of Object.entries(previous)) value===undefined ? delete process.env[key] : process.env[key]=value;
  }
});
test('unknown explicit provider cannot silently route data elsewhere', async () => {
  const previous=process.env.JEV_PROVIDER; process.env.JEV_PROVIDER='typo';
  try {await assert.rejects(askJev({}, {}, 'jev-latest'), /Unknown JEV_PROVIDER/);}
  finally {previous===undefined ? delete process.env.JEV_PROVIDER : process.env.JEV_PROVIDER=previous;}
});
