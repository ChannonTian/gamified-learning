import { json, bad, readJson, authUser } from './_lib.js';

// ?game=tilematch → 通用存档表 saves_games;缺省 → saves(linkmatchdemo.v1 专用,历史行为不变)
const GAMES = {
  tilematch: { table: 'saves_games', where: 'user_id = ? AND game = ? AND game IS NOT NULL', extra: ['tilematch'] },
};

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
  const game = new URL(request.url).searchParams.get('game');
  if (game === 'tilematch') {
    await env.DB.prepare(
      `INSERT INTO saves_games (user_id, game, data, updated_at) VALUES (?, ?, ?, datetime('now'))
       ON CONFLICT(user_id, game) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    ).bind(user.id, game, raw).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO saves (user_id, data, updated_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at`
    ).bind(user.id, raw).run();
  }
  return json({ ok: true });
}
