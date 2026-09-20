import TurndownService from "turndown";
import * as gfm from "turndown-plugin-gfm";
import { taskSpace, type AnyTaskSpace } from "../browser/task-space.js";
import type { JevNavigateOptions, JevNavigateResult, JevStepRecord } from "../browser/types.js";
import { buildCriteria, compileActionSpace, heuristicQuery, pickAlternate, PRICE_PER_MTOK_IN } from "./compiler.js";
import { askJev } from "./provider.js";
import { stepQuestions } from "./questions.js";
import { normalizeHosts, publicUrl, safeError, validateStepAnswers } from "./security.js";

const turndown = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced" });
turndown.use(gfm.gfm);

export async function jevNavigate(
  task: string,
  startUrl: string,
  options: JevNavigateOptions = {},
  existingTaskSpace?: AnyTaskSpace,
): Promise<JevNavigateResult> {
  const started = performance.now();
  const maxSteps = options.maxSteps ?? 24;
  const maxSeconds = options.maxSeconds ?? 180;
  const deadlineAt = started + maxSeconds * 1000;
  const allowTyping = options.allowTyping ?? false;

  const usage = {
    jev_calls: 0,
    input_tokens: 0,
    output_tokens: 0,
    est_cost_usd: 0,
  };

  const steps: JevStepRecord[] = [];
  let status: JevNavigateResult["status"] = "error";
  let finalUrl = startUrl;
  let finalTitle = "";
  let finalContent = "";
  let screenshotBase64: string | null = null;
  let providerName: string | null = null;
  let modelName = process.env.JEV_BROWSER_MODEL ?? "typesafe-ai/jev";

  let ts: AnyTaskSpace | null = null;
  let shouldCloseTask = false;

  try {
    const validUrl = publicUrl(startUrl);
    const allowedHosts = normalizeHosts(options.allowedHosts ?? [validUrl.hostname]);
    if (!allowedHosts.has(validUrl.hostname)) {
      throw new Error("startUrl must be within allowedHosts");
    }

    if (existingTaskSpace) {
      ts = existingTaskSpace;
    } else {
      ts = await taskSpace(`jev-task-${Date.now()}`);
      shouldCloseTask = true;
    }

    const page = ts.page("p1");
    await page.goto(startUrl, { timeout: 30_000 });

    let lastExecuted: string | null = null;
    let lastOutcome: string | null = null;
    const history: Array<{ step: number; action: string; outcome: string }> = [];

    for (let step = 1; step <= maxSteps; step++) {
      if (performance.now() >= deadlineAt) {
        status = "timeout";
        break;
      }

      finalUrl = await page.url().catch(() => finalUrl);
      finalTitle = await page.title().catch(() => finalTitle);

      const snapshotResult = await page.snapshot({ includeActionMarks: true, interactiveOnly: true });
      const { elements, truncated } = compileActionSpace(snapshotResult.refs.filter((r) => allowTyping || !r.typeable));

      const pageExcerpt = snapshotResult.content.slice(0, 2000);
      const state = {
        task,
        current_page: { url: finalUrl, title: finalTitle },
        page_text_excerpt: pageExcerpt,
        interactive_elements: elements.map((e) => ({ id: e.id, description: e.description })),
        element_list_truncated: truncated,
        history,
      };

      const criteria = buildCriteria(elements);
      const rawAnswers = await askJev(state, stepQuestions(criteria), modelName);
      providerName = rawAnswers.provider;
      modelName = rawAnswers.model;
      usage.jev_calls += 1;
      usage.input_tokens += rawAnswers.usage.input_tokens;
      usage.output_tokens += rawAnswers.usage.output_tokens;
      usage.est_cost_usd = (usage.input_tokens / 1e6) * PRICE_PER_MTOK_IN;

      const answers = validateStepAnswers(rawAnswers.answers, criteria);
      const actionAnswer = answers.action;
      const proposed: string = actionAnswer.choice;
      const probabilities: Record<string, number> = actionAnswer.probabilities ?? {};

      const stepRecord: JevStepRecord = {
        step,
        t_ms: Math.round(performance.now() - started),
        proposed_action: proposed,
        executed_action: null,
        detail: proposed,
        outcome: "pending",
        confidence: actionAnswer.confidence ?? null,
        top_probability: probabilities[proposed] ?? null,
        goal_done: answers.goal_done.noul,
        stuck: answers.stuck.noul,
      };

      // Pre-action stop gates
      if (proposed === "done") {
        stepRecord.outcome = "Agent declared done";
        steps.push(stepRecord);
        status = "done";
        break;
      }
      if (answers.goal_done.noul > 0.85) {
        stepRecord.outcome = "Goal watcher fired before action";
        steps.push(stepRecord);
        status = "goal_achieved";
        break;
      }
      if (answers.stuck.noul > 0.85 && step > 2) {
        stepRecord.outcome = "Stuck watcher fired";
        steps.push(stepRecord);
        status = "stuck";
        break;
      }

      // Repeat-no-op recovery
      let chosen = proposed;
      if (lastExecuted === proposed && lastOutcome === "no visible change") {
        const alternate = pickAlternate(probabilities, new Set([proposed]));
        if (alternate) {
          chosen = alternate;
          stepRecord.detail = `switched to alternate: ${chosen}`;
        }
      }

      stepRecord.executed_action = chosen;
      const targetElement = elements.find((e) => chosen === `${e.kind}_${e.id}`);

      try {
        if (chosen === "back") {
          await page.evaluate(() => window.history.back()).catch(() => {});
          stepRecord.outcome = "went back";
        } else if (chosen === "scroll_down") {
          await page.mouse.wheel(0, 600);
          stepRecord.outcome = "scrolled down";
        } else if (chosen === "scroll_up") {
          await page.mouse.wheel(0, -600);
          stepRecord.outcome = "scrolled up";
        } else if (targetElement) {
          if (chosen.startsWith("click_")) {
            await page.click(targetElement.ref);
            stepRecord.outcome = `clicked ${targetElement.description}`;
          } else if (chosen.startsWith("type_")) {
            if (!allowTyping) {
              stepRecord.outcome = "typing blocked by policy";
            } else {
              const textToType = heuristicQuery(task);
              await page.fill(targetElement.ref, textToType);
              stepRecord.outcome = `filled "${textToType}" into ${targetElement.ref}`;
            }
          } else if (chosen.startsWith("select_")) {
            const opts = targetElement.options ?? [];
            if (opts.length > 0) {
              await page.selectOption(targetElement.ref, { label: opts[0] });
              stepRecord.outcome = `selected ${opts[0]}`;
            }
          }
        } else {
          stepRecord.outcome = `unrecognized action: ${chosen}`;
        }
      } catch (err) {
        stepRecord.outcome = `action failed: ${safeError(err)}`;
      }

      lastExecuted = chosen;
      lastOutcome = stepRecord.outcome;
      history.push({ step, action: chosen, outcome: stepRecord.outcome });
      steps.push(stepRecord);

      if (step === maxSteps) {
        status = "max_steps";
      }
    }

    // Extract final payload
    try {
      if (options.format === "markdown") {
        const rawHtml = await (page as any).evaluate?.(() => document.body?.innerHTML ?? "").catch(() => "");
        finalContent = turndown.turndown(rawHtml || "");
      } else {
        const snap = await page.snapshot();
        finalContent = snap.content;
      }
    } catch {
      finalContent = "Failed to extract final page content";
    }

    // Final screenshot if requested
    if (options.screenshot !== "none" && (page as any).screenshot) {
      try {
        const buf = await (page as any).screenshot({ type: "jpeg" });
        screenshotBase64 = buf.toString("base64");
      } catch {}
    }

    return {
      status: ["done", "goal_achieved"].includes(status) ? status : (status === "error" ? "done" : status),
      final_url: finalUrl,
      final_title: finalTitle,
      steps,
      page: {
        truncated: finalContent.length > (options.maxChars ?? 16000),
        true_length: finalContent.length,
        content: finalContent.slice(0, options.maxChars ?? 16000),
      },
      extracted_content: finalContent.slice(0, options.maxChars ?? 16000),
      screenshot_base64_jpeg: screenshotBase64,
      usage,
      elapsed_ms: Math.round(performance.now() - started),
      model: modelName,
      jev_provider: providerName,
    };
  } catch (error) {
    return {
      status: "error",
      error: safeError(error),
      steps,
      usage,
      elapsed_ms: Math.round(performance.now() - started),
      model: modelName,
      jev_provider: providerName,
    };
  } finally {
    if (shouldCloseTask && ts) {
      await ts.finish().catch(() => {});
    }
  }
}
