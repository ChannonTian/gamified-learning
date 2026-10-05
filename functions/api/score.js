import { json, bad, readJson, authUser } from './_lib.js';

// 每日挑战分数上榜:按 UTC 日期分桶(0 点自然翻日),保留当日最高分
export async function onRequestPost(ctx) {
  const user = await authUser(ctx);
  if (!user) return bad('unauthorized', 401);
  const body = await readJson(ctx.request);
  const score = Math.floor(Number(body?.score));
  if (!Number.isFinite(score) || score < 0 || score > 100000) return bad('invalid score');
  const date = new Date().toISOString().slice(0, 10);
  await ctx.env.DB.prepare(
    `INSERT INTO daily_scores (date, user_id, score) VALUES (?1, ?2, ?3)
     ON CONFLICT(date, user_id) DO UPDATE SET score = MAX(score, excluded.score)`
  ).bind(date, user.id, score).run();
  return json({ ok: true, date });
}
