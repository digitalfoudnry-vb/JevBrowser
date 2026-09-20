import { createNativeTaskSpace, isNativeBrowserAvailable, listNativeProfiles, listNativeTaskSpaces, NativeTaskSpace } from "./native.js";
import { createStandaloneTaskSpace, StandaloneTaskSpace } from "./standalone.js";
import type { BrowserProfile, TaskSpaceInfo } from "./types.js";

export type AnyTaskSpace = NativeTaskSpace | StandaloneTaskSpace;

export async function taskSpace(name: string, options: { profileId?: string } = {}): Promise<AnyTaskSpace> {
  if (isNativeBrowserAvailable()) {
    return createNativeTaskSpace(name, options.profileId);
  }
  return createStandaloneTaskSpace(name);
}

export async function profiles(): Promise<BrowserProfile[]> {
  if (isNativeBrowserAvailable()) {
    return listNativeProfiles();
  }
  return [{ id: "Default", name: "Default Profile", isDefault: true }];
}

export async function listTaskSpaces(): Promise<TaskSpaceInfo[]> {
  if (isNativeBrowserAvailable()) {
    return listNativeTaskSpaces();
  }
  return [];
}
