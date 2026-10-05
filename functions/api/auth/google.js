// GET /api/auth/google：发起 Google OAuth 授权码流程。
// 需要 env.GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET（Dashboard → Variables and Secrets 配置）。
// 可选 ?game=tile：回调时写 tile-match 的会话并跳回 /tile-match/（缺省 = link-match-demo,历史行为不变）。
import { json } from '../_lib.js';

export function onRequestGet(ctx) {
  const { request, env } = ctx;
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return json({ error: 'google login not configured' }, 501);
  }
  const url = new URL(request.url);
  const origin = url.origin;
  const state = [...crypto.getRandomValues(new Uint8Array(16))].map(b => b.toString(16).padStart(2, '0')).join('');
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  auth.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  auth.searchParams.set('redirect_uri', origin + '/api/auth/google/callback');
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', 'openid email profile');
  auth.searchParams.set('state', state);
  const headers = new Headers({ location: auth.href });
  headers.append('set-cookie', `g_state=${state}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  // 目标游戏走独立 cookie(state 格式保持纯 hex,不碰已验证的 CSRF 比对)
  const game = url.searchParams.get('game') === 'tile' ? 'tile' : '';
  if (game) headers.append('set-cookie', `g_game=${game}; Path=/api/auth/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  return new Response(null, { status: 302, headers });
}
