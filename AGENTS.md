# AGENTS.md — 项目记忆(供 AI 会话与协作者快速上手)

> 语言游戏合集 `gamified-learning` 的工作约定与当前状态。改代码前先读这里;做完改动要同步更新 `docs/DEVLOG.md` 和本文件的"当前状态"。

## 项目是什么

用游戏机制**真正承载学习内容**的语言学习游戏合集(拒绝"消消乐+贴皮")。三个产品(**2026-10-02 起任务线主线在 link-match**,tile-match 冻结;2026-10-03 加四消原型,**2026-10-04 四消试玩否决,玩法回归三消**):

- **link-match(主线)**:动词原形↔变位连连看——匹配判定=把原形和它的变位连到一起,检索练习即玩法。
- **tile-match(冻结于 v0.87)**:荷兰语强变化动词三消。匹配判定=同一动词的"单数过去式+复数过去式+过去分词"三种形式各≥1、3+ 个连成一线。
- **four-match(已否掉)**:四消对照分支,原型 v0.2 保留在线不再迭代——用户试玩:四连太难拼出、频繁重置(复盘见 DEVLOG)。

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
├── link-match/
│   ├── index.html      ← 第二个产品:动词连连看(独立,不依赖 tile-match)
│   ├── README.md       ← 游戏说明
│   └── test/
│       └── path-engine.test.mjs ← 路径引擎回归(零依赖,node 直跑;改引擎必跑)
├── four-match/
│   ├── index.html      ← 第三个产品:四消原型(原形+三变位同消;存档 nlm4.*、钩子 NLM4)
│   └── README.md       ← 游戏说明
└── LICENSE             ← PolyForm Noncommercial 1.0.0(公开但非商业)
```

- **单文件铁律**:游戏全部内联(HTML/CSS/JS/插画 SVG),不加构建、不加外部资源。
- **界面语言**:默认全荷兰语(`lang="nl"`),所有文案走 `I18N` 词典 + `data-i18n`;中文是设置里的可选项。与用户沟通用中文。
- **存档**:tile-match=`nlm3.prototype.v1`;link-match=`linkmatch.v1`,结构 `{lUnlocked, done{}, best{}(关卡+Oneindig+Survival), dailyBest{日期:分}, dailyDone, counts{}, style, lvOrder, settings{...}}`;four-match=`nlm4.prototype.v1`(轻量 `{unlocked, best{}, done{}, collected[]}`);改结构要保持向后兼容(merge 默认值);改关卡顺序要像 v1.5 一样做映射迁移。
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
- **任务线转向(2026-10-02 用户拍板)**:只做 link-match;tile-match 冻结于 v0.87(在线可用,不再迭代)。下一波=link-match 内容铺量(B2/C1 词池、关卡扩容、插画补齐)+ 候选模式(每日/无尽、排行榜接口、PWA 等)待拍板;四消对照分支封存(见 ROADMAP)。
- **link-match(v0.1,2026-10-02)**:独立连连看产品——原形↔单一变位的经典连连看(≤2 折角+外圈路径),9 关(A1/A2/B1 × sg/pl/pp),每关 7 词×2 对=14 对;复用 tile-match 的数据/插画/i18n(拷贝式复用,解耦)。
- ⚠️ **双产品同步维护点**:VERBS 词形/释义、插画元素库(person/PROP/SCENES)、i18n 框架在两个文件中是拷贝——改动需同步 tile-match/index.html 与 link-match/index.html。
- v0.8 增量:73 词场景组合插画(姿态+道具表)、英语界面、图鉴 CEFR 折叠、全模式教学横幅、提示等待滑杆(默认 12s=横幅+2s)、继续游戏按完成记录。
- v0.85 增量:菜单会话保活——打开菜单不销毁对局,顶部"回到当前游戏"按钮(Terug naar spel);"继续游戏"=下一未完成关;无尽/每日最佳分实时入库。
- v0.87 增量:每日挑战限每日一次(save.dailyDone,完成后菜单灰显+✓,结算弹窗去掉"再来一次");朗读代数令牌(speechGen)——新横幅打断旧朗读链,朗读永远跟随最新教学横幅,iOS 上首词延迟 60ms 开口;图鉴 CEFR 折叠改纵向全宽手风琴目录+每档已收集计数。
- **link-match v1.2(2026-10-02)**:修复路径判定坐标系双重偏移(有路被阻/假提示/连线画偏)与折线丢失起点;回归测试固化于 link-match/test/。同窗口补发了曾滞留工作区的 tile-match v0.87 代码(42e1d9c)。
- **link-match v1.3(2026-10-02)**:无尽(清盘连发、连击跨盘、最佳实时入库)+ 每日挑战(180s、日期种子、每日一次带 ✓);词形挂到每块(t.f),`syncSize` 按盘面量字号;QA 钩子增 `mode/dailyLeft/save()/forceTimeUp()`。
- **link-match v1.4(2026-10-02)**:关卡 9→18(每档两轮,第二轮换词);横幅时长进设置(5-30s,默认 10,兼连击窗口)。
- **four-match v0.1(2026-10-03)**:四消独立原型上线 https://channontian.github.io/gamified-learning/four-match/ ——四形同消、A1 3 关、每关 3 词、6×6、12 类型;玩法观察(偏松、字号偏小)记 DEVLOG,待试玩定夺后再决定是否继续投入。
- **four-match v0.2(2026-10-04,用户试玩反馈三连)**:原形块胶囊+**粗下划线**;棋盘 6×6→**5×7**(块更大);内容铺 **99 词/33 关(A1–B2)**(B1 补 bevelen/buigen,B2 新增 12 词),菜单按档分节;布盘改**只禁 4 连**(3 连=差一块的好局面)+同动词聚簇错开形式(否则 12 类型/35 格凑不出 ≥2 解,实测验证);顺修 tile-match zwijgen sg "zweg"→"zweeg"(冻结产品一字数据纠错)。
- **four-match 否决(2026-10-04,用户试玩)**:盘面四连太难自然拼出、频繁死局重排("一直在重置")——路线暂时否掉,**玩法回归三消**;原型保留在线不再迭代,中盘供给机制的教训记 DEVLOG。
- **link-match v1.5(2026-10-04,试玩六连反馈)**:**108 词 / 51 关**——形式分组(每档内先 sg 各轮→pl→pp,轮数=⌈池/7⌉),TIERS 改按词名定义(索引区间易碎,勿回退);菜单 "Volgend level"(调研:"level" 是荷兰语游戏标准用语,"niveau" 指难度/CEFR);消除手感(描线 dasharray+transition、端点粒子、得分弹字、flash/pop、双音阶音效);**生存模式**(每对间 15s 续命、超时结束、best["Survival"]、≤5s 红脉冲);盘下**词行 wordRow**(7 词 chips 点击朗读、消除划线、<600px 高自动隐藏);旧档迁移 lvOrder="v2"(旧序→新序 done/best 映射搬家)。钩子增 `forceSurvivalEnd()/survivalLeft`。
- **link-match v1.6(2026-10-04,试玩三连)**:关卡名编号化 **A1.1–B1.24**(lv.num)+形式标注,轮次角标取消;attemptPair **全同步非阻塞**(状态即落账、动画/收尾走 setTimeout、游玩中不置 busy)——改它必须保留残块 alive 守卫与 drawPath 按节点移除(防背靠背连对互吞);选中不再立即点亮同动词块,闲置 hintWait 后才提示(选中→peer 点亮 / 未选中→整对;=0 全关)。
- **link-match v1.7(2026-10-04,竞品调研试点)**:试验关 **A1.1/A1.2**(`TRIAL_LEVELS`)落地 P1 连击里程碑(大字感叹+盘面波纹+和弦)/P3 交互式首教学(3 步演示,demoDone 一次)/P5 分数飞行/P6 清盘彩带;其余关卡原样供对比。**两个实现坑**:演示点击拦截必须在 busy 守卫前(演示靠 busy=true 锁闲置提示);demoClick 参数不可叫 `t`(遮蔽全局 i18n 函数 → "t is not a function"、回调不排上)。全量铺开待用户试玩定夺。
- 已否决/搁置:原形百搭块(易混淆);四消判定(match-4,中盘供给不足,2026-10-04 用户否掉)。
- **link-match v1.9(2026-10-04,试玩 13 项)**:HUD 语境化(短关卡名+中槽按模式切进度/倒计时/最佳分)、词块 weight500+×0.93、菜单 ✕/点外回游戏/图标翻转、分数胶囊、emoji→手绘 SVG(色块偏移+墨线)、下划线一笔、庆祝进分数槽、词行删除、盘面 **4×9=18 对**(轮数=⌈池/9⌉,42 关,迁移 lvOrder v3)、连线虚线+边中点+lit 边框、--hot 统一橙红、朗读关→确认音、插画 grugRough 滤镜(feTurbulence+displacement,零重绘手绘化)。
- **link-match v1.8(2026-10-04)**:**Grug 手作主题**(用户从四方向效果图选定 D)——`settings.theme` 默认 "grug",Papier 可切回;CSS 在 `body.theme-grug:not(.dark)` 下覆盖(暗色变量级联在后不破坏);tile 歪斜走 applyTileRotations(inline transform,与 scale/translate 动画属性不冲突);字号测量按主题选字体(手写体更宽)。效果图:docs/mockups/aesthetics.html。

## 已踩过的坑(别再踩)

- **交叉消除去重**:行/列连段交叉共享同一块时,消除列表必须按格去重,否则二次置 null 后 t.el 崩、busy 卡死(tile-match v0.86 修复)。
- **link-match 路径坐标约定(v1.2 坑)**:`findPathOcc(occ, r1, c1, r2, c2)` 收 **0 基棋盘坐标**,内部自己 +1 转外圈;调用方**禁止再 +1**(v1.1 双重偏移 → 有路判不能连/假提示/连线画偏一格,QA bot 因相邻对在偏移系也可连而漏测)。折线回溯的根父指针(dir=-1)处要显式 push 起点 A。改引擎必跑 `node link-match/test/path-engine.test.mjs`(异构参照实现对照+折线合法性+全消链路)。
- **drawPath 端点方向判定也是 [r,c](v1.9 坑,用户发现)**:`edge()` 里列差才是水平、行差才是垂直(`dx=nxt[1]-pt[1]`),轴序颠倒 → 端点从错误一侧出边、连线出现斜线段。复测办法:连对后导出 `#pathSvg polyline` points,断言相邻点至少共一轴(diag=false)。
- **异步链路异常会卡死 busy**:await 链外层 try/finally 复位 busy,全局错误捕获(window.__errors)留痕;showResult/updateHUD 等「先置空后使用」的次序错误用 NLM3.errors() 排查。

- 补牌生成的 tile 必须 `boardEl.appendChild`(曾导致棋盘隐形减员)。
- 首次解锁判断用全局 `save.collected`,不是本局 `collectedRun`。
- 任何 UI 显示触发**不要用 requestAnimationFrame**(后台标签页不触发 → 卡死),用 `void el.offsetWidth` 强制重流。
- 图鉴里打开的卡片 z-index(70)必须高于图鉴(50),否则关不掉。
- 引擎是 COLS×ROWS 非方形网格,遍历边界别写死同一个常量。
- **QA 钩子细节**:`NLM3/NLM4.findMove()` 返回 `{a:[r,c], b:[r,c]}`(不是 r1/c1/r2/c2),bot 调 `swap(mv.a[0],mv.a[1],mv.b[0],mv.b[1])`;种子存档若未收集本关词,消除会弹首解锁卡并挂起 `await swap`(卡片等点击)——QA 种子直接全词收集最省事。
- **隐藏标签页定时器节流**:Chrome 后台页 setTimeout 会被钳到 ~1s,朗读链/计时类自动化要放长等待或插桩看时间戳;系测试环境现象,与产品无关。
