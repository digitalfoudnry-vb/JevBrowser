#!/usr/bin/env node
import * as fs from "node:fs/promises";
import * as path from "node:path";

async function validate() {
  const projectRoot = path.resolve(import.meta.dirname, "..");
  const skillFile = path.join(projectRoot, "skills", "jev-browser", "SKILL.md");
  const binFile = path.join(projectRoot, "dist", "index.js");
  const pkgFile = path.join(projectRoot, "package.json");

  console.log("Validating JevBrowser skill package...");

  // 1. Check SKILL.md
  const skillContent = await fs.readFile(skillFile, "utf8");
  if (!skillContent.startsWith("---")) {
    throw new Error("SKILL.md missing frontmatter start '---'");
  }
  const fmEnd = skillContent.indexOf("---", 3);
  if (fmEnd === -1) {
    throw new Error("SKILL.md missing frontmatter closing '---'");
  }
  const fm = skillContent.slice(3, fmEnd);
  if (!/name:\s*jev-browser/.test(fm)) {
    throw new Error("SKILL.md missing 'name: jev-browser'");
  }
  if (!/description:/.test(fm)) {
    throw new Error("SKILL.md missing 'description'");
  }
  console.log("✔ SKILL.md frontmatter valid");

  // 2. Check binary
  await fs.access(binFile);
  console.log("✔ Compiled binary dist/index.js exists");

  // 3. Check package.json
  const pkg = JSON.parse(await fs.readFile(pkgFile, "utf8"));
  if (pkg.bin["jev-browser"] !== "./dist/index.js") {
    throw new Error("package.json bin.jev-browser mismatch");
  }
  console.log("✔ package.json bin configuration valid");

  console.log("🎉 All validation checks passed!");
}

validate().catch((err) => {
  console.error("Validation failed:", err.message);
  process.exit(1);
});
