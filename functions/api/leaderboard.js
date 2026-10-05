import { json, authUser } from './_lib.js';

// 当日 top 50(显示名+分数);带 token 则附上自己的名次。游客可看不可上榜。
export async function onRequestGet(ctx) {
  const { env } = ctx;
  const date = new Date().toISOString().slice(0, 10);
  const user = await authUser(ctx);
  const board = await env.DB.prepare(
    `SELECT ds.user_id AS id, COALESCE(NULLIF(u.display_name, ''), u.username) AS name, ds.score AS score
     FROM daily_scores ds JOIN users u ON u.id = ds.user_id
     WHERE ds.date = ?1 ORDER BY ds.score DESC, ds.user_id ASC LIMIT 50`
  ).bind(date).all();
  let me = null;
  if (user) {
    const row = await env.DB.prepare('SELECT score FROM daily_scores WHERE date = ?1 AND user_id = ?2').bind(date, user.id).first();
    if (row) {
      const above = await env.DB.prepare('SELECT COUNT(*) AS n FROM daily_scores WHERE date = ?1 AND score > ?2').bind(date, row.score).first();
      me = { rank: (above ? above.n : 0) + 1, score: row.score };
    }
  }
  return json({ date, board: board.results || [], me });
}
