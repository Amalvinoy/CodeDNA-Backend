"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSettingsSchema = void 0;
const zod_1 = require("zod");
exports.updateSettingsSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name must be under 100 characters')
        .optional(),
    avatar: zod_1.z.string().trim().max(500).optional(),
    primaryRole: zod_1.z.string().trim().max(100, 'Primary role must be under 100 characters').optional(),
    engineeringFocus: zod_1.z.string().trim().max(200, 'Engineering focus must be under 200 characters').optional(),
    preferences: zod_1.z
        .object({
        strictMode: zod_1.z.boolean().optional(),
        autoFix: zod_1.z.boolean().optional(),
        predictiveAlerts: zod_1.z.boolean().optional(),
    })
        .optional(),
});
//# sourceMappingURL=settings.validator.js.map