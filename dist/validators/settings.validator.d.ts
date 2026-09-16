import { z } from 'zod';
export declare const updateSettingsSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    avatar: z.ZodOptional<z.ZodString>;
    primaryRole: z.ZodOptional<z.ZodString>;
    engineeringFocus: z.ZodOptional<z.ZodString>;
    preferences: z.ZodOptional<z.ZodObject<{
        strictMode: z.ZodOptional<z.ZodBoolean>;
        autoFix: z.ZodOptional<z.ZodBoolean>;
        predictiveAlerts: z.ZodOptional<z.ZodBoolean>;
    }, "strip", z.ZodTypeAny, {
        strictMode?: boolean | undefined;
        autoFix?: boolean | undefined;
        predictiveAlerts?: boolean | undefined;
    }, {
        strictMode?: boolean | undefined;
        autoFix?: boolean | undefined;
        predictiveAlerts?: boolean | undefined;
    }>>;
}, "strip", z.ZodTypeAny, {
    name?: string | undefined;
    avatar?: string | undefined;
    primaryRole?: string | undefined;
    engineeringFocus?: string | undefined;
    preferences?: {
        strictMode?: boolean | undefined;
        autoFix?: boolean | undefined;
        predictiveAlerts?: boolean | undefined;
    } | undefined;
}, {
    name?: string | undefined;
    avatar?: string | undefined;
    primaryRole?: string | undefined;
    engineeringFocus?: string | undefined;
    preferences?: {
        strictMode?: boolean | undefined;
        autoFix?: boolean | undefined;
        predictiveAlerts?: boolean | undefined;
    } | undefined;
}>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
