export interface PageRef {
    ref: string;
    backendNodeId?: number;
    role: string;
    name: string;
    loc?: string;
    href?: string;
    type?: string;
    clickable: boolean;
    typeable: boolean;
    selectable: boolean;
    options?: string[];
}
export interface SnapshotResult {
    content: string;
    refs: PageRef[];
}
export interface PageActionReceipt {
    popups: Array<{
        label: string;
        targetId: string;
    }>;
    dialog?: {
        type: string;
        message: string;
        defaultPrompt?: string;
    };
}
export interface BrowserProfile {
    id: string;
    name: string;
    isDefault: boolean;
}
export interface TaskSpaceInfo {
    id: number;
    taskId: string;
    name: string;
    ownership: "agent" | "user";
    profileId?: string;
    profileName?: string;
    recentTabTitles?: string[];
}
export interface PageGotoOptions {
    timeout?: number;
    waitUntil?: "load" | "domcontentloaded" | "networkidle";
    referer?: string;
}
export interface PageSnapshotOptions {
    scope?: "full_page" | "only_within_viewport" | "subtree";
    root?: string | number;
    interactiveOnly?: boolean;
    includeActionMarks?: boolean;
    includeStableLocator?: boolean;
    maxResultLength?: number;
}
export interface PageClickOptions {
    timeout?: number;
    label?: string;
    dblclick?: boolean;
}
export interface PageFillOptions {
    timeout?: number;
    label?: string;
}
export interface JevNavigateOptions {
    maxSteps?: number;
    maxSeconds?: number;
    allowTyping?: boolean;
    submitAfterTyping?: boolean;
    allowMutations?: boolean;
    allowedHosts?: string[];
    format?: "text" | "markdown" | "html" | "aria";
    maxChars?: number;
    screenshot?: "final" | "none";
}
export interface JevStepRecord {
    step: number;
    t_ms?: number;
    proposed_action: string;
    executed_action: string | null;
    detail: string;
    outcome: string;
    confidence: number | null;
    top_probability: number | null;
    goal_done: number;
    stuck: number;
}
export interface JevNavigateResult {
    status: "done" | "goal_achieved" | "stuck" | "timeout" | "max_steps" | "cancelled" | "error";
    error?: string;
    final_url?: string;
    final_title?: string;
    steps: JevStepRecord[];
    page?: {
        truncated: boolean;
        true_length: number;
        content: string;
    } | null;
    screenshot_base64_jpeg?: string | null;
    usage: {
        jev_calls: number;
        input_tokens: number;
        output_tokens: number;
        est_cost_usd: number;
    };
    elapsed_ms: number;
    model: string;
    jev_provider: string | null;
}
