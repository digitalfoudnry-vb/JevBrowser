import { type AnyTaskSpace } from "../browser/task-space.js";
import type { JevNavigateOptions, JevNavigateResult } from "../browser/types.js";
export declare function jevNavigate(task: string, startUrl: string, options?: JevNavigateOptions, existingTaskSpace?: AnyTaskSpace): Promise<JevNavigateResult>;
