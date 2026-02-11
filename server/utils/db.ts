import { drizzle } from 'drizzle-orm/d1';
import * as schema from '~/shared/database/schema';

// Helper to get DB instance from event context
export const useDb = (event: any) => {
  // In production (Cloudflare Pages), context.cloudflare.env.DB is the binding
  // In local dev, standard Nuxt devtools might mock this, or we rely on wrangler dev
  const dbBinding = event.context.cloudflare?.env?.DB;
  
  if (!dbBinding) {
    throw new Error('Database binding (DB) not found. Ensure Wrangler is configured.');
  }
  
  return drizzle(dbBinding, { schema });
};