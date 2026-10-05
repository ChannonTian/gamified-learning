import { json, bad, readJson, validUsername, validPassword, makePasswordRecord, newSession } from './_lib.js';

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const body = await readJson(request);
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  if (!validUsername(username)) return bad('username must be 2-24 characters');
  if (!validPassword(body?.password)) return bad('password must be at least 4 characters');
  const dup = await env.DB.prepare('SELECT id FROM users WHERE username = ?').bind(username).first();
  if (dup) return bad('username already taken', 409);
  const rec = await makePasswordRecord(body.password);
  const ins = await env.DB.prepare('INSERT INTO users (username, pass_hash) VALUES (?, ?)').bind(username, rec).run();
  const token = await newSession(env, ins.meta.last_row_id);
  return json({ token, username });
}
