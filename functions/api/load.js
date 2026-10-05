import { json, bad, authUser } from './_lib.js';

export async function onRequestGet(ctx) {
  const user = await authUser(ctx);
  if (!user) return bad('unauthorized', 401);
  const row = await ctx.env.DB.prepare('SELECT data, updated_at FROM saves WHERE user_id = ?').bind(user.id).first();
  let data = null;
  if (row && row.data) { try { data = JSON.parse(row.data); } catch { data = null; } }
  return json({ data, updated_at: row ? row.updated_at : null, username: user.username });
}
