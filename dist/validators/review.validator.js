"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submitReviewSchema = void 0;
const zod_1 = require("zod");
exports.submitReviewSchema = zod_1.z.object({
    language: zod_1.z
        .string({ required_error: 'Language is required' })
        .trim()
        .min(1, 'Language is required'),
    fileName: zod_1.z
        .string()
        .trim()
        .max(255, 'Filename is too long')
        .optional(),
    sourceCode: zod_1.z
        .string({ required_error: 'Source code is required' })
        .min(1, 'Source code cannot be empty')
        .max(500 * 1024, 'Source code exceeds maximum size (500KB)'),
});
//# sourceMappingURL=review.validator.js.map