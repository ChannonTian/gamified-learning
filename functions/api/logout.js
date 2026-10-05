import { json, bearerToken } from './_lib.js';

export async function onRequestPost(ctx) {
  const token = bearerToken(ctx.request);
  if (token) await ctx.env.DB.prepare('DELETE FROM sessions WHERE token = ?').bind(token).run();
  return json({ ok: true });
}
