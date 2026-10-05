-- link-match-demo 云存档（Cloudflare D1）
-- users: 玩家账号；saves: 每个玩家一份 linkmatchdemo.v1 存档 JSON
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,          -- 格式 salt$hash（PBKDF2-SHA256，hex）；Google 账号存 'google'（不可密码登录）
  google_sub TEXT UNIQUE,           -- Google 登录身份（存量库执行 ALTER TABLE users ADD COLUMN google_sub TEXT 迁移）
  display_name TEXT,                -- 排行榜/档案显示名（不查重；存量库执行 ALTER TABLE users ADD COLUMN display_name TEXT）
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS saves (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  data TEXT NOT NULL,               -- 存档整包 JSON（本地 localStorage 的 linkmatchdemo.v1）
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_scores (
  date TEXT NOT NULL,               -- UTC 日期（YYYY-MM-DD），0 点自然翻日
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  PRIMARY KEY (date, user_id)
);
