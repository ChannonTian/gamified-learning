# AGENTS.md — 项目记忆(供 AI 会话与协作者快速上手)

> 语言游戏合集 `gamified-learning` 的工作约定与当前状态。改代码前先读这里;做完改动要同步更新 `docs/DEVLOG.md` 和本文件的"当前状态"。

## 项目是什么

用游戏机制**真正承载学习内容**的语言学习游戏合集(拒绝"消消乐+飘单词"式贴皮)。目前只有一个游戏:

- **tile-match**:荷兰语强变化动词(sterke werkwoorden)三消。匹配判定 = 同一动词的"单数过去式 + 复数过去式 + 过去分词"三种形式各≥1、3+ 个连成一线——**认词/检索变位归属就是玩法本身**。

## 结构与约定

```
gamified-learning/
├── index.html          ← 根跳转页(Pages 根路径直达游戏)
├── AGENTS.md           ← 本文件(项目记忆)
├── docs/
│   ├── DESIGN.md       ← 设计决策与依据(改玩法前必读)
│   ├── DEVLOG.md       ← 按日期的迭代日志(每次改动追加)
│   └── ROADMAP.md      ← 路线图(优先级用户定)
├── tile-match/
│   ├── index.html      ← 游戏本体:单文件、零依赖(原生 JS+CSS)
│   └── README.md       ← 游戏说明
└── LICENSE             ← PolyForm Noncommercial 1.0.0(公开但非商业)
```

- **单文件铁律**:游戏全部内联(HTML/CSS/JS/插画 SVG),不加构建、不加外部资源。
- **界面语言**:默认全荷兰语(`lang="nl"`),所有文案走 `I18N` 词典 + `data-i18n`;中文是设置里的可选项。与用户沟通用中文。
- **存档**:localStorage key `nlm3.prototype.v1`,结构 `{unlocked, collected[], style, counts{}, best{}, lastLevel, settings{...}}`;改结构要保持向后兼容(merge 默认值)。
- **调试钩子**:`window.NLM3`(state/swap/findMove/countMoves/settings),自动化 QA 全靠它,别删。
- **QA 流程**:`python3 -m http.server 8461` → 浏览器自动化:bot 用 `NLM3.findMove()+swap` 循环走棋、自动点掉首次解锁卡;截图查手机(390×844)和桌面两档;检查 console 无错。**自动化会写真实存档:开始前备份 localStorage,结束后清空恢复**,否则会污染用户进度(unlocked/lastLevel/done 被 bot 刷掉)。
- **部署**:git push 到 main → GitHub Pages 自动发布(仓库 public,root 部署)。
- **关卡命名**:CEFR 标签(A1.1/A1.2/B1.1…),不加文字描述。

## 用户偏好(观察总结,别违背)

- 手机竖屏是第一界面;词必须完整显示且尽量大。
- 提示要"淡"(低饱和颜色、微妙形状差),不承诺无脑玩法;反对打断体验的弹层(教学横幅必须不挡棋盘)。
- 图标用与插画同风格的代码绘制 SVG,不用 emoji。
- 按钮、触控目标要大;底部不贴屏幕边缘(iOS 误触)。
- 难度宁易勿难:开局保底 ≥2 解、无步数限制(计分制)、闲置自动提示。

## 当前状态(2026-10-01)

- 版本 v0.8(见 DEVLOG):**85 词 / 17 关**(A1 3 + A2 6 + B1 8,每关 5 词)、**无尽模式 + 每日挑战**(通过第 1 关解锁,已收集词池抽样 6 词;每日=日期种子+180s 倒计时+当日最佳;无尽=离场记最佳)、计分+连击(教学横幅 10s 倒计时)、三区 HUD(宽度 JS 与棋盘同步)、新词插画为首字母纹章 fallback(深浅主题感知)。
- 已部署:https://channontian.github.io/gamified-learning/(push 即自动更新)。
- **下一波(用户已定)**:四消分支——从 A1 开始、每关 3 词(3×4=12 类型/36 格),与三消做对照;之后手绘插画补齐、B2/C1 词池。
- v0.8 增量:73 词场景组合插画(姿态+道具表)、英语界面、图鉴 CEFR 折叠、全模式教学横幅、提示等待滑杆(默认 12s=横幅+2s)、继续游戏按完成记录。
- 已否决/搁置:原形百搭块(易混淆)。

## 已踩过的坑(别再踩)

- 补牌生成的 tile 必须 `boardEl.appendChild`(曾导致棋盘隐形减员)。
- 首次解锁判断用全局 `save.collected`,不是本局 `collectedRun`。
- 任何 UI 显示触发**不要用 requestAnimationFrame**(后台标签页不触发 → 卡死),用 `void el.offsetWidth` 强制重流。
- 图鉴里打开的卡片 z-index(70)必须高于图鉴(50),否则关不掉。
- 引擎是 COLS×ROWS 非方形网格,遍历边界别写死同一个常量。
