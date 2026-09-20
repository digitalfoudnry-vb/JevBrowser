import { type Browser, type BrowserContext, type Page as PlaywrightPage } from "playwright";
import type { PageActionReceipt, PageClickOptions, PageFillOptions, PageGotoOptions, PageSnapshotOptions, SnapshotResult } from "./types.js";
export declare class StandalonePage {
    #private;
    readonly label: string;
    readonly spaceId: number;
    readonly mouse: {
        click: (x: number, y: number) => Promise<void>;
        wheel: (dx: number, dy: number) => Promise<void>;
    };
    readonly keyboard: {
        type: (text: string) => Promise<void>;
        press: (key: string) => Promise<void>;
    };
    constructor(pwPage: PlaywrightPage, label: string, spaceId: number);
    get underlying(): PlaywrightPage;
    url(): Promise<string>;
    title(): Promise<string>;
    goto(url: string, options?: PageGotoOptions): Promise<PageActionReceipt>;
    reload(): Promise<PageActionReceipt>;
    snapshot(_options?: PageSnapshotOptions): Promise<SnapshotResult>;
    click(selectorOrRef: string, options?: PageClickOptions): Promise<PageActionReceipt>;
    fill(selectorOrRef: string, text: string, options?: PageFillOptions): Promise<PageActionReceipt>;
    selectOption(selectorOrRef: string, option: {
        label?: string;
        value?: string;
    }): Promise<PageActionReceipt>;
    evaluate<T = any>(fnOrString: any, arg?: any): Promise<T>;
    screenshot(options?: {
        path?: string;
        type?: "png" | "jpeg";
    }): Promise<Buffer>;
    close(): Promise<void>;
}
export declare class StandaloneTaskSpace {
    #private;
    readonly spaceId: number;
    readonly name: string;
    readonly ownership: "agent";
    constructor(spaceId: number, name: string, context: BrowserContext, browser: Browser);
    page(label?: string): StandalonePage;
    pages(): Promise<StandalonePage[]>;
    newPage(): Promise<StandalonePage>;
    finish(_options?: {
        keep?: string[];
    }): Promise<void>;
}
export declare function createStandaloneTaskSpace(name: string): Promise<StandaloneTaskSpace>;
