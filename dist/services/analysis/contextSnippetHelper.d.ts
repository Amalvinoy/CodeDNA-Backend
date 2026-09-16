export declare function generateCodeContextSnippet(sourceCode: string, targetLine: number, contextRadius?: number): {
    startLine: number;
    lines: {
        lineNumber: number;
        code: string;
        isHighlighted?: boolean;
    }[];
};
