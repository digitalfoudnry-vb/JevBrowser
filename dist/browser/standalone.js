import { chromium } from "playwright";
import { generateStandaloneSnapshot } from "./snapshot-parser.js";
export class StandalonePage {
    label;
    #pwPage;
    spaceId;
    mouse;
    keyboard;
    constructor(pwPage, label, spaceId) {
        this.label = label;
        this.#pwPage = pwPage;
        this.spaceId = spaceId;
        this.mouse = {
            click: async (x, y) => {
                await this.#pwPage.mouse.click(x, y);
            },
            wheel: async (dx, dy) => {
                await this.#pwPage.mouse.wheel(dx, dy);
            },
        };
        this.keyboard = {
            type: async (text) => {
                await this.#pwPage.keyboard.type(text);
            },
            press: async (key) => {
                await this.#pwPage.keyboard.press(key);
            },
        };
    }
    get underlying() {
        return this.#pwPage;
    }
    async url() {
        return this.#pwPage.url();
    }
    async title() {
        return this.#pwPage.title();
    }
    async goto(url, options = {}) {
        await this.#pwPage.goto(url, {
            waitUntil: options.waitUntil ?? "domcontentloaded",
            timeout: options.timeout ?? 30_000,
            referer: options.referer,
        });
        return { popups: [] };
    }
    async reload() {
        await this.#pwPage.reload({ waitUntil: "domcontentloaded" });
        return { popups: [] };
    }
    async snapshot(_options = {}) {
        return generateStandaloneSnapshot(this.#pwPage);
    }
    async click(selectorOrRef, options = {}) {
        const selector = selectorOrRef.startsWith("@")
            ? `[data-jev-ref="${selectorOrRef}"], [data-ref="${selectorOrRef}"]`
            : selectorOrRef;
        await this.#pwPage.click(selector, { timeout: options.timeout ?? 8_000 });
        return { popups: [] };
    }
    async fill(selectorOrRef, text, options = {}) {
        const selector = selectorOrRef.startsWith("@")
            ? `[data-jev-ref="${selectorOrRef}"], [data-ref="${selectorOrRef}"]`
            : selectorOrRef;
        await this.#pwPage.fill(selector, text, { timeout: options.timeout ?? 8_000 });
        return { popups: [] };
    }
    async selectOption(selectorOrRef, option) {
        const selector = selectorOrRef.startsWith("@")
            ? `[data-jev-ref="${selectorOrRef}"], [data-ref="${selectorOrRef}"]`
            : selectorOrRef;
        await this.#pwPage.selectOption(selector, option);
        return { popups: [] };
    }
    async evaluate(fnOrString, arg) {
        return this.#pwPage.evaluate(fnOrString, arg);
    }
    async screenshot(options = {}) {
        return this.#pwPage.screenshot({
            path: options.path,
            type: options.type ?? "jpeg",
            quality: options.type === "png" ? undefined : 75,
        });
    }
    async close() {
        await this.#pwPage.close();
    }
}
export class StandaloneTaskSpace {
    spaceId;
    name;
    ownership = "agent";
    #context;
    #browser;
    #pages = new Map();
    #pageCounter = 1;
    constructor(spaceId, name, context, browser) {
        this.spaceId = spaceId;
        this.name = name;
        this.#context = context;
        this.#browser = browser;
    }
    page(label = "p1") {
        const p = this.#pages.get(label);
        if (!p)
            throw new Error(`Page ${label} not found in task space ${this.name}`);
        return p;
    }
    async pages() {
        return Array.from(this.#pages.values());
    }
    async newPage() {
        const pwPage = await this.#context.newPage();
        const label = `p${this.#pageCounter++}`;
        const page = new StandalonePage(pwPage, label, this.spaceId);
        this.#pages.set(label, page);
        return page;
    }
    async finish(_options = {}) {
        await this.#context.close().catch(() => { });
        await this.#browser.close().catch(() => { });
    }
}
let spaceIdCounter = 1;
export async function createStandaloneTaskSpace(name) {
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
//# sourceMappingURL=standalone.js.map