import { defineEventHandler, readBody, createError } from 'h3';
import { useDb } from '~/server/utils/db';
import { matches } from '~/shared/database/schema';
import { checkAuth } from '~/server/utils/auth';
import { sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  checkAuth(event);
  const body = await readBody(event) as any;
  const db = useDb(event);

  if (!body.date) throw createError({ statusCode: 400, statusMessage: "Date Required" });

  await db.delete(matches).where(sql`${matches.date} = ${body.date}`);
  return { success: true };
});