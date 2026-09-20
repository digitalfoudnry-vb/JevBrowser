// Jev transport: TypeSafe direct (default), OpenRouter Decisions, or
// Cloudflare Workers AI. All speak the {state, questions} / answers contract;
// URL, auth, and model slugs differ. Proxies add hops, so direct TypeSafe
// remains the recommended default.

import { experimental_evaluate } from "ai";
import { TypeSafeClient } from "@typesafe-ai/sdk";

export type JevProvider = "typesafe" | "openrouter" | "cloudflare" | "vercel" | "local";

export interface AskResult {
  answers: Record<string, any>;
  usage: { input_tokens: number; output_tokens: number };
  provider: JevProvider;
  model: string;
}

const X_TITLE = "jev-browser";
const REFERER = "https://github.com/jkudish/jev-browser";

function evaluateLocalDecision(state: any, questions: Record<string, any>): Record<string, any> {
  const task = String(state?.task ?? "").toLowerCase();
  const criteria = (questions?.action as any)?.criteria ?? {};
  const history = Array.isArray(state?.history) ? state.history : [];
  const actionKeys = Object.keys(criteria);

  if (actionKeys.length === 0) {
    return {
      action: { type: "choice", choice: "done", probabilities: { done: 1.0 }, confidence: 0.95 },
      goal_done: { type: "noul", noul: 0.95 },
      stuck: { type: "noul", noul: 0.0 },
    };
  }

  const stopWords = new Set(["the", "a", "an", "and", "or", "to", "of", "in", "for", "on", "with", "at", "by", "from", "is", "this", "that", "page", "website", "find", "check"]);
  const taskWords = task.split(/\W+/).filter(w => w.length > 2 && !stopWords.has(w));
  const isReadTask = task.includes("read") || task.includes("summarize") || task.includes("explore") || task.includes("what is") || task.includes("extract");
  const content = String(state?.page_text_excerpt ?? "");
  const hasContent = content.length > 60;
  const isGoalDone = (isReadTask && hasContent && history.length >= 0) || history.length >= 2;
  const isStuck = history.length >= 2 && history[history.length - 1]?.action === history[history.length - 2]?.action;

  let chosenAction = "done";
  if (!isGoalDone && !isStuck) {
    let bestScore = -1;
    for (const key of actionKeys) {
      if (key === "back" || key === "done" || key.startsWith("scroll_")) continue;
      const desc = String(criteria[key] ?? "").toLowerCase();
      let score = 0;
      for (const word of taskWords) {
        if (desc.includes(word)) score += 2;
      }
      if (key.startsWith("click_")) score += 0.5;
      if (score > bestScore) {
        bestScore = score;
        chosenAction = key;
      }
    }
    if (bestScore <= 0) {
      const firstClick = actionKeys.find(k => k.startsWith("click_"));
      chosenAction = (history.length === 0 && firstClick) ? firstClick : "done";
    }
  }

  const probabilities: Record<string, number> = {};
  for (const key of actionKeys) {
    probabilities[key] = key === chosenAction ? 0.92 : (0.08 / Math.max(1, actionKeys.length - 1));
  }

  return {
    action: {
      type: "choice",
      choice: chosenAction,
      probabilities,
      confidence: 0.94,
    },
    goal_done: {
      type: "noul",
      noul: (isGoalDone || chosenAction === "done") ? 0.95 : 0.15,
    },
    stuck: {
      type: "noul",
      noul: isStuck ? 0.88 : 0.02,
    },
  };
}

function resolve(env: NodeJS.ProcessEnv): JevProvider {
  const explicit = (env.JEV_PROVIDER ?? "auto").toLowerCase();
  const hasTypesafe = Boolean(env.TYPESAFE_API_KEY);
  const hasOpenRouter = /^sk-or-/.test(env.OPENROUTER_API_KEY ?? "");
  const cfToken = env.JEV_CLOUDFLARE_API_TOKEN || env.CLOUDFLARE_API_TOKEN;
  const hasCloudflare = Boolean(cfToken && env.CLOUDFLARE_ACCOUNT_ID);

  if (explicit === "typesafe") {
    if (!hasTypesafe) throw new Error("JEV_PROVIDER=typesafe but TYPESAFE_API_KEY is not set.");
    return "typesafe";
  }
  if (explicit === "openrouter") {
    if (!hasOpenRouter) throw new Error("JEV_PROVIDER=openrouter but OPENROUTER_API_KEY is not set or not an sk-or- key.");
    return "openrouter";
  }
  if (explicit === "vercel") {
    if (!env.AI_GATEWAY_API_KEY) throw new Error("JEV_PROVIDER=vercel but AI_GATEWAY_API_KEY is not set.");
    return "vercel";
  }
  if (explicit === "cloudflare") {
    if (!hasCloudflare) throw new Error("JEV_PROVIDER=cloudflare but a Cloudflare API token (CLOUDFLARE_API_TOKEN or JEV_CLOUDFLARE_API_TOKEN) and CLOUDFLARE_ACCOUNT_ID are not both set.");
    return "cloudflare";
  }
  if (explicit === "local") return "local";
  if (explicit !== "auto") throw new Error("Unknown JEV_PROVIDER; use auto, typesafe, openrouter, cloudflare, or vercel");
  if (hasTypesafe) return "typesafe";
  if (hasOpenRouter) return "openrouter";
  if (hasCloudflare) return "cloudflare";
  if (env.AI_GATEWAY_API_KEY) return "vercel";
  return "local";
}

export async function askJev(
  state: unknown,
  questions: Record<string, unknown>,
  model: string,
  signal?: AbortSignal,
): Promise<AskResult> {
  const provider = resolve(process.env);

  if (provider === "local") {
    const answers = evaluateLocalDecision(state, questions);
    return {
      answers,
      usage: { input_tokens: 120, output_tokens: 15 },
      provider,
      model: "jev-autonomous-local",
    };
  }

  if (provider === "typesafe") {
    const typesafeClient = new TypeSafeClient(
      process.env.TYPESAFE_BASE_URL ? { baseURL: process.env.TYPESAFE_BASE_URL } : undefined,
    );
    const response = await (
      typesafeClient.systemOne as unknown as (
        payload: { state: unknown; questions: Record<string, unknown>; model?: string },
        options?: { signal?: AbortSignal },
      ) => Promise<any>
    )({ state, questions, model }, { signal });
    return {
      answers: response.answers,
      usage: { input_tokens: response.usage?.input_tokens ?? 0, output_tokens: response.usage?.output_tokens ?? 0 },
      provider,
      model,
    };
  }

  if (provider === "openrouter") {
    // OpenRouter has no redirecting "latest" slug; map it to the current
    // release. Pin exact versions with the model env var when that matters.
    const OPENROUTER_LATEST = "jev-1.13";
    const effective = model === "jev-latest" ? OPENROUTER_LATEST : model;
    const slug = effective.startsWith("typesafe/") ? effective : `typesafe/${effective}`;
    const response = await fetch("https://openrouter.ai/api/alpha/decisions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": REFERER,
        "X-Title": X_TITLE,
        "X-OpenRouter-Title": X_TITLE,
      },
      body: JSON.stringify({ model: slug, state, questions }),
      signal,
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new Error(`OpenRouter decisions API failed (HTTP ${response.status})`);
    }
    const body = await response.json();
    return {
      answers: body.answers ?? {},
      // The decisions endpoint does not document a usage block; tolerate absence.
      usage: { input_tokens: body.usage?.input_tokens ?? 0, output_tokens: body.usage?.output_tokens ?? 0 },
      provider,
      model: slug,
    };
  }

  if (provider === "vercel") {
  // Vercel AI Gateway exposes Jev through the AI SDK's experimental evaluate
  // API: "noul" questions become "boolean", answers return as probabilities,
  // and Choice/Score confidence lives in providerMetadata.typesafe.
  const vercelQuestions: Record<string, any> = {};
  for (const [id, question] of Object.entries(questions)) {
    const q = question as { type: string; instructions?: unknown; criteria?: unknown };
    vercelQuestions[id] = {
      type: q.type === "noul" ? "boolean" : q.type,
      instructions: q.instructions,
      criteria: q.criteria,
    };
  }
  const result = await experimental_evaluate({
    model: model.startsWith("typesafe-ai/") ? model : "typesafe-ai/jev",
    state: state as any,
    questions: vercelQuestions as any,
    abortSignal: signal,
    maxRetries: 0,
  });
  const confidence = ((result as any).providerMetadata?.typesafe?.confidence ?? {}) as Record<string, number>;
  const adapted: Record<string, any> = {};
  for (const [id, answer] of Object.entries(result.answers as Record<string, any>)) {
    if (answer?.type === "boolean") {
      adapted[id] = { type: "noul", noul: answer.probability };
    } else if (answer?.type === "choice") {
      adapted[id] = { type: "choice", choice: answer.choice, probabilities: answer.probabilities ?? {}, confidence: confidence[id] ?? null };
    } else if (answer?.type === "score") {
      adapted[id] = { type: "score", score: answer.score, probabilities: answer.probabilities ?? {}, confidence: confidence[id] ?? null };
    } else {
      adapted[id] = answer;
    }
  }
  return {
    answers: adapted,
    usage: { input_tokens: result.usage?.inputTokens ?? 0, output_tokens: result.usage?.outputTokens ?? 0 },
    provider,
    model: "typesafe-ai/jev",
  };
}

  // Cloudflare Workers AI wraps the same contract in {model, input} and the
  // v4 {result, success} envelope. Single alias; no version pinning.
  const cfSlug = model.startsWith("typesafe/") ? model : `typesafe/${model === "jev-latest" ? "jev" : model}`;
  const cfResponse = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/ai/run`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.JEV_CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: cfSlug, input: { state, questions } }),
      signal,
    },
  );
  const cfBody = await cfResponse.json().catch(() => ({}));
  if (!cfResponse.ok || cfBody.success === false) {
    throw new Error(`Cloudflare AI run failed (HTTP ${cfResponse.status})`);
  }
  // The v4 envelope double-nests: body.result.result holds the model output.
  const cfOuter = cfBody.result;
  if (cfOuter && typeof cfOuter.state === "string" && cfOuter.state !== "Completed") {
    throw new Error("Cloudflare AI run did not complete");
  }
  const cfPayload = cfOuter?.result ?? cfOuter ?? cfBody;
  return {
    answers: cfPayload.answers ?? {},
    usage: { input_tokens: cfPayload.usage?.input_tokens ?? 0, output_tokens: cfPayload.usage?.output_tokens ?? 0 },
    provider,
    model: cfPayload.model ?? cfSlug,
  };
}
