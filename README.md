# gamified-learning

Building a language learning game suite that really applies the latest learning theories, cognitive science, psychology & behavioural economics.

用游戏机制真正承载学习内容的语言学习游戏合集——不是"消消乐 + 顺便飘单词"的巧克力外衣,而是让认读、回忆、检索成为玩法本身。

## 游戏列表

| 游戏 | 语言 | 内容 | 状态 |
|---|---|---|---|
| [link-match](./link-match/) | 荷兰语 | 原形 ↔ 变位形式连连看(形式分组 51 关)+ 无尽 / 每日 / 生存 | **主线产品**,持续迭代 |
| [tile-match](./tile-match/) | 荷兰语 | 强变化/不规则动词变位(过去式单复数 + 过去分词)三消 + 无尽/每日挑战 | 已上线,功能冻结(2026-10-02 起任务线集中到 link-match) |

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

## 在线部署(GitHub Pages)

仓库公开后,进入 **Settings → Pages → Build and deployment → Source: Deploy from a branch**,选 `main` / `(root)` 保存即可,地址为 `https://<用户名>.github.io/gamified-learning/`(根目录的跳转页会直接进入游戏)。

## License

[PolyForm Noncommercial 1.0.0](./LICENSE) —— 源码公开可见,任何人可出于非商业目的查看、使用、修改和学习;商业使用权保留。如需商业授权或想更换许可证,请联系作者。
