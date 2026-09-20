import { createNativeTaskSpace, isNativeBrowserAvailable, listNativeProfiles, listNativeTaskSpaces } from "./native.js";
import { createStandaloneTaskSpace } from "./standalone.js";
export async function taskSpace(name, options = {}) {
    if (isNativeBrowserAvailable()) {
        return createNativeTaskSpace(name, options.profileId);
    }
    return createStandaloneTaskSpace(name);
}
export async function profiles() {
    if (isNativeBrowserAvailable()) {
        return listNativeProfiles();
    }
    return [{ id: "Default", name: "Default Profile", isDefault: true }];
}
export async function listTaskSpaces() {
    if (isNativeBrowserAvailable()) {
        return listNativeTaskSpaces();
    }
    return [];
}
//# sourceMappingURL=task-space.js.map