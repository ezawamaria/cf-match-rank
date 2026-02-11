import { defineEventHandler, readBody, createError } from 'h3';
import { useDb } from '~/server/utils/db';
import { players, matches } from '~/shared/database/schema';
import { checkAuth } from '~/server/utils/auth';
import { sql } from 'drizzle-orm';

export default defineEventHandler(async (event) => {
  checkAuth(event);
  const body = await readBody(event) as any;
  const db = useDb(event);

  if (!body.id) throw createError({ statusCode: 400, statusMessage: "ID Required" });
  const pId = Number(body.id);

  // Delete matches first
  await db.delete(matches).where(sql`${matches.p1Id} = ${pId} OR ${matches.p2Id} = ${pId}`);
  // Delete player
  await db.delete(players).where(sql`${players.id} = ${pId}`);

  return { success: true };
});