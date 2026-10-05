// 共享工具：JSON 响应、PBKDF2 密码哈希、Bearer 会话鉴权。
// PBKDF2 迭代 10000：Workers 免费档单请求 10ms CPU 预算，10 万次会超限（1102 错误）。
const ENC = new TextEncoder();

export function json(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export function bad(error, status = 400) {
  return json({ error }, status);
}

function bytesToHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

async function pbkdf2(password, saltHex) {
  const key = await crypto.subtle.importKey('raw', ENC.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: hexToBytes(saltHex), iterations: 10000 },
    key, 256
  );
  return bytesToHex(bits);
}

// 存储格式：salt$hash（均为 hex）
export async function makePasswordRecord(password) {
  const salt = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  return salt + '$' + (await pbkdf2(password, salt));
}

export async function verifyPassword(password, record) {
  const [salt, hash] = String(record || '').split('$');
  if (!salt || !hash) return false;
  const cand = await pbkdf2(password, salt);
  const a = ENC.encode(cand), b = ENC.encode(hash);
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export function bearerToken(req) {
  const m = /^Bearer\s+(.+)$/i.exec(req.headers.get('authorization') || '');
  return m ? m[1] : null;
}

// Bearer token → {id, username, display_name}；未带 token 或会话失效返回 null
export async function authUser(ctx) {
  const token = bearerToken(ctx.request);
  if (!token) return null;
  const row = await ctx.env.DB.prepare(
    'SELECT u.id AS id, u.username AS username, u.display_name AS display_name FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token = ?'
  ).bind(token).first();
  return row || null;
}

// 显示名:随机形容词+名词(荷兰语,类似 Google Docs 匿名名),按 id 确定性生成——两台设备看到同一个默认名
const NAME_ADJ = ["Flinke","Moedige","Blije","Wijze","Snelle","Lieve","Sterke","Vrolijke","Dappere","Nieuwsgierige","Zonnige","Vlotte","Eigenzinnige","Vriendelijke","Muzikale","Nuchtere","Eerlijke","Dromende","Dansende","Denkende","Reizende","Lezende","Zingende","Stoere","Keurige","Fleurige","Zachte","Stoute","Grote","Kleine","Originele","Edele"];
const NAME_NOUN = ["Vos","Mees","Uil","Haas","Reiger","Eend","Kikker","Egel","Eekhoorn","Zwaan","Spreeuw","Vink","Konijn","Bever","Otter","Mus","Wolk","Ster","Maan","Weide","Dijk","Toren","Brug","Zeil","Boek","Kompas","Lantaarn","Molen","Tulp","Kers","Peer","Appel"];

export function genDisplayName(id) {
  const n = Math.abs(Number(id) || 0);
  return NAME_ADJ[n % 32] + ' ' + NAME_NOUN[Math.floor(n / 7) % 32];
}

export async function newSession(env, userId) {
  const token = bytesToHex(crypto.getRandomValues(new Uint8Array(32)));
  await env.DB.prepare('INSERT INTO sessions (token, user_id) VALUES (?, ?)').bind(token, userId).run();
  return token;
}

export function validUsername(u) {
  return typeof u === 'string' && u.trim().length >= 2 && u.length <= 24;
}

export function validPassword(p) {
  return typeof p === 'string' && p.length >= 4 && p.length <= 128;
}

export async function readJson(request) {
  try { return await request.json(); } catch { return null; }
}
