import type { PageRef, SnapshotResult } from "./types.js";

/**
 * Parses a structured textual snapshot into structured PageRef elements.
 */
export function parseSnapshot(text: string): PageRef[] {
  const refs: PageRef[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("[p") || trimmed === "root") continue;

    // Pattern 1: @12 role "Label" [loc=...]
    // Pattern 2: role "Label" [ref=12, loc=...]
    // Pattern 3: - role "Label" (@12)
    let refNum: string | null = null;
    let role: string = "generic";
    let name: string = "";
    let loc: string | undefined;

    const atMatch = trimmed.match(/@(\d+)/);
    if (atMatch) {
      refNum = atMatch[1];
    } else {
      const refAttrMatch = trimmed.match(/ref=(\d+)/i);
      if (refAttrMatch) refNum = refAttrMatch[1];
    }

    if (!refNum) continue;

    // Extract role
    const roleMatch = trimmed.match(/(?:@\d+\s+)?([a-z-]+)\s+"([^"]*)"/i) ||
                      trimmed.match(/(?:-\s+)?([a-z-]+)\s+"([^"]*)"/i);
    if (roleMatch) {
      role = roleMatch[1].toLowerCase();
      name = roleMatch[2];
    } else {
      const quoteMatch = trimmed.match(/"([^"]*)"/);
      if (quoteMatch) name = quoteMatch[1];
    }

    // Extract loc
    const locMatch = trimmed.match(/loc=([^\],]+)/i);
    if (locMatch) {
      loc = locMatch[1].trim();
    }

    const typeableRoles = new Set(["textbox", "searchbox", "combobox", "input", "textarea"]);
    const clickableRoles = new Set(["button", "link", "checkbox", "radio", "tab", "menuitem"]);
    const selectableRoles = new Set(["combobox", "select", "listbox"]);

    const isTypeable = typeableRoles.has(role);
    const isClickable = clickableRoles.has(role) || (!isTypeable && role !== "select");
    const isSelectable = selectableRoles.has(role) || role === "select";

    refs.push({
      ref: `@${refNum}`,
      role,
      name,
      loc,
      clickable: isClickable,
      typeable: isTypeable,
      selectable: isSelectable,
    });
  }

  return refs;
}

/**
 * Generates a structured accessibility snapshot from a Playwright Page in standalone mode.
 */
export async function generateStandaloneSnapshot(page: any): Promise<SnapshotResult> {
  const data = await page.evaluate(() => {
    const SEL = 'a[href], button, input, textarea, select, [role="button"], [role="link"], [role="searchbox"], [role="textbox"], [role="combobox"], [role="checkbox"], [role="radio"]';
    const elements: any[] = [];
    const stamped = document.querySelectorAll(SEL);

    let idx = 1;
    for (const el of Array.from(stamped) as HTMLElement[]) {
      if (idx > 240) break;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden") continue;

      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute("role") || (tag === "a" ? "link" : tag === "input" ? "textbox" : tag);
      const type = (el.getAttribute("type") || "").toLowerCase();
      if (type === "password" || type === "hidden") continue;

      const name = (
        el.getAttribute("aria-label") ||
        el.getAttribute("placeholder") ||
        el.getAttribute("title") ||
        el.innerText ||
        el.textContent ||
        ""
      ).replace(/\s+/g, " ").trim().slice(0, 100);

      const ref = `@${idx++}`;
      el.setAttribute("data-jev-ref", ref);
      el.setAttribute("data-ref", ref);

      const href = tag === "a" ? el.getAttribute("href") || "" : undefined;
      const options = tag === "select"
        ? Array.from((el as HTMLSelectElement).options).map(o => o.text.trim()).filter(Boolean).slice(0, 50)
        : undefined;

      const typeable = tag === "textarea" || (tag === "input" && !["button", "submit", "checkbox", "radio"].includes(type)) || ["textbox", "searchbox"].includes(role);
      const clickable = ["button", "link", "checkbox", "radio"].includes(role) || ["a", "button"].includes(tag);
      const selectable = tag === "select" || role === "combobox";

      elements.push({
        ref,
        role,
        name,
        href,
        type,
        clickable,
        typeable,
        selectable,
        options,
      });
    }

    return elements;
  });

  const lines: string[] = [`root (viewport snapshot: ${data.length} interactive elements)`];
  for (const item of data) {
    const tail = item.href ? ` -> ${item.href.slice(0, 60)}` : "";
    lines.push(`  ${item.ref} ${item.role} "${item.name}"${tail}`);
  }

  return {
    content: lines.join("\n"),
    refs: data,
  };
}
