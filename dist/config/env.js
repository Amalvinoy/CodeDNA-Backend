"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('5000').transform((val) => parseInt(val, 10)),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    MONGODB_URI: zod_1.z.string().optional().default(''),
    JWT_SECRET: zod_1.z
        .string()
        .min(1, 'JWT_SECRET must not be empty')
        .default(process.env.NODE_ENV === 'production'
        ? ''
        : 'dev_jwt_secret_key_codedna_2026_local_fallback'),
    AI_PROVIDER: zod_1.z.enum(['gemini', 'openai', 'fallback']).default('gemini'),
    GEMINI_API_KEY: zod_1.z.string().optional().default(''),
    GEMINI_MODEL: zod_1.z.string().default('gemini-3.6-flash'),
    OPENAI_API_KEY: zod_1.z.string().optional().default(''),
    FRONTEND_URL: zod_1.z.string().default('http://localhost:3000'),
    HISTORICAL_MATCH_THRESHOLD: zod_1.z.string().optional().default('0.65'),
}).refine((data) => {
    if (data.NODE_ENV === 'production') {
        return !!data.JWT_SECRET && data.JWT_SECRET.trim().length > 0;
    }
    return true;
}, {
    message: 'JWT_SECRET is strictly required when running in production mode',
    path: ['JWT_SECRET'],
});
const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error('❌ Invalid environment variables configuration:', parsedEnv.error.format());
    process.exit(1);
}
exports.env = parsedEnv.data;
//# sourceMappingURL=env.js.map