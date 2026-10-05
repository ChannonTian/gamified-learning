import { json, bad, authUser } from './_lib.js';

// ?game=tilematch → 通用存档表 saves_games;缺省 → saves(linkmatchdemo.v1 专用,历史行为不变)
export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  const user = await authUser(ctx);
  if (!user) return bad('unauthorized', 401);
  const game = new URL(request.url).searchParams.get('game');
  let row;
  if (game === 'tilematch') {
    row = await env.DB.prepare('SELECT data, updated_at FROM saves_games WHERE user_id = ? AND game = ?').bind(user.id, game).first();
  } else {
    row = await env.DB.prepare('SELECT data, updated_at FROM saves WHERE user_id = ?').bind(user.id).first();
  }
  let data = null;
  if (row && row.data) { try { data = JSON.parse(row.data); } catch { data = null; } }
  return json({ data, updated_at: row ? row.updated_at : null, username: user.username, display_name: user.display_name || '' });
}
