import assert from "node:assert/strict";
import { test } from "node:test";
import { parseInstallArgs } from "../scripts/install-skill.mjs";

test("parseInstallArgs correctly parses flags", () => {
  const parsed1 = parseInstallArgs(["--dry-run", "--client", "claude"]);
  assert.equal(parsed1.dryRun, true);
  assert.equal(parsed1.client, "claude");
  assert.equal(parsed1.customDest, null);

  const parsed2 = parseInstallArgs(["--dest", "/tmp/custom-skill"]);
  assert.equal(parsed2.dryRun, false);
  assert.equal(parsed2.client, null);
  assert.equal(parsed2.customDest, "/tmp/custom-skill");
});
