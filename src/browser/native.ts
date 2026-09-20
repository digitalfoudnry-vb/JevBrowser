import { parseSnapshot } from "./snapshot-parser.js";
import type { BrowserProfile, PageActionReceipt, PageClickOptions, PageFillOptions, PageGotoOptions, PageSnapshotOptions, SnapshotResult, TaskSpaceInfo } from "./types.js";

function getNativeBridge(): any {
  return (globalThis as any).jevBrowser || (globalThis as any).browserNative;
}

export class NativePage {
  readonly label: string;
  readonly spaceId: number;
  #targetId?: string;

  readonly mouse: {
    click: (x: number, y: number) => Promise<void>;
    wheel: (dx: number, dy: number) => Promise<void>;
  };
  readonly keyboard: {
    type: (text: string) => Promise<void>;
    press: (key: string) => Promise<void>;
  };

  constructor(spaceId: number, label: string = "p1", targetId?: string) {
    this.spaceId = spaceId;
    this.label = label;
    this.#targetId = targetId;

    this.mouse = {
      click: async (x: number, y: number) => {
        const bridge = getNativeBridge();
        if (!bridge) return;
        bridge.useTaskSpace(this.spaceId);
        await bridge.animationHighlightMouseToPosition?.(x, y);
      },
      wheel: async (_dx: number, _dy: number) => {
        const bridge = getNativeBridge();
        if (!bridge) return;
        bridge.useTaskSpace(this.spaceId);
      },
    };

    this.keyboard = {
      type: async (_text: string) => {},
      press: async (_key: string) => {},
    };
  }

  async url(): Promise<string> {
    const bridge = getNativeBridge();
    if (!bridge) throw new Error("Jev Browser native bindings unavailable");
    bridge.useTaskSpace(this.spaceId);
    const tabs = await bridge.listTabs();
    return tabs?.tabs?.[0]?.url ?? "";
  }

  async title(): Promise<string> {
    const bridge = getNativeBridge();
    if (!bridge) throw new Error("Jev Browser native bindings unavailable");
    bridge.useTaskSpace(this.spaceId);
    const tabs = await bridge.listTabs();
    return tabs?.tabs?.[0]?.title ?? "";
  }

  async goto(url: string, _options: PageGotoOptions = {}): Promise<PageActionReceipt> {
    const bridge = getNativeBridge();
    if (!bridge) throw new Error("Jev Browser native bindings unavailable");
    bridge.useTaskSpace(this.spaceId);
    if (!this.#targetId) {
      const tab = await bridge.createTab(url);
      this.#targetId = tab?.targetId;
    } else {
      await new Promise<void>((resolve) => {
        const id = Math.floor(Math.random() * 100000);
        const onMsg = (msg: string) => {
          try {
            const data = JSON.parse(msg);
            if (data.id === id) {
              bridge.onCDPMessage = null;
              resolve();
            }
          } catch {}
        };
        bridge.onCDPMessage = onMsg;
        bridge.sendCDPMessage(JSON.stringify({ id, method: "Page.navigate", params: { url } }));
        setTimeout(() => { bridge.onCDPMessage = null; resolve(); }, 15000);
      });
    }
    return { popups: [] };
  }

  async snapshot(options: PageSnapshotOptions = {}): Promise<SnapshotResult> {
    const bridge = getNativeBridge();
    if (!bridge) throw new Error("Jev Browser native bindings unavailable");
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

  async click(_ref: string, _options: PageClickOptions = {}): Promise<PageActionReceipt> {
    const bridge = getNativeBridge();
    if (!bridge) throw new Error("Jev Browser native bindings unavailable");
    bridge.useTaskSpace(this.spaceId);
    return { popups: [] };
  }

  async fill(_ref: string, _text: string, _options: PageFillOptions = {}): Promise<PageActionReceipt> {
    const bridge = getNativeBridge();
    if (!bridge) throw new Error("Jev Browser native bindings unavailable");
    bridge.useTaskSpace(this.spaceId);
    return { popups: [] };
  }

  async selectOption(_ref: string, _option: { label?: string; value?: string }): Promise<PageActionReceipt> {
    const bridge = getNativeBridge();
    if (!bridge) throw new Error("Jev Browser native bindings unavailable");
    bridge.useTaskSpace(this.spaceId);
    return { popups: [] };
  }

  async evaluate<T = any>(fnOrString: any, _arg?: any): Promise<T> {
    const bridge = getNativeBridge();
    if (!bridge) throw new Error("Jev Browser native bindings unavailable");
    bridge.useTaskSpace(this.spaceId);
    if (typeof fnOrString === "function") {
      return fnOrString();
    }
    return undefined as any;
  }

  async close(): Promise<void> {
    const bridge = getNativeBridge();
    if (!bridge) return;
    bridge.useTaskSpace(this.spaceId);
    await bridge.closeTaskSpace().catch(() => {});
  }
}

export class NativeTaskSpace {
  readonly spaceId: number;
  readonly name: string;
  readonly ownership: "agent" = "agent";
  readonly #page: NativePage;

  constructor(spaceId: number, name: string) {
    this.spaceId = spaceId;
    this.name = name;
    this.#page = new NativePage(spaceId, "p1");
  }

  page(_label: string = "p1"): NativePage {
    return this.#page;
  }

  async finish(_options: { keep?: string[] } = {}): Promise<void> {
    const bridge = getNativeBridge();
    if (!bridge) return;
    bridge.useTaskSpace(this.spaceId);
    await bridge.closeTaskSpace().catch(() => {});
  }
}

export function isNativeBrowserAvailable(): boolean {
  const bridge = getNativeBridge();
  return Boolean(bridge && typeof bridge.createTaskSpace === "function");
}

export async function listNativeProfiles(): Promise<BrowserProfile[]> {
  if (!isNativeBrowserAvailable()) return [];
  const bridge = getNativeBridge();
  const result = await bridge.listProfiles();
  return result?.profiles ?? [];
}

export async function listNativeTaskSpaces(): Promise<TaskSpaceInfo[]> {
  if (!isNativeBrowserAvailable()) return [];
  const bridge = getNativeBridge();
  const result = await bridge.listTaskSpaces();
  return (result?.taskSpaces ?? []).map((s: any) => ({
    id: s.id,
    taskId: s.taskId ?? s.name,
    name: s.name,
    ownership: s.ownership ?? "agent",
    profileId: s.profileId,
    profileName: s.profileName,
    recentTabTitles: s.recentTabTitles,
  }));
}

export async function createNativeTaskSpace(name: string, profileId?: string): Promise<NativeTaskSpace> {
  if (!isNativeBrowserAvailable()) throw new Error("Jev Browser native environment is not running");
  const bridge = getNativeBridge();
  const task = await bridge.createTaskSpace(name, profileId);
  if (task.error) throw new Error(`${task.error} (${task.error_code})`);
  bridge.useTaskSpace(task.id);
  return new NativeTaskSpace(task.id, name);
}
