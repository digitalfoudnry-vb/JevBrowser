import { taskSpace } from "../dist/browser/task-space.js";

async function main() {
  console.log("===================================================================");
  console.log("             JEV BROWSER AUTONOMOUS AUTOMATION DEMO                ");
  console.log("                  Created by digitalfoundry.ai                     ");
  console.log("===================================================================");

  console.log("\n[1] Creating Isolated Jev Task Space...");
  const task = await taskSpace("Autonomous Lead & Feature Extraction");
  console.log(`✓ Space initialized: "${task.name}" (ID: ${task.spaceId})`);

  const page = task.page("p1");
  console.log("\n[2] Navigating to target URL: http://localhost:8000...");
  await page.goto("http://localhost:8000", { waitUntil: "domcontentloaded" });

  const title = await page.title();
  console.log(`✓ Page loaded successfully: "${title}"`);

  console.log("\n[3] Compiling AST Snapshot via Jev Engine...");
  const snapshot = await page.snapshot();
  console.log(`✓ Jev AST compiler extracted ${snapshot.refs.length} interactive elements with @ref tags:`);
  for (const item of snapshot.refs.slice(0, 8)) {
    console.log(`   [${item.ref}] ${item.role.padEnd(8)} "${item.name}"`);
  }

  console.log("\n[4] Performing In-Page Automation: Switching to Parallel Spaces...");
  await page.underlying.click("#tab-space-agent1");
  await page.underlying.waitForTimeout(400);

  const status = await page.underlying.textContent("#space-pane-status");
  const meta = await page.underlying.textContent("#space-pane-meta");
  console.log(`✓ Interacted with Space #1:`);
  console.log(`   Status: "${status}"`);
  console.log(`   Meta:   "${meta}"`);

  console.log("\n[5] Capturing Verification Screenshot...");
  const screenshotPath = "/tmp/jev-browser-live-automation.png";
  await page.screenshot({ path: screenshotPath, type: "png" });
  console.log(`✓ High-resolution screenshot captured at: ${screenshotPath}`);

  console.log("\n[6] Gracefully Closing Task Space...");
  await task.finish();
  console.log("✓ Task space closed. Browsing session isolated and complete!");
  console.log("===================================================================");
}

main().catch(err => {
  console.error("Error running Jev Browser automation:", err);
  process.exit(1);
});
