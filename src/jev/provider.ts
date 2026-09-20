import { experimental_evaluate } from "ai";
import { TypeSafeClient } from "@typesafe-ai/sdk";

export type JevProvider = "typesafe" | "openrouter" | "cloudflare" | "vercel";

export interface AskResult {
  answers: Record<string, any>;
  usage: { input_tokens: number; output_tokens: number };
  provider: JevProvider;
  model: string;
}

const X_TITLE = "jev-browser";
const REFERER = "https://github.com/digitalfoudnry-vb/JevBrowser";

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
  if (explicit !== "auto") throw new Error("Unknown JEV_PROVIDER; use auto, typesafe, openrouter, cloudflare, or vercel");

  if (hasTypesafe) return "typesafe";
  if (hasOpenRouter) return "openrouter";
  if (hasCloudflare) return "cloudflare";
  if (hasVercel) return "vercel";

  throw new Error(
    "No AI_GATEWAY_API_KEY, TYPESAFE_API_KEY, OPENROUTER_API_KEY, or Cloudflare credentials found. Set one, or JEV_PROVIDER to choose explicitly.",
  );
}

export async function askJev(
  state: unknown,
  questions: Record<string, unknown>,
  model: string = "typesafe-ai/jev",
  signal?: AbortSignal,
): Promise<AskResult> {
  const provider = resolve(process.env);

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
