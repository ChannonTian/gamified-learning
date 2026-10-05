// GET /api/auth/google/callback：换 token、取用户信息、find-or-create 用户、发会话，
// 然后返回一小段 HTML 把 token 写进 localStorage 并跳回游戏。
import { newSession, genDisplayName } from '../../_lib.js';

function page(body) {
  return new Response(`<!doctype html><meta charset="utf-8"><title>Koppelen</title><body style="font-family:system-ui; background:#f5efe2; color:#3b332a; text-align:center; padding-top:18vh">${body}</body>`, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function fail(msg) {
  return page(`<p style="font-size:17px; font-weight:700">Google login failed.</p><p>${msg}</p><p><a href="/link-match-demo/">← Koppelen</a></p>`);
}

export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return fail('Not configured.');
  // CSRF:state 必须与发起时种下的 cookie 一致
  const cookie = /(?:^|;\s*)g_state=([0-9a-f]{32})(?:;|$)/.exec(request.headers.get('cookie') || '');
  if (!cookie || cookie[1] !== url.searchParams.get('state')) return fail('State mismatch. Probeer opnieuw.');
  const code = url.searchParams.get('code');
  if (!code) return fail('Missing code.');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: url.origin + '/api/auth/google/callback',
      grant_type: 'authorization_code',
    }),
  });
  if (!tokenRes.ok) return fail('Token exchange failed.');
  const { access_token } = await tokenRes.json();
  if (!access_token) return fail('No access token.');

  const uiRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { authorization: 'Bearer ' + access_token },
  });
  if (!uiRes.ok) return fail('Userinfo failed.');
  const ui = await uiRes.json();
  if (!ui.sub) return fail('No subject in userinfo.');

  // find-or-create:google_sub 命中即登录;否则建号(用户名取邮箱前缀,撞名追加 sub 尾号)
  let user = await env.DB.prepare('SELECT id, username, display_name FROM users WHERE google_sub = ?1').bind(ui.sub).first();
  if (!user) {
    let username = String(ui.email || 'gast-' + ui.sub.slice(-6)).split('@')[0].slice(0, 20) || 'gast';
    const dup = await env.DB.prepare('SELECT id FROM users WHERE username = ?1').bind(username).first();
    if (dup) username = username.slice(0, 15) + '-' + String(ui.sub).slice(-4);
    const ins = await env.DB.prepare('INSERT INTO users (username, pass_hash, google_sub) VALUES (?1, ?2, ?3)')
      .bind(username, 'google', String(ui.sub)).run();
    const id = ins.meta.last_row_id;
    await env.DB.prepare('UPDATE users SET display_name = ? WHERE id = ?').bind(genDisplayName(id), id).run();
    user = { id, username, display_name: genDisplayName(id) };
  }
  const token = await newSession(env, user.id);

  // JSON.stringify 防注入再兜一层 </script> 转义
  const payload = JSON.stringify({ token, username: user.username, display_name: user.display_name || '' }).replace(/<\//g, '<\\/');
  return page(`<script>localStorage.setItem("linkmatchdemo.auth",${payload});location.replace("/link-match-demo/");</script>`);
}
