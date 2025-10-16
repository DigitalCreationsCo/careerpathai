import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

if (!process.env.POSTGRES_URL) {
  throw new Error('POSTGRES_URL environment variable is not set');
}

export const client = postgres(process.env.POSTGRES_URL, {
  connect_timeout: 60,
  idle_timeout: 60,
  max: 10,
  debug: process.env.NODE_ENV === 'development',
});

export const db = drizzle(client, { schema });
