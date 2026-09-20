import assert from "node:assert/strict";
import { test } from "node:test";
import { parseSnapshot } from "../dist/browser/snapshot-parser.js";
import {
  compileActionSpace,
  buildCriteria,
  pickAlternate,
  heuristicQuery,
  isNoiseName,
  isNoiseHref,
} from "../dist/jev/compiler.js";

test("parseSnapshot parses structured snapshot output", () => {
  const rawSnapshot = `
root (viewport snapshot: 5 interactive elements)
  @1 button "Sign in" [loc=button:sign-in]
  @2 searchbox "Search documentation" [loc=input:search]
  @3 link "Pricing" -> /pricing [loc=a:pricing]
  @4 combobox "Language" [loc=select:lang]
  @5 checkbox "Remember me"
  non-interactive text
`;

  const refs = parseSnapshot(rawSnapshot);
  assert.equal(refs.length, 5);

  const [b1, s2, l3, c4, cb5] = refs;

  assert.equal(b1.ref, "@1");
  assert.equal(b1.role, "button");
  assert.equal(b1.name, "Sign in");
  assert.equal(b1.clickable, true);
  assert.equal(b1.typeable, false);

  assert.equal(s2.ref, "@2");
  assert.equal(s2.role, "searchbox");
  assert.equal(s2.name, "Search documentation");
  assert.equal(s2.typeable, true);

  assert.equal(l3.ref, "@3");
  assert.equal(l3.role, "link");
  assert.equal(l3.name, "Pricing");
  assert.equal(l3.clickable, true);

  assert.equal(c4.ref, "@4");
  assert.equal(c4.role, "combobox");
  assert.equal(c4.selectable, true);

  assert.equal(cb5.ref, "@5");
  assert.equal(cb5.role, "checkbox");
  assert.equal(cb5.clickable, true);
});

test("compiler filters noise elements and builds clean action space", () => {
  assert.equal(isNoiseName("jump to content"), true);
  assert.equal(isNoiseName("donate"), true);
  assert.equal(isNoiseName("Log In"), true);
  assert.equal(isNoiseName("12345"), true);
  assert.equal(isNoiseName("Valid Documentation"), false);

  assert.equal(isNoiseHref("javascript:void(0)"), true);
  assert.equal(isNoiseHref("#section-1"), true);
  assert.equal(isNoiseHref("mailto:support@example.com"), true);
  assert.equal(isNoiseHref("https://example.com/docs"), false);

  const rawRefs = [
    { ref: "@1", role: "button", name: "jump to content", clickable: true, typeable: false, selectable: false },
    { ref: "@2", role: "textbox", name: "Query", clickable: false, typeable: true, selectable: false },
    { ref: "@3", role: "link", name: "Documentation", href: "https://example.com/docs", clickable: true, typeable: false, selectable: false },
    { ref: "@4", role: "combobox", name: "Select Model", clickable: false, typeable: false, selectable: true },
  ];

  const { elements, truncated } = compileActionSpace(rawRefs);
  assert.equal(truncated, false);
  assert.equal(elements.length, 3); // noise "jump to content" omitted

  assert.equal(elements[0].id, "e1");
  assert.equal(elements[0].kind, "type");
  assert.equal(elements[0].ref, "@2");

  assert.equal(elements[1].id, "e2");
  assert.equal(elements[1].kind, "click");
  assert.equal(elements[1].ref, "@3");

  assert.equal(elements[2].id, "e3");
  assert.equal(elements[2].kind, "select");
  assert.equal(elements[2].ref, "@4");

  const criteria = buildCriteria(elements);
  assert.ok(criteria["type_e1"]);
  assert.ok(criteria["click_e2"]);
  assert.ok(criteria["select_e3"]);
  assert.ok(criteria["scroll_down"]);
  assert.ok(criteria["scroll_up"]);
  assert.ok(criteria["back"]);
  assert.ok(criteria["done"]);
});

test("pickAlternate selects next viable action excluding visited or back", () => {
  const probs = {
    click_e1: 0.85,
    click_e2: 0.12,
    scroll_down: 0.02,
    back: 0.01,
  };

  const excluded = new Set(["click_e1"]);
  const alt = pickAlternate(probs, excluded);
  assert.equal(alt, "click_e2");

  excluded.add("click_e2");
  const alt2 = pickAlternate(probs, excluded);
  assert.equal(alt2, "scroll_down");
});

test("heuristicQuery extracts meaningful search terms", () => {
  const query = heuristicQuery("Search for the latest API documentation release notes");
  assert.equal(query, "latest api documentation release notes");
});
