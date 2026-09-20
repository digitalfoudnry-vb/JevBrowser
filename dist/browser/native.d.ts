import type { BrowserProfile, PageActionReceipt, PageClickOptions, PageFillOptions, PageGotoOptions, PageSnapshotOptions, SnapshotResult, TaskSpaceInfo } from "./types.js";
export declare class NativePage {
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
    constructor(spaceId: number, label?: string, targetId?: string);
    url(): Promise<string>;
    title(): Promise<string>;
    goto(url: string, _options?: PageGotoOptions): Promise<PageActionReceipt>;
    snapshot(options?: PageSnapshotOptions): Promise<SnapshotResult>;
    click(_ref: string, _options?: PageClickOptions): Promise<PageActionReceipt>;
    fill(_ref: string, _text: string, _options?: PageFillOptions): Promise<PageActionReceipt>;
    selectOption(_ref: string, _option: {
        label?: string;
        value?: string;
    }): Promise<PageActionReceipt>;
    evaluate<T = any>(fnOrString: any, _arg?: any): Promise<T>;
    close(): Promise<void>;
}
export declare class NativeTaskSpace {
    #private;
    readonly spaceId: number;
    readonly name: string;
    readonly ownership: "agent";
    constructor(spaceId: number, name: string);
    page(_label?: string): NativePage;
    finish(_options?: {
        keep?: string[];
    }): Promise<void>;
}
export declare function isNativeBrowserAvailable(): boolean;
export declare function listNativeProfiles(): Promise<BrowserProfile[]>;
export declare function listNativeTaskSpaces(): Promise<TaskSpaceInfo[]>;
export declare function createNativeTaskSpace(name: string, profileId?: string): Promise<NativeTaskSpace>;
