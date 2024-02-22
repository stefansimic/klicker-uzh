import { Element } from '@klicker-uzh/prisma';

declare function processQuestionData(question: Element): {
    id: string;
    questionId: number;
};
declare function processElementData(element: Element): {
    id: string;
    elementId: number;
};
declare function getInitialElementResults(element: Element): {
    INCORRECT: number;
    PARTIAL: number;
    CORRECT: number;
    total: number;
    choices?: undefined;
    responses?: undefined;
    viewed?: undefined;
} | {
    choices: any;
    total: number;
    INCORRECT?: undefined;
    PARTIAL?: undefined;
    CORRECT?: undefined;
    responses?: undefined;
    viewed?: undefined;
} | {
    responses: {};
    total: number;
    INCORRECT?: undefined;
    PARTIAL?: undefined;
    CORRECT?: undefined;
    choices?: undefined;
    viewed?: undefined;
} | {
    viewed: number;
    INCORRECT?: undefined;
    PARTIAL?: undefined;
    CORRECT?: undefined;
    total?: undefined;
    choices?: undefined;
    responses?: undefined;
};

export { getInitialElementResults, processElementData, processQuestionData };
