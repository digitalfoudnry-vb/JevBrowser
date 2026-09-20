import { lookup } from "node:dns/promises";
export declare function publicUrl(value: string): URL;
export declare function isPublicAddress(address: string): boolean;
export declare function resolvePublicHost(host: string, resolver?: typeof lookup): Promise<string>;
export declare function normalizeHosts(hosts: string[]): Set<string>;
export declare function safeError(error: unknown): string;
export declare function validateStepAnswers(answers: any, criteria: Record<string, string>): {
    stuck: {
        noul: number;
    };
    action: {
        choice: string;
        probabilities: Record<string, number>;
        confidence?: number | null | undefined;
    };
    goal_done: {
        noul: number;
    };
};
