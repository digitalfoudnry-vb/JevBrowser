import type { PageRef } from "../browser/types.js";
export declare const MAX_ELEMENTS = 240;
export declare const PRICE_PER_MTOK_IN = 0.042;
export interface PageElement {
    id: string;
    ref: string;
    kind: "click" | "type" | "select";
    description: string;
    options?: string[];
}
export declare function isNoiseName(name: string): boolean;
export declare function isNoiseHref(href: string | undefined): boolean;
export declare function compileActionSpace(refs: PageRef[]): {
    elements: PageElement[];
    truncated: boolean;
};
export declare function buildCriteria(elements: PageElement[]): Record<string, string>;
export declare function pickAlternate(probabilities: Record<string, number> | undefined, exclude: Set<string>): string | null;
export declare function heuristicQuery(task: string): string;
