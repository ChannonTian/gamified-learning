import { json, bad, readJson, authUser } from './_lib.js';

export async function onRequestPost(ctx) {
  const { request, env } = ctx;
  const user = await authUser(ctx);
  if (!user) return bad('unauthorized', 401);
  const body = await readJson(request);
  if (!body || typeof body.data !== 'object' || body.data === null || Array.isArray(body.data)) {
    return bad('data must be an object');
  }
  const raw = JSON.stringify(body.data);
  if (raw.length > 200000) return bad('save too large', 413);
  await env.DB.prepare(
    `INSERT INTO saves (user_id, data, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
  ).bind(user.id, raw).run();
  return json({ ok: true });
}
