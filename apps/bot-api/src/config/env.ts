// src/config/env.ts
import { z } from 'zod';

/**
 * Centraliza y valida las variables de entorno.
 * La idea es fallar rápido al arrancar si falta algo crítico para producción.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().optional(),

  // Meta / Instagram
  META_VERIFY_TOKEN: z.string(),
  META_PAGE_ID: z.string(),
  META_PAGE_ACCESS_TOKEN: z.string(),
  META_GRAPH_API_BASE: z.string().default('https://graph.facebook.com/v20.0'),
  META_APP_SECRET: z.string().optional(),

  // OpenAI
  OPENAI_API_KEY: z.string(),
  OPENAI_MODEL: z.string().default('gpt-4.1-mini'),
  OPENAI_EMBED_MODEL: z.string().default('text-embedding-3-large'),

  // Base de datos principal
  DATABASE_URL: z.string(),

  // Integraciones opcionales
  REDIS_URL: z.string().optional(),
  VECTOR_DB_URL: z.string().optional(),
}).passthrough();

// Parseamos una sola vez al inicio del proceso.
export const env = envSchema.parse(process.env);

// Helper rápido para saber si estamos en producción.
export const isProd = env.NODE_ENV === 'production';
