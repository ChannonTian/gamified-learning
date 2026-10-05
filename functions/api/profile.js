import { json, bad, readJson, authUser } from './_lib.js';

export async function onRequestGet(ctx) {
  const user = await authUser(ctx);
  if (!user) return bad('unauthorized', 401);
  const row = await ctx.env.DB.prepare('SELECT username, display_name, google_sub FROM users WHERE id = ?').bind(user.id).first();
  if (!row) return bad('unauthorized', 401);
  return json({ username: row.username, display_name: row.display_name || '', via_google: !!row.google_sub });
}

// 显示名不查重(设计拍板):只是昵称,身份靠账号
export async function onRequestPatch(ctx) {
  const user = await authUser(ctx);
  if (!user) return bad('unauthorized', 401);
  const body = await readJson(ctx.request);
  const name = typeof body?.display_name === 'string' ? body.display_name.trim().replace(/\s+/g, ' ') : '';
  if (name.length < 2 || name.length > 24) return bad('display name must be 2-24 characters');
  await ctx.env.DB.prepare('UPDATE users SET display_name = ? WHERE id = ?').bind(name, user.id).run();
  return json({ ok: true, display_name: name });
}
