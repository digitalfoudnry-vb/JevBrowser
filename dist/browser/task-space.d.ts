import { NativeTaskSpace } from "./native.js";
import { StandaloneTaskSpace } from "./standalone.js";
import type { BrowserProfile, TaskSpaceInfo } from "./types.js";
export type AnyTaskSpace = NativeTaskSpace | StandaloneTaskSpace;
export declare function taskSpace(name: string, options?: {
    profileId?: string;
}): Promise<AnyTaskSpace>;
export declare function profiles(): Promise<BrowserProfile[]>;
export declare function listTaskSpaces(): Promise<TaskSpaceInfo[]>;
