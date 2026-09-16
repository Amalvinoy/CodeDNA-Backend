import { z } from 'zod';
export declare const submitReviewSchema: z.ZodObject<{
    language: z.ZodString;
    fileName: z.ZodOptional<z.ZodString>;
    sourceCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    language: string;
    sourceCode: string;
    fileName?: string | undefined;
}, {
    language: string;
    sourceCode: string;
    fileName?: string | undefined;
}>;
export type SubmitReviewPayload = z.infer<typeof submitReviewSchema>;
