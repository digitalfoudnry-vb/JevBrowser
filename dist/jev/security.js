import { lookup } from "node:dns/promises";
import ipaddr from "ipaddr.js";
import { z } from "zod";
export function publicUrl(value) {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
        throw new Error("Only HTTP(S) URLs without embedded credentials are allowed");
    }
    const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
    if (host === "localhost" || /\.(localhost|local|internal|home|lan)$/.test(host)) {
        throw new Error("Private hostnames are blocked");
    }
    if (ipaddr.isValid(host) && !isPublicAddress(host)) {
        throw new Error("Non-public IP address blocked");
    }
    if (url.port && !["80", "443"].includes(url.port)) {
        throw new Error("Only public web ports 80 and 443 are allowed");
    }
    return url;
}
export function isPublicAddress(address) {
    if (!ipaddr.isValid(address))
        return false;
    const parsed = ipaddr.parse(address);
    if (parsed.range() !== "unicast")
        return false;
    if (parsed.kind() === "ipv6")
        return parsed.match(ipaddr.parse("2000::"), 3);
    return true;
}
export async function resolvePublicHost(host, resolver = lookup) {
    const normalized = publicUrl(`https://${host.includes(":") && !host.startsWith("[") ? `[${host}]` : host}`).hostname.replace(/^\[|\]$/g, "");
    const addresses = await resolver(normalized, { all: true, verbatim: true });
    if (!addresses.length || addresses.some(({ address }) => !isPublicAddress(address))) {
        throw new Error("DNS resolved to a non-public address");
    }
    return addresses[0].address;
}
export function normalizeHosts(hosts) {
    return new Set(hosts.map((host) => {
        if (!/^(?:[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?|\[[0-9a-f:]+\])$/i.test(host)) {
            throw new Error("Invalid exact hostname");
        }
        const url = publicUrl(`https://${host}`);
        if (url.host !== host.toLowerCase() || url.pathname !== "/" || url.search || url.hash) {
            throw new Error("allowedHosts must contain exact hostnames without paths, wildcards, or ports");
        }
        return url.hostname;
    }));
}
export function safeError(error) {
    let message = error instanceof Error ? error.message : String(error);
    for (const [key, value] of Object.entries(process.env)) {
        if (/(KEY|TOKEN|SECRET|PASSWORD)/i.test(key) && value && value.length >= 8) {
            message = message.split(value).join("[REDACTED]");
        }
    }
    return message.replace(/Bearer\s+\S+/gi, "Bearer [REDACTED]").slice(0, 300);
}
export function validateStepAnswers(answers, criteria) {
    const probability = z.number().finite().min(0).max(1);
    const result = z.object({
        action: z.object({
            choice: z.string(),
            probabilities: z.record(probability).default({}),
            confidence: probability.nullish(),
        }),
        goal_done: z.object({ noul: probability }),
        stuck: z.object({ noul: probability }),
    }).parse(answers);
    if (!Object.hasOwn(criteria, result.action.choice)) {
        throw new Error("Model returned an action outside the offered choices");
    }
    result.action.probabilities = Object.fromEntries(Object.entries(result.action.probabilities).filter(([key]) => Object.hasOwn(criteria, key)));
    return result;
}
//# sourceMappingURL=security.js.map