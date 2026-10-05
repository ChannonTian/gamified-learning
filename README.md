# gamified-learning

Building a language learning game suite that really applies the latest learning theories, cognitive science, psychology & behavioural economics.

用游戏机制真正承载学习内容的语言学习游戏合集——不是"消消乐 + 顺便飘单词"的巧克力外衣,而是让认读、回忆、检索成为玩法本身。

## 游戏列表

| 游戏 | 语言 | 内容 | 状态 |
|---|---|---|---|
| [link-match-demo](./link-match-demo/) | 荷兰语 | 主线产品:Taalhuis NIG I–IV 词表 50 词 / 18 关 + 无尽 / 每日(排行榜)/ 生存;**账号登录 + 云存档 + 每日排行榜** | **主线**,持续迭代 |
| [link-match](./link-match/) | 荷兰语 | 完整版连连看(108 词 / 51 关,A1–B1 形式分组)+ 无尽 / 每日 / 生存 | 已上线,冻结待 demo 定稿后同步 |
| [tile-match](./tile-match/) | 荷兰语 | 强变化动词三消(过去式单复数 + 过去分词)+ 无尽/每日挑战 | 功能冻结(v0.87) |
| [four-match](./four-match/) | 荷兰语 | 四消对照原型(原形+三变位同消) | 已否决,留档在线 |

## 文档

- [AGENTS.md](AGENTS.md) — 项目记忆:约定、当前状态、已踩过的坑(AI 会话先读)
- [docs/DESIGN.md](docs/DESIGN.md) — 设计决策与依据
- [docs/DEVLOG.md](docs/DEVLOG.md) — 迭代日志(最新在上)
- [docs/ROADMAP.md](docs/ROADMAP.md) — 路线图
- [docs/PLAYTEST.md](docs/PLAYTEST.md) — 试玩指引(给人类玩家)

## 本地运行

任意游戏文件夹直接双击 `index.html` 即可(单文件、零依赖);或:

```bash
python3 -m http.server 8000
# → http://localhost:8000/tile-match/
```

## 在线部署

- **正式站(Cloudflare Workers,主部署)**:`https://play.channon-tian.com/`(自定义域名)= `https://gamified-learning.channon-tian.workers.dev/`。push 到 main 自动构建部署(`npx wrangler deploy`,配置见 `wrangler.toml`);`/api/*` 由 `worker.js` 路由到 `functions/api/`(登录/云存档/排行榜),数据在 Cloudflare D1(`linkmatch-db`,表结构见 `schema.sql`)。
- **GitHub Pages(旧地址)**:`https://channontian.github.io/gamified-learning/` 同仓镜像,纯静态——页面可用但**没有后端**,登录会提示服务器不可达,属预期降级。

## 本地开发(带后端)

```bash
npx wrangler dev --persist-to /tmp/任意目录   # 状态目录必须在仓库外,否则资产监视器无限重载
# → http://localhost:8787/link-match-demo/(D1 绑定自动从 wrangler.toml 生效,首次需灌 schema)
```

## License

[PolyForm Noncommercial 1.0.0](./LICENSE) —— 源码公开可见,任何人可出于非商业目的查看、使用、修改和学习;商业使用权保留。如需商业授权或想更换许可证,请联系作者。
