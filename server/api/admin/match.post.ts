import { defineEventHandler, readBody, createError } from 'h3';
import { useDb } from '~/server/utils/db';
import { matches } from '~/shared/database/schema';

export default defineEventHandler(async (event) => {
  // 1. Auth Check (Simple shared secret/cookie check would go here)
  
  // 2. Parse Body
  const body = await readBody(event);
  const db = useDb(event);

  // 3. Validation (Zod is recommended here in production)
  if (!body.p1Id || !body.p2Id || !body.group) {
    throw createError({ statusCode: 400, statusMessage: 'Missing fields' });
  }

  // 4. Batch Execution for Performance
  // Even if we are just inserting one match now, using batch allows us 
  // to easily add "Audit Logs" or "Update Player Last Active" in the same round-trip later.
  try {
    const result = await db.batch([
      db.insert(matches).values({
        date: body.date,
        group: body.group,
        p1Id: Number(body.p1Id),
        p2Id: Number(body.p2Id),
        s1: Number(body.s1),
        s2: Number(body.s2),
        createdAt: new Date()
      })
      // Future: db.insert(auditLogs).values(...)
    ]);
    
    return { success: true, id: result[0].meta.last_row_id };
  } catch (e) {
    console.error(e);
    throw createError({ statusCode: 500, statusMessage: 'Database Error' });
  }
});