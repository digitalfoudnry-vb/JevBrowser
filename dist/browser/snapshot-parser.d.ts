import type { PageRef, SnapshotResult } from "./types.js";
/**
 * Parses a structured textual snapshot into structured PageRef elements.
 */
export declare function parseSnapshot(text: string): PageRef[];
/**
 * Generates a structured accessibility snapshot from a Playwright Page in standalone mode.
 */
export declare function generateStandaloneSnapshot(page: any): Promise<SnapshotResult>;
