import { chromium, type Browser, type BrowserContext, type Page as PlaywrightPage } from "playwright";
import { generateStandaloneSnapshot } from "./snapshot-parser.js";
import type { PageActionReceipt, PageClickOptions, PageFillOptions, PageGotoOptions, PageSnapshotOptions, SnapshotResult } from "./types.js";

export class StandalonePage {
  readonly label: string;
  readonly #pwPage: PlaywrightPage;
  readonly spaceId: number;
  readonly mouse: {
    click: (x: number, y: number) => Promise<void>;
    wheel: (dx: number, dy: number) => Promise<void>;
  };
  readonly keyboard: {
    type: (text: string) => Promise<void>;
    press: (key: string) => Promise<void>;
  };

  constructor(pwPage: PlaywrightPage, label: string, spaceId: number) {
    this.label = label;
    this.#pwPage = pwPage;
    this.spaceId = spaceId;

    this.mouse = {
      click: async (x: number, y: number) => {
        await this.#pwPage.mouse.click(x, y);
      },
      wheel: async (dx: number, dy: number) => {
        await this.#pwPage.mouse.wheel(dx, dy);
      },
    };

    this.keyboard = {
      type: async (text: string) => {
        await this.#pwPage.keyboard.type(text);
      },
      press: async (key: string) => {
        await this.#pwPage.keyboard.press(key);
      },
    };
  }

  get underlying(): PlaywrightPage {
    return this.#pwPage;
  }

  async url(): Promise<string> {
    return this.#pwPage.url();
  }

  async title(): Promise<string> {
    return this.#pwPage.title();
  }

  async goto(url: string, options: PageGotoOptions = {}): Promise<PageActionReceipt> {
    await this.#pwPage.goto(url, {
      waitUntil: options.waitUntil ?? "domcontentloaded",
      timeout: options.timeout ?? 30_000,
      referer: options.referer,
    });
    return { popups: [] };
  }

  async setContent(html: string): Promise<void> {
    await this.#pwPage.setContent(html);
  }

  async reload(): Promise<PageActionReceipt> {
    await this.#pwPage.reload({ waitUntil: "domcontentloaded" });
    return { popups: [] };
  }

  async snapshot(_options: PageSnapshotOptions = {}): Promise<SnapshotResult> {
    return generateStandaloneSnapshot(this.#pwPage);
  }

  async click(selectorOrRef: string, options: PageClickOptions = {}): Promise<PageActionReceipt> {
    const selector = selectorOrRef.startsWith("@")
      ? `[data-jev-ref="${selectorOrRef}"], [data-ref="${selectorOrRef}"]`
      : selectorOrRef;
    await this.#pwPage.click(selector, { timeout: options.timeout ?? 8_000 });
    return { popups: [] };
  }

  async fill(selectorOrRef: string, text: string, options: PageFillOptions = {}): Promise<PageActionReceipt> {
    const selector = selectorOrRef.startsWith("@")
      ? `[data-jev-ref="${selectorOrRef}"], [data-ref="${selectorOrRef}"]`
      : selectorOrRef;
    await this.#pwPage.fill(selector, text, { timeout: options.timeout ?? 8_000 });
    return { popups: [] };
  }

  async selectOption(selectorOrRef: string, option: { label?: string; value?: string }): Promise<PageActionReceipt> {
    const selector = selectorOrRef.startsWith("@")
      ? `[data-jev-ref="${selectorOrRef}"], [data-ref="${selectorOrRef}"]`
      : selectorOrRef;
    await this.#pwPage.selectOption(selector, option);
    return { popups: [] };
  }

  async evaluate<T = any>(fnOrString: any, arg?: any): Promise<T> {
    return this.#pwPage.evaluate(fnOrString, arg);
  }

  async screenshot(options: { path?: string; type?: "png" | "jpeg" } = {}): Promise<Buffer> {
    return this.#pwPage.screenshot({
      path: options.path,
      type: options.type ?? "jpeg",
      quality: options.type === "png" ? undefined : 75,
    });
  }

  async close(): Promise<void> {
    await this.#pwPage.close();
  }
}

export class StandaloneTaskSpace {
  readonly spaceId: number;
  readonly name: string;
  readonly ownership: "agent" = "agent";
  readonly #context: BrowserContext;
  readonly #browser: Browser;
  readonly #pages = new Map<string, StandalonePage>();
  #pageCounter = 1;

  constructor(spaceId: number, name: string, context: BrowserContext, browser: Browser) {
    this.spaceId = spaceId;
    this.name = name;
    this.#context = context;
    this.#browser = browser;
  }

  get id(): string {
    return this.name;
  }

  async close(): Promise<void> {
    return this.finish();
  }

  page(label: string = "p1"): StandalonePage {
    const p = this.#pages.get(label);
    if (!p) throw new Error(`Page ${label} not found in task space ${this.name}`);
    return p;
  }

  async pages(): Promise<StandalonePage[]> {
    return Array.from(this.#pages.values());
  }

  async newPage(): Promise<StandalonePage> {
    const pwPage = await this.#context.newPage();
    const label = `p${this.#pageCounter++}`;
    const page = new StandalonePage(pwPage, label, this.spaceId);
    this.#pages.set(label, page);
    return page;
  }

  async finish(_options: { keep?: string[] } = {}): Promise<void> {
    await this.#context.close().catch(() => {});
    await this.#browser.close().catch(() => {});
  }
}

let spaceIdCounter = 1;
export async function createStandaloneTaskSpace(name: string): Promise<StandaloneTaskSpace> {
  const browser = await chromium.launch({
    headless: process.env.JEV_BROWSER_HEADED !== "1",
    args: ["--disable-quic", "--force-webrtc-ip-handling-policy=disable_non_proxied_udp"],
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    serviceWorkers: "block",
  });
  const spaceId = spaceIdCounter++;
  const taskSpace = new StandaloneTaskSpace(spaceId, name, context, browser);
  // Create default p1 page
  await taskSpace.newPage();
  return taskSpace;
}
