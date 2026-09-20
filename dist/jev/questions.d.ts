export declare function stepQuestions(criteria: Record<string, string>): {
    action: import("@typesafe-ai/sdk").ChoiceQuestion<Record<string, string>>;
    goal_done: import("@typesafe-ai/sdk").NoulQuestion;
    stuck: import("@typesafe-ai/sdk").NoulQuestion;
};
export declare function selectOptionQuestion(elementDescription: string, options: string[]): import("@typesafe-ai/sdk").ChoiceQuestion<Record<string, string>>;
