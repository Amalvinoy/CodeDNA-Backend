import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  MONGODB_URI: z.string().optional().default(''),
  JWT_SECRET: z
    .string()
    .min(1, 'JWT_SECRET must not be empty')
    .default(
      process.env.NODE_ENV === 'production'
        ? ''
        : 'dev_jwt_secret_key_codedna_2026_local_fallback'
    ),
  AI_PROVIDER: z.enum(['gemini', 'openai', 'fallback']).default('gemini'),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().default('gemini-3.6-flash'),
  OPENAI_API_KEY: z.string().optional().default(''),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  HISTORICAL_MATCH_THRESHOLD: z.string().optional().default('0.65'),
}).refine(
  (data) => {
    if (data.NODE_ENV === 'production') {
      return !!data.JWT_SECRET && data.JWT_SECRET.trim().length > 0;
    }
    return true;
  },
  {
    message: 'JWT_SECRET is strictly required when running in production mode',
    path: ['JWT_SECRET'],
  }
);

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
