import { z } from 'zod';

// Shared Zod schemas (planned for future phases)
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export * from './settings.validator';

