import type { Config } from 'drizzle-kit';

export default {
  schema: './shared/database/schema.ts',
  out: './drizzle',
  driver: 'd1-http',
  dialect: 'sqlite',
} satisfies Config;