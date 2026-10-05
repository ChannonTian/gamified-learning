// Workers(静态资产 + API)入口:/api/* 路由到 handlers(functions/api/ 里的实现复用),
// 其余路径由 ASSETS 直接服务(run_worker_first 只拦截 /api/*)。
import * as signup from "./functions/api/signup.js";
import * as login from "./functions/api/login.js";
import * as logout from "./functions/api/logout.js";
import * as load from "./functions/api/load.js";
import * as save from "./functions/api/save.js";
import * as profile from "./functions/api/profile.js";
import * as account from "./functions/api/account.js";
import * as score from "./functions/api/score.js";
import * as leaderboard from "./functions/api/leaderboard.js";
import * as googleStart from "./functions/api/auth/google.js";
import * as googleCallback from "./functions/api/auth/google/callback.js";

const routes = {
  "POST /api/signup": signup.onRequestPost,
  "POST /api/login": login.onRequestPost,
  "POST /api/logout": logout.onRequestPost,
  "GET /api/load": load.onRequestGet,
  "POST /api/save": save.onRequestPost,
  "GET /api/profile": profile.onRequestGet,
  "PATCH /api/profile": profile.onRequestPatch,
  "DELETE /api/account": account.onRequestDelete,
  "POST /api/score": score.onRequestPost,
  "GET /api/leaderboard": leaderboard.onRequestGet,
  "GET /api/auth/google": googleStart.onRequestGet,
  "GET /api/auth/google/callback": googleCallback.onRequestGet,
};

export default {
  async fetch(request, env, ctx) {
    const key = request.method + " " + new URL(request.url).pathname;
    const handler = routes[key];
    if (!handler) return new Response(null, { status: 404 });
    return handler({ request, env, ctx });
  },
};
