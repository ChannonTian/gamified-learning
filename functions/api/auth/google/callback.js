// GET /api/auth/google/callback：换 token、取用户信息、find-or-create 用户、发会话，
// 然后返回一小段 HTML 把 token 写进 localStorage 并跳回游戏。
import { newSession, genDisplayName } from '../../_lib.js';

function page(body) {
  return new Response(`<!doctype html><meta charset="utf-8"><title>Koppelen</title><body style="font-family:system-ui; background:#f5efe2; color:#3b332a; text-align:center; padding-top:18vh">${body}</body>`, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' },
  });
}

function fail(msg, back) {
  const to = back || '/link-match-demo/';
  return page(`<p style="font-size:17px; font-weight:700">Google login failed.</p><p>${msg}</p><p><a href="${to}">← ${to === '/tile-match/' ? 'Sterke werkwoorden' : 'Koppelen'}</a></p>`);
}

export async function onRequestGet(ctx) {
  const { request, env } = ctx;
  const url = new URL(request.url);
  // 发起端 ?game=tile 经 g_game cookie 带到这里:失败页也跳回正确的游戏
  const back = /(?:^|;\s*)g_game=tile(?:;|$)/.test(request.headers.get('cookie') || '') ? '/tile-match/' : '/link-match-demo/';
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return fail('Not configured.', back);
  // CSRF:state 必须与发起时种下的 cookie 一致
  const cookie = /(?:^|;\s*)g_state=([0-9a-f]{32})(?:;|$)/.exec(request.headers.get('cookie') || '');
  if (!cookie || cookie[1] !== url.searchParams.get('state')) return fail('State mismatch. Probeer opnieuw.', back);
  const code = url.searchParams.get('code');
  if (!code) return fail('Missing code.', back);

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
  if (!tokenRes.ok) return fail('Token exchange failed.', back);
  const { access_token } = await tokenRes.json();
  if (!access_token) return fail('No access token.', back);

  const uiRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { authorization: 'Bearer ' + access_token },
  });
  if (!uiRes.ok) return fail('Userinfo failed.', back);
  const ui = await uiRes.json();
  if (!ui.sub) return fail('No subject in userinfo.', back);

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

  // setItem 的第二个参数必须是字符串字面量:双重 stringify 生成带引号的 JSON 字面量,
  // 再把 <>/、&、行分隔符转成 unicode 转义,防内联脚本注入(此前直接内插对象,setItem 存成了 "[object Object]",Google 登录永远不生效)
  const authLiteral = JSON.stringify(JSON.stringify({ token, username: user.username, display_name: user.display_name || '' }))
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  // 发起时 ?game=tile 经 g_game cookie 带到这里:写 tile-match 的会话并跳回三消;缺省 = link-match-demo(历史行为不变)
  const game = /(?:^|;\s*)g_game=tile(?:;|$)/.test(request.headers.get('cookie') || '');
  if (game) {
    return page(`<script>localStorage.setItem("nlm3.auth",${authLiteral});location.replace("/tile-match/");</script>`);
  }
  return page(`<script>localStorage.setItem("linkmatchdemo.auth",${authLiteral});location.replace("/link-match-demo/");</script>`);
}
