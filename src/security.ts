import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { z } from "zod";
import type { BrowserContext } from "playwright";

export const navigateSchema = z.object({
  task: z.string().trim().min(1).max(10_000),
  startUrl: z.string().max(4096),
  maxSteps: z.number().int().min(1).max(100).default(24),
  maxSeconds: z.number().finite().min(1).max(600).default(180),
  allowTyping: z.boolean().default(false),
  submitAfterTyping: z.boolean().default(false),
  allowMutations: z.boolean().default(false),
  allowedHosts: z.array(z.string().min(1).max(253)).max(50).optional(),
  format: z.enum(["text", "markdown", "html", "aria"]).default("text"),
  maxChars: z.number().int().min(1).max(1_000_000).optional(),
  screenshot: z.enum(["final", "none"]).default("final"),
  recordDir: z.string().min(1).optional(),
}).strict();

export function publicUrl(value: string): URL {
  const url = new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password)
    throw new Error("Only HTTP(S) URLs without embedded credentials are allowed");
  if (url.port && !["80", "443"].includes(url.port))
    throw new Error("Only public web ports 80 and 443 are allowed");
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || /\.(localhost|local|internal|home|lan)$/.test(host))
    throw new Error("Private hostnames are blocked");
  if (ipaddr.isValid(host) && !isPublicAddress(host)) throw new Error("Non-public IP address blocked");
  return url;
}

export function isPublicAddress(address: string): boolean {
  if (!ipaddr.isValid(address)) return false;
  const parsed = ipaddr.parse(address);
  // Reject mapped IPv4, transition mechanisms, local and special-use ranges.
  if (parsed.range() !== "unicast") return false;
  if (parsed.kind() === "ipv6") return parsed.match(ipaddr.parse("2000::"), 3);
  return true;
}

export async function resolvePublicHost(host: string, resolver = lookup): Promise<string> {
  const normalized = publicUrl(`https://${host.includes(":") && !host.startsWith("[") ? `[${host}]` : host}`).hostname.replace(/^\[|\]$/g, "");
  const addresses = await resolver(normalized, { all: true, verbatim: true });
  if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address)))
    throw new Error("DNS resolved to a non-public address");
  return addresses[0].address;
}

export function normalizeHosts(hosts: string[]): Set<string> {
  return new Set(hosts.map(host => {
    if (!/^(?:[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?|\[[0-9a-f:]+\])$/i.test(host)) throw new Error("Invalid exact hostname");
    const url = publicUrl(`https://${host}`);
    if (url.host !== host.toLowerCase() || url.pathname !== "/" || url.search || url.hash)
      throw new Error("allowedHosts must contain exact hostnames without paths, wildcards, or ports");
    return url.hostname;
  }));
}

export async function installBrowserPolicy(context: BrowserContext, options: { allowedHosts: Set<string>; allowMutations: boolean }) {
  // Covers subresources, redirects and popups; service workers are disabled at context creation.
  await context.route("**/*", async route => {
    try {
      const request = route.request();
      const url = publicUrl(request.url());
      if (!options.allowedHosts.has(url.hostname)) throw new Error("Host outside task scope");
      if (!options.allowMutations && !["GET", "HEAD", "OPTIONS"].includes(request.method()))
        throw new Error("Mutating HTTP method blocked");
      await route.fallback();
    } catch {
      await route.abort("blockedbyclient").catch(() => {});
    }
  });
  await context.routeWebSocket("**/*", socket => socket.close());
}

export function safeError(error: unknown): string {
  let message = error instanceof Error ? error.message : String(error);
  // Do not serialize provider response bodies or known environment secrets.
  for (const [key, value] of Object.entries(process.env)) {
    if (/(KEY|TOKEN|SECRET|PASSWORD)/i.test(key) && value && value.length >= 8)
      message = message.split(value).join("[REDACTED]");
  }
  return message.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]").slice(0, 300);
}

export function validateStepAnswers(answers: any, criteria: Record<string, string>) {
  const probability = z.number().finite().min(0).max(1);
  const result = z.object({
    action: z.object({ choice: z.string(), probabilities: z.record(probability).default({}), confidence: probability.nullish() }),
    goal_done: z.object({ noul: probability }),
    stuck: z.object({ noul: probability }),
  }).parse(answers);
  if (!Object.hasOwn(criteria, result.action.choice)) throw new Error("Model returned an action outside the offered choices");
  result.action.probabilities = Object.fromEntries(Object.entries(result.action.probabilities).filter(([key]) => Object.hasOwn(criteria, key)));
  return result;
}
