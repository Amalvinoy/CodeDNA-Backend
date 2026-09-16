import { z } from 'zod';

export const submitReviewSchema = z.object({
  language: z
    .string({ required_error: 'Language is required' })
    .trim()
    .min(1, 'Language is required'),
  fileName: z
    .string()
    .trim()
    .max(255, 'Filename is too long')
    .optional(),
  sourceCode: z
    .string({ required_error: 'Source code is required' })
    .min(1, 'Source code cannot be empty')
    .max(500 * 1024, 'Source code exceeds maximum size (500KB)'),
});

export type SubmitReviewPayload = z.infer<typeof submitReviewSchema>;
