import dotenv from 'dotenv';
import { z } from 'zod';
import path from 'path';

// Load the correct .env file based on ENV variable
// ENV=local → .env.local, ENV=staging → .env.staging, default → .env.local
const envName = process.env.ENV ?? 'local';
const envFile = path.resolve(`.env.${envName}`);
dotenv.config({ path: envFile });

console.info(`[Config] Environment: ${envName} (loaded from ${envFile})`);

const EnvSchema = z.object({
  ENV: z.enum(['local', 'staging']).default('local'),
  BASE_URL: z.string().url(),
  API_BASE_URL: z.string().url(),
  DB_ENABLED: z
    .string()
    .transform((v) => v === 'true')
    .default('false'),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),
  ADMIN_USERNAME: z.string().default('Admin'),
  ADMIN_PASSWORD: z.string().default('admin123'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GITHUB_TOKEN: z.string().optional(),
  GITHUB_OWNER: z.string().optional(),
  GITHUB_REPO: z.string().optional(),
  OAUTH_CLIENT_ID: z.string().optional(),
  OAUTH_CLIENT_SECRET: z.string().optional(),
  OAUTH_USERNAME: z.string().optional(),
  OAUTH_PASSWORD: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment config:', parsed.error.format());
  process.exit(1);
}

const data = parsed.data;

export const config = {
  env: data.ENV,
  baseUrl: data.BASE_URL,
  apiBaseUrl: data.API_BASE_URL,
  dbEnabled: data.DB_ENABLED,

  db: {
    host: data.DB_HOST,
    port: data.DB_PORT,
    name: data.DB_NAME,
    user: data.DB_USER,
    password: data.DB_PASSWORD,
  },

  admin: {
    username: data.ADMIN_USERNAME,
    password: data.ADMIN_PASSWORD,
  },

  geminiApiKey: data.GEMINI_API_KEY,

  github: {
    token: data.GITHUB_TOKEN,
    owner: data.GITHUB_OWNER,
    repo: data.GITHUB_REPO,
  },
} as const;
