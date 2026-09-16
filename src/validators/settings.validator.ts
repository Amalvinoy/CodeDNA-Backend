import { z } from 'zod';

export const updateSettingsSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters')
    .optional(),
  avatar: z.string().trim().max(500).optional(),
  primaryRole: z.string().trim().max(100, 'Primary role must be under 100 characters').optional(),
  engineeringFocus: z.string().trim().max(200, 'Engineering focus must be under 200 characters').optional(),
  preferences: z
    .object({
      strictMode: z.boolean().optional(),
      autoFix: z.boolean().optional(),
      predictiveAlerts: z.boolean().optional(),
    })
    .optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
