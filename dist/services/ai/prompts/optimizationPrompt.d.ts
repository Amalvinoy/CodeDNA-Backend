import { z } from 'zod';
export declare const SYSTEM_OPTIMIZATION_PROMPT: string;
export declare const aiOptimizationResponseSchema: z.ZodObject<{
    optimizedCode: z.ZodString;
    summary: z.ZodString;
    changes: z.ZodArray<z.ZodObject<{
        category: z.ZodString;
        explanation: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        category: string;
        explanation: string;
    }, {
        category: string;
        explanation: string;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    summary: string;
    optimizedCode: string;
    changes: {
        category: string;
        explanation: string;
    }[];
}, {
    summary: string;
    optimizedCode: string;
    changes: {
        category: string;
        explanation: string;
    }[];
}>;
export type AIOptimizationResponse = z.infer<typeof aiOptimizationResponseSchema>;
