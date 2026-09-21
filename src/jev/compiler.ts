import type { PageRef } from "../browser/types.js";

export const MAX_ELEMENTS = 240;
export const PRICE_PER_MTOK_IN = 0.042;

export interface PageElement {
  id: string; // e1, e2, ...
  ref: string; // @1, @2, ...
  kind: "click" | "type" | "select";
  description: string;
  options?: string[];
}

const NOISE_NAMES = new Set([
  "jump up", "jump up to", "jump to content", "edit", "permalink",
  "permanent link", "cite this page", "donate", "create account", "log in",
  "read", "source", "hide", "show", "skip to content",
]);

export function isNoiseName(name: string): boolean {
  const lowered = name.trim().toLowerCase();
  if (lowered.length === 0 || lowered.length > 80) return true;
  if (NOISE_NAMES.has(lowered)) return true;
  if (/^[\d\s.,:;()[\]-]+$/.test(lowered)) return true;
  return false;
}

export function isNoiseHref(href: string | undefined): boolean {
  if (!href) return false;
  const lowered = href.trim().toLowerCase();
  if (/^[a-z][a-z0-9+.-]*:/.test(lowered) && !/^https?:/.test(lowered)) return true;
  if (lowered.startsWith("#") || lowered.startsWith("javascript:") || lowered.startsWith("mailto:")) return true;
  return false;
}

export function compileActionSpace(refs: PageRef[]): { elements: PageElement[]; truncated: boolean } {
  const elements: PageElement[] = [];
  const seenHrefs = new Set<string>();

  for (const item of refs) {
    if (elements.length >= MAX_ELEMENTS) break;
    if (isNoiseName(item.name)) continue;
    if (isNoiseHref(item.href)) continue;

    if (item.href) {
      const key = item.href.split("#")[0];
      if (seenHrefs.has(key)) continue;
      seenHrefs.add(key);
    }

    if (!item.clickable && !item.typeable && !item.selectable) continue;

    const id = `e${elements.length + 1}`;
    const kind: "click" | "type" | "select" = item.typeable ? "type" : item.selectable ? "select" : "click";
    const hrefTail = item.href ? ` -> ${item.href.replace(/^https?:\/\//, "").slice(0, 60)}` : "";

    elements.push({
      id,
      ref: item.ref,
      kind,
      description:
        kind === "type"
          ? `${item.role} "${item.name}" (type into field)`
          : kind === "select"
            ? `${item.role} "${item.name}" (dropdown select)`
            : `${item.role} "${item.name}"${hrefTail}`,
      options: item.options,
    });
  }

  return { elements, truncated: elements.length >= MAX_ELEMENTS };
}

export function buildCriteria(elements: PageElement[]): Record<string, string> {
  const criteria: Record<string, string> = {};
  for (const el of elements) {
    criteria[`${el.kind}_${el.id}`] = el.description;
  }
  criteria["scroll_down"] = "Scroll down one screen to reveal more of the page";
  criteria["scroll_up"] = "Scroll up one screen";
  criteria["back"] = "Go back to the previous page; current branch is unproductive";
  criteria["done"] = "The task's goal is complete; stop here";
  return criteria;
}

export function pickAlternate(probabilities: Record<string, number> | undefined, exclude: Set<string>): string | null {
  const ranked = Object.entries(probabilities ?? {}).sort((a, b) => b[1] - a[1]);
  for (const [option, p] of ranked) {
    if (option === "back" || exclude.has(option)) continue;
    if (!Number.isFinite(p) || p <= 0 || p > 1) continue;
    return option;
  }
  return null;
}

const STOP_WORDS = new Set([
  "search", "find", "the", "a", "an", "for", "about", "article", "page", "open", "go", "navigate",
]);

export function heuristicQuery(task: string): string {
  const quoteMatch = task.match(/["']([^"']+)["']/);
  if (quoteMatch && quoteMatch[1].trim()) {
    return quoteMatch[1].trim();
  }
  const asWithMatch = task.match(/\b(?:as|with|value)\s+([A-Za-z0-9_-]+)/i);
  if (asWithMatch && asWithMatch[1]) {
    return asWithMatch[1].trim();
  }
  const words = task
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));
  return words.slice(0, 6).join(" ");
}
