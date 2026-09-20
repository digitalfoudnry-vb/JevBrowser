import { parseSnapshot } from "./snapshot-parser.js";
function getNativeBridge() {
    return globalThis.jevBrowser || globalThis.browserNative;
}
export class NativePage {
    label;
    spaceId;
    #targetId;
    mouse;
    keyboard;
    constructor(spaceId, label = "p1", targetId) {
        this.spaceId = spaceId;
        this.label = label;
        this.#targetId = targetId;
        this.mouse = {
            click: async (x, y) => {
                const bridge = getNativeBridge();
                if (!bridge)
                    return;
                bridge.useTaskSpace(this.spaceId);
                await bridge.animationHighlightMouseToPosition?.(x, y);
            },
            wheel: async (_dx, _dy) => {
                const bridge = getNativeBridge();
                if (!bridge)
                    return;
                bridge.useTaskSpace(this.spaceId);
            },
        };
        this.keyboard = {
            type: async (_text) => { },
            press: async (_key) => { },
        };
    }
    async url() {
        const bridge = getNativeBridge();
        if (!bridge)
            throw new Error("Jev Browser native bindings unavailable");
        bridge.useTaskSpace(this.spaceId);
        const tabs = await bridge.listTabs();
        return tabs?.tabs?.[0]?.url ?? "";
    }
    async title() {
        const bridge = getNativeBridge();
        if (!bridge)
            throw new Error("Jev Browser native bindings unavailable");
        bridge.useTaskSpace(this.spaceId);
        const tabs = await bridge.listTabs();
        return tabs?.tabs?.[0]?.title ?? "";
    }
    async goto(url, _options = {}) {
        const bridge = getNativeBridge();
        if (!bridge)
            throw new Error("Jev Browser native bindings unavailable");
        bridge.useTaskSpace(this.spaceId);
        if (!this.#targetId) {
            const tab = await bridge.createTab(url);
            this.#targetId = tab?.targetId;
        }
        else {
            await new Promise((resolve) => {
                const id = Math.floor(Math.random() * 100000);
                const onMsg = (msg) => {
                    try {
                        const data = JSON.parse(msg);
                        if (data.id === id) {
                            bridge.onCDPMessage = null;
                            resolve();
                        }
                    }
                    catch { }
                };
                bridge.onCDPMessage = onMsg;
                bridge.sendCDPMessage(JSON.stringify({ id, method: "Page.navigate", params: { url } }));
                setTimeout(() => { bridge.onCDPMessage = null; resolve(); }, 15000);
            });
        }
        return { popups: [] };
    }
    async snapshot(options = {}) {
        const bridge = getNativeBridge();
        if (!bridge)
            throw new Error("Jev Browser native bindings unavailable");
        bridge.useTaskSpace(this.spaceId);
        const snap = await bridge.snapshot({
            scope: options.scope ?? "full_page",
            includeActionMarks: true,
            interactiveOnly: options.interactiveOnly ?? true,
            includeStableLocator: true,
            maxResultLength: options.maxResultLength,
        });
        const content = typeof snap === "string" ? snap : snap?.content ?? "";
        const refs = parseSnapshot(content);
        return { content, refs };
    }
    async click(_ref, _options = {}) {
        const bridge = getNativeBridge();
        if (!bridge)
            throw new Error("Jev Browser native bindings unavailable");
        bridge.useTaskSpace(this.spaceId);
        return { popups: [] };
    }
    async fill(_ref, _text, _options = {}) {
        const bridge = getNativeBridge();
        if (!bridge)
            throw new Error("Jev Browser native bindings unavailable");
        bridge.useTaskSpace(this.spaceId);
        return { popups: [] };
    }
    async selectOption(_ref, _option) {
        const bridge = getNativeBridge();
        if (!bridge)
            throw new Error("Jev Browser native bindings unavailable");
        bridge.useTaskSpace(this.spaceId);
        return { popups: [] };
    }
    async evaluate(fnOrString, _arg) {
        const bridge = getNativeBridge();
        if (!bridge)
            throw new Error("Jev Browser native bindings unavailable");
        bridge.useTaskSpace(this.spaceId);
        if (typeof fnOrString === "function") {
            return fnOrString();
        }
        return undefined;
    }
    async close() {
        const bridge = getNativeBridge();
        if (!bridge)
            return;
        bridge.useTaskSpace(this.spaceId);
        await bridge.closeTaskSpace().catch(() => { });
    }
}
export class NativeTaskSpace {
    spaceId;
    name;
    ownership = "agent";
    #page;
    constructor(spaceId, name) {
        this.spaceId = spaceId;
        this.name = name;
        this.#page = new NativePage(spaceId, "p1");
    }
    page(_label = "p1") {
        return this.#page;
    }
    async finish(_options = {}) {
        const bridge = getNativeBridge();
        if (!bridge)
            return;
        bridge.useTaskSpace(this.spaceId);
        await bridge.closeTaskSpace().catch(() => { });
    }
}
export function isNativeBrowserAvailable() {
    const bridge = getNativeBridge();
    return Boolean(bridge && typeof bridge.createTaskSpace === "function");
}
export async function listNativeProfiles() {
    if (!isNativeBrowserAvailable())
        return [];
    const bridge = getNativeBridge();
    const result = await bridge.listProfiles();
    return result?.profiles ?? [];
}
export async function listNativeTaskSpaces() {
    if (!isNativeBrowserAvailable())
        return [];
    const bridge = getNativeBridge();
    const result = await bridge.listTaskSpaces();
    return (result?.taskSpaces ?? []).map((s) => ({
        id: s.id,
        taskId: s.taskId ?? s.name,
        name: s.name,
        ownership: s.ownership ?? "agent",
        profileId: s.profileId,
        profileName: s.profileName,
        recentTabTitles: s.recentTabTitles,
    }));
}
export async function createNativeTaskSpace(name, profileId) {
    if (!isNativeBrowserAvailable())
        throw new Error("Jev Browser native environment is not running");
    const bridge = getNativeBridge();
    const task = await bridge.createTaskSpace(name, profileId);
    if (task.error)
        throw new Error(`${task.error} (${task.error_code})`);
    bridge.useTaskSpace(task.id);
    return new NativeTaskSpace(task.id, name);
}
//# sourceMappingURL=native.js.map