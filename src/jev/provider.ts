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
const REFERER = "https://github.com/digitalfoundry-vb/JevBrowser";

function evaluateLocalDecision(state: any, questions: Record<string, any>): Record<string, any> {
  const task = String(state?.task ?? "").toLowerCase();
  const criteria = (questions?.action as any)?.criteria ?? {};
  const history: Array<{ step: number; action: string; outcome?: string }> = Array.isArray(state?.history) ? state.history : [];
  const actionKeys = Object.keys(criteria);

  if (actionKeys.length === 0) {
    return {
      action: { type: "choice", choice: "done", probabilities: { done: 1.0 }, confidence: 0.95 },
      goal_done: { type: "noul", noul: 0.95 },
      stuck: { type: "noul", noul: 0.0 },
    };
  }

  const executedActions = new Set(history.map(h => h.action));
  const isStuck = history.length >= 2 && history[history.length - 1]?.action === history[history.length - 2]?.action;

  const stopWords = new Set([
    "the", "a", "an", "and", "or", "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "is", "it", "this", "that", "page", "website", "site", "please", "can", "you", "me", "how",
  ]);
  const taskWords = task.split(/[^a-z0-9_]+/).filter(w => w.length >= 3 && !stopWords.has(w));

  const currentTitle = String(state?.current_page?.title ?? "").toLowerCase();
  const content = String(state?.page_text_excerpt ?? "").toLowerCase();

  let matchCount = 0;
  for (const word of taskWords) {
    if (content.includes(word) || currentTitle.includes(word)) {
      matchCount++;
    }
  }

  const hasSubstantialContent = content.length > 100;
  const hasNavigated = history.length > 0;

  let isGoalDone = false;
  if (hasNavigated) {
    if (matchCount >= 2 || (hasSubstantialContent && history.length >= 2)) {
      isGoalDone = true;
    } else if (history.length >= 3) {
      isGoalDone = true;
    }
  }

  let chosenAction = "done";
  const scores: Record<string, number> = {};

  if (!isGoalDone && !isStuck) {
    let bestScore = -1;
    for (const key of actionKeys) {
      if (key === "back") {
        scores[key] = history.length > 2 ? 0.1 : 0.01;
        continue;
      }
      if (key === "done") {
        scores[key] = hasNavigated && hasSubstantialContent ? 0.8 : 0.02;
        continue;
      }
      if (key.startsWith("scroll_")) {
        scores[key] = 0.2;
        continue;
      }

      const desc = String(criteria[key] ?? "").toLowerCase();
      let score = 0.5;

      const allowedHostsSet = new Set(Array.isArray(state?.allowed_hosts) ? state.allowed_hosts.map((h: string) => h.toLowerCase()) : []);
      if (allowedHostsSet.size > 0 && desc.includes(" -> ")) {
        const destPart = desc.split(" -> ")[1]?.trim() ?? "";
        const destHost = destPart.split("/")[0]?.split(":")[0]?.toLowerCase();
        if (destHost && !allowedHostsSet.has(destHost)) {
          scores[key] = 0.001;
          continue;
        }
      }

      if (executedActions.has(key)) {
        score = 0.01;
        scores[key] = score;
        continue;
      }

      for (const word of taskWords) {
        if (desc.includes(word)) {
          score += 3.0;
        }
      }

      if (task.includes("learn") && desc.includes("learn")) score += 3.0;
      if (task.includes("doc") && (desc.includes("doc") || desc.includes("guide") || desc.includes("manual"))) score += 3.0;
      if (task.includes("price") && (desc.includes("price") || desc.includes("pricing") || desc.includes("plan"))) score += 3.0;
      if (task.includes("download") && (desc.includes("download") || desc.includes("install") || desc.includes("release"))) score += 3.0;
      if (task.includes("contact") && desc.includes("contact")) score += 2.5;
      if (task.includes("about") && desc.includes("about")) score += 2.0;

      if (key.startsWith("type_")) {
        score += 1.0;
        if (task.includes("fill") || task.includes("type") || task.includes("enter") || task.includes("input") || task.includes("search")) {
          score += 2.5;
        }
        for (const word of taskWords) {
          if (desc.includes(word)) score += 4.0;
        }
      }

      if (key.startsWith("click_")) {
        score += 0.5;
        if (!desc.includes("cookie") && !desc.includes("privacy") && !desc.includes("terms")) {
          score += 0.5;
        }
        // If there are unfilled type fields matching task keywords, delay submit button
        const hasUnfilledInputs = actionKeys.some(k => k.startsWith("type_") && !executedActions.has(k));
        if (hasUnfilledInputs && (desc.includes("submit") || desc.includes("order") || desc.includes("send"))) {
          score = 0.05;
        }
      }

      scores[key] = score;
      if (score > bestScore) {
        bestScore = score;
        chosenAction = key;
      }
    }

    if (bestScore <= 0.1) {
      const unvisited = actionKeys.find(k => k.startsWith("click_") && !executedActions.has(k));
      if (unvisited && !hasNavigated) {
        chosenAction = unvisited;
      } else {
        chosenAction = "done";
        isGoalDone = true;
      }
    }
  }

  let totalWeight = 0;
  const weights: Record<string, number> = {};
  for (const key of actionKeys) {
    let w = key === chosenAction ? 10.0 : (scores[key] ?? 0.1);
    if (executedActions.has(key)) w = 0.01;
    weights[key] = Math.max(0.01, w);
    totalWeight += weights[key];
  }

  const probabilities: Record<string, number> = {};
  for (const key of actionKeys) {
    probabilities[key] = parseFloat((weights[key] / totalWeight).toFixed(4));
  }

  const confidence = chosenAction === "done" && !hasNavigated ? 0.75 : 0.94;
  const goalDoneVal = isGoalDone || chosenAction === "done" ? 0.95 : (hasNavigated ? 0.45 : 0.08);

  return {
    action: {
      type: "choice",
      choice: chosenAction,
      probabilities,
      confidence,
    },
    goal_done: {
      type: "noul",
      noul: goalDoneVal,
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
  const hasVercel = Boolean(env.AI_GATEWAY_API_KEY);

  if (explicit === "typesafe") {
    if (!hasTypesafe) throw new Error("JEV_PROVIDER=typesafe but TYPESAFE_API_KEY is not set.");
    return "typesafe";
  }
  if (explicit === "openrouter") {
    if (!hasOpenRouter) throw new Error("JEV_PROVIDER=openrouter but OPENROUTER_API_KEY is not set or not an sk-or- key.");
    return "openrouter";
  }
  if (explicit === "vercel") {
    if (!hasVercel) throw new Error("JEV_PROVIDER=vercel but AI_GATEWAY_API_KEY is not set.");
    return "vercel";
  }
  if (explicit === "cloudflare") {
    if (!hasCloudflare) throw new Error("JEV_PROVIDER=cloudflare but Cloudflare credentials are missing.");
    return "cloudflare";
  }
  if (explicit === "local") return "local";
  if (explicit !== "auto") throw new Error("Unknown JEV_PROVIDER; use auto, typesafe, openrouter, cloudflare, or vercel");

  if (hasTypesafe) return "typesafe";
  if (hasOpenRouter) return "openrouter";
  if (hasCloudflare) return "cloudflare";
  if (hasVercel) return "vercel";
  return "local";
}

export async function askJev(
  state: unknown,
  questions: Record<string, unknown>,
  model: string = "typesafe-ai/jev",
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
    const body = (await response.json()) as any;
    return {
      answers: body.answers ?? {},
      usage: { input_tokens: body.usage?.input_tokens ?? 0, output_tokens: body.usage?.output_tokens ?? 0 },
      provider,
      model: slug,
    };
  }

  if (provider === "vercel") {
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
      model: model.startsWith("typesafe-ai/") ? (model as any) : "typesafe-ai/jev",
      state: state as any,
      questions: vercelQuestions as any,
      abortSignal: signal,
      maxRetries: 0,
    });
    const confidence = ((result as any).providerMetadata?.typesafe?.confidence ?? {}) as Record<string, number>;
    const adapted: Record<string, any> = {};
    for (const [id, answer] of Object.entries((result as any).answers as Record<string, any>)) {
      if (answer?.type === "boolean") {
        adapted[id] = { type: "noul", noul: answer.probability };
      } else if (answer?.type === "choice") {
        adapted[id] = {
          type: "choice",
          choice: answer.choice,
          probabilities: answer.probabilities ?? {},
          confidence: confidence[id] ?? null,
        };
      } else if (answer?.type === "score") {
        adapted[id] = {
          type: "score",
          score: answer.score,
          probabilities: answer.probabilities ?? {},
          confidence: confidence[id] ?? null,
        };
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

  // Cloudflare Workers AI
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
  const cfBody = (await cfResponse.json().catch(() => ({}))) as any;
  if (!cfResponse.ok || cfBody.success === false) {
    throw new Error(`Cloudflare AI run failed (HTTP ${cfResponse.status})`);
  }
  const cfOuter = cfBody.result;
  const cfPayload = cfOuter?.result ?? cfOuter ?? cfBody;
  return {
    answers: cfPayload.answers ?? {},
    usage: { input_tokens: cfPayload.usage?.input_tokens ?? 0, output_tokens: cfPayload.usage?.output_tokens ?? 0 },
    provider,
    model: cfPayload.model ?? cfSlug,
  };
}
