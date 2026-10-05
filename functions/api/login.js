import { json, bad, readJson, verifyPassword, newSession } from './_lib.js';

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const body = await readJson(request);
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  if (!username || typeof body?.password !== 'string') return bad('wrong credentials', 401);
  const row = await env.DB.prepare('SELECT id, pass_hash FROM users WHERE username = ?').bind(username).first();
  if (!row || !(await verifyPassword(body.password, row.pass_hash))) return bad('wrong credentials', 401);
  const token = await newSession(env, row.id);
  return json({ token, username });
}
