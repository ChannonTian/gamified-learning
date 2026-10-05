import { json, bad, authUser } from './_lib.js';

// 删除账号:连带云端存档、会话、排行榜分数。本地 localStorage 不动(玩家设备上的东西由玩家自便)。
export async function onRequestDelete(ctx) {
  const user = await authUser(ctx);
  if (!user) return bad('unauthorized', 401);
  const db = ctx.env.DB;
  await db.batch([
    db.prepare('DELETE FROM daily_scores WHERE user_id = ?').bind(user.id),
    db.prepare('DELETE FROM sessions WHERE user_id = ?').bind(user.id),
    db.prepare('DELETE FROM saves WHERE user_id = ?').bind(user.id),
    db.prepare('DELETE FROM users WHERE id = ?').bind(user.id),
  ]);
  return json({ ok: true });
}
