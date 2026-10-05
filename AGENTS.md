# AGENTS.md — 项目记忆(供 AI 会话与协作者快速上手)

> 语言游戏合集 `gamified-learning` 的工作约定与当前状态。改代码前先读这里;做完改动要同步更新 `docs/DEVLOG.md` 和本文件的"当前状态"。

## 项目是什么

用游戏机制**真正承载学习内容**的语言学习游戏合集(拒绝"消消乐+贴皮")。三个产品(**2026-10-02 起任务线主线在 link-match**,tile-match 冻结;2026-10-03 加四消原型,**2026-10-04 四消试玩否决,玩法回归三消**):

- **link-match(主线)**:动词原形↔变位连连看——匹配判定=把原形和它的变位连到一起,检索练习即玩法。
- **tile-match(功能冻结于 v0.87;2026-10-04 一次性解冻升 v0.9 美术)**:荷兰语强变化动词三消。匹配判定=同一动词的"单数过去式+复数过去式+过去分词"三种形式各≥1、3+ 个连成一线。
- **four-match(已否掉)**:四消对照分支,原型 v0.2 保留在线不再迭代——用户试玩:四连太难拼出、频繁重置(复盘见 DEVLOG)。

## 结构与约定

```
gamified-learning/
├── index.html          ← 公开落地页(Koppelen 总首页:游戏入口+隐私/条款链接;Google OAuth 发布验证依赖它)
├── AGENTS.md           ← 本文件(项目记忆)
├── docs/
│   ├── DESIGN.md       ← 设计决策与依据(改玩法前必读)
│   ├── DEVLOG.md       ← 按日期的迭代日志(每次改动追加)
│   └── ROADMAP.md      ← 路线图(优先级用户定)
├── wrangler.toml       ← Cloudflare Workers 配置(静态资产+D1 linkmatch-db+GOOGLE_CLIENT_ID vars;name 必须=项目名)
├── worker.js           ← Workers 入口:/api/* 路由到 handlers,其余路径走静态资产
├── .assetsignore       ← Workers 资产排除清单(源码/文档不对外)
├── schema.sql          ← 云端建表 users/saves/sessions/daily_scores(幂等;存量库改列要手动 ALTER,见 DEVLOG)
├── functions/api/      ← API handlers(signup/login/logout/load/save/profile/account/score/leaderboard/auth/google+_lib)
├── privacy-policy/     ← 隐私政策页(nl/en/zh;Google OAuth 同意屏幕引用)
├── terms/              ← 服务条款页(nl/en/zh)
├── tile-match/
│   ├── index.html      ← 游戏本体:单文件、零依赖(原生 JS+CSS)
│   └── README.md       ← 游戏说明
├── link-match/
│   ├── index.html      ← 完整版:动词连连看(独立,不依赖 tile-match)
│   ├── README.md       ← 游戏说明
│   └── test/
│       └── path-engine.test.mjs ← 路径引擎回归(零依赖,node 直跑;改引擎必跑)
├── four-match/
│   ├── index.html      ← 四消原型(已否决留档;存档 nlm4.*、钩子 NLM4)
│   └── README.md       ← 游戏说明
└── LICENSE             ← PolyForm Noncommercial 1.0.0(公开但非商业)
```

- **单文件铁律**:游戏全部内联(HTML/CSS/JS/插画 SVG),不加构建、不加外部资源。
- **界面语言**:默认全荷兰语(`lang="nl"`),所有文案走 `I18N` 词典 + `data-i18n`;中文是设置里的可选项。与用户沟通用中文。
- **存档**:tile-match=`nlm3.prototype.v1`,结构 `{unlocked, collected[], style, counts{}, best{}, dailyBest{}, dailyDone, done{}, lastLevel, settings{...含 theme}}`;link-match=`linkmatch.v1`,结构 `{lUnlocked, done{}, best{}(关卡+Oneindig+Survival), dailyBest{日期:分}, dailyDone, counts{}, style, lvOrder, settings{...}}`;four-match=`nlm4.prototype.v1`(轻量 `{unlocked, best{}, done{}, collected[]}`);demo 云登录态=`linkmatchdemo.auth`(`{token, username}`,云端整包档存 Cloudflare D1);改结构要保持向后兼容(merge 默认值+云端 cloudMerge:数值取大/布尔取或/数组并集/对象递归/其余本地优先);改关卡顺序要像 v1.5 一样做映射迁移。
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

## 当前状态(2026-10-05)

- **link-match-demo v1.19(2026-10-05,档案页+显示名+排行榜+落地页)**:菜单 Profiel 档案页(显示名可改**不查重**、登录态区:未登录三种登录/已登录 Uitloggen+删除账号两步确认,DELETE /api/account 连带删云端数据);显示名=形容词32×名词32 荷兰语随机组合,登录用户按 user id 确定性生成存 users.display_name(**前后端各一份词库,改动需同步**),游客本地 save.displayName;每日排行榜 `daily_scores(date,user_id,score)` 服务器按 UTC 分桶自然翻日,POST /api/score 保留当日最高、GET /api/leaderboard top50+自己名次;**游客可看不可上榜**,榜单内联登录入口,登录/启动自动补报当天成绩(游客分登录后当场上榜,save.lbSent 去重);每日挑战介绍弹窗加 Klassement 按钮;根 index.html 改公开落地页(Koppelen+Link Match 别名,修 Google 发布验证三连拒)。Google 侧待办:同意屏幕应用名改 Koppelen、homepage 改根路径、Search Console 验证+24h 重试。详见 DEVLOG。

- **link-match-demo v1.18(2026-10-05,欢迎页+Google 登录)**:首次进入未登录的新玩家全屏欢迎页(登录优先:用户名/密码+Inloggen/Nieuw account、Met Google doorgaan、游客兜底"Direct als gast spelen";老档/已登录/选过游客永不弹,welcomeDone 存档标记);Google OAuth 授权码流程(`functions/api/auth/google.js`+`callback.js`,users.google_sub 列,**存量远程库需 ALTER TABLE users ADD COLUMN google_sub TEXT**);GOOGLE_CLIENT_ID/SECRET 走 Dashboard Variables and Secrets,未配置时接口 501;cloudDoAuth 重构为 (isNew,uEl,pEl,after) 供设置面板+欢迎页共用。待办:用户建 Google OAuth 客户端+配 secrets+远程加列后,线上实测 Google 流程。详见 DEVLOG。

- 版本 v0.8(见 DEVLOG):**85 词 / 17 关**(A1 3 + A2 6 + B1 8,每关 5 词)、**无尽模式 + 每日挑战**(通过第 1 关解锁,已收集词池抽样 6 词;每日=日期种子+180s 倒计时+当日最佳;无尽=离场记最佳)、计分+连击(教学横幅 10s 倒计时)、三区 HUD(宽度 JS 与棋盘同步)、新词插画为首字母纹章 fallback(深浅主题感知)。
- **正式部署(2026-10-05 起)**:**https://play.channon-tian.com/**(Cloudflare Workers 自定义域名)= `gamified-learning.channon-tian.workers.dev`,push main 自动构建(`npx wrangler deploy`);后端=`worker.js`+`functions/api/`+D1 `linkmatch-db`。GitHub Pages 为同仓静态镜像(无后端,登录降级提示,不影响游玩)。
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
- **⚠️ 主版冻结(2026-10-01 用户拍板)**:link-match 主版停止改动,新一轮试玩全部走 **link-match-demo**;demo 定稿发布后,再把通用修复/改进同步回主版(同步时逐项过一遍,demo 专属词表/关卡结构不带回去)。
- **✅ Cloudflare 里程碑完成(2026-10-05,v1.17–v1.19 九个 PR 全部合并上线)**:登录(用户名密码+Google OAuth 已 Publish)+云存档+欢迎页+档案页/显示名+每日排行榜+落地页+域名。**此后任何更新不得让玩家进度清零**(增量迁移纪律不变)。剩余候选(密码找回/账号关联/榜单防刷/PWA/内容铺量)见 ROADMAP"下一波"。
- **link-match-demo v1.17(2026-10-05,Cloud 登录+云存档)**:`functions/api/` 五接口(signup/login/logout/load/save;PBKDF2-SHA256 1 万次迭代=免费档 10ms CPU 预算、32B token 会话表、常量时间比较)+ `schema.sql` 三表(远程 D1 已建)+ `wrangler.toml`。前端仅 demo:设置面板底部 Cloudopslag 区块(登录/注册、立即同步/退出、同步状态角标,i18n 三语);**localStorage 仍是主存档**,persist()→4s 去抖上传、hidden 时 keepalive 补发、失败静默离线照玩;登录/启动拉云端 cloudMerge 合并后自动回推;401 静默登出;`NLM3.cloud()` 钩子。**部署形态=新版 Workers 项目(静态资产+worker.js 路由;用户建的项目是 Workers 而非 Pages,Pages 格式配置会 0s 构建失败)**:`wrangler.toml` 用 Workers 格式([assets]+run_worker_first=["/api/*"]),`worker.js` 五路由复用 functions/api/ 实现,`.assetsignore` 排除源码/文档;D1 绑定经 `wrangler deploy` 自动生效。**本地 dev=`npx wrangler dev --persist-to 仓库外目录`(状态目录在仓库内会被资产监视→无限重载)**。待办:核对 Cloudflare Workers 构建产物(deploy 命令=`npx wrangler deploy`)+ 线上真实档回归。QA:curl 10 项+浏览器全链路(注册/自动同步/刷新保持/清档云恢复/中文)全绿零错误,详见 DEVLOG。
- **link-match-demo 试玩 UX 追加二(2026-10-01)**:词卡弹窗两段式"点击查看释义"拆除(cardTip/card.tip/gloss-open 全清,释义常显、点卡即关——首修只删了列表行 title,弹窗内残留被用户抓到);盘卡间隙(slot 86/94+banner top:10px,实测 26px,卡体不变)。
- **link-match-demo 试玩 UX 六项(2026-10-01,截图反馈)**:图鉴(去"点击查看"提示/开卡朗读四形态 `speakWords` 通用化/✕ 关闭钮);词卡槽 76/84px+**出卡实测缩字号**(中文+is begonnen 双词都放得下,行距 1.2);**死局检测补失败尝试路径**(`reshuffleIfStuck`:成功/失败后都查,500ms 复查——原先点不出对永不洗牌会卡死);`.combo-tag` 固定 36px 等高;顺修 pp null 回归(采样跳过无 pp 词+三处兜底)。QA:18 关+每日/无尽各 3 盘零错误,视觉验收三图。
- **link-match-demo v1.16(2026-10-01,追加四项;仅 demo)**:①**is+perfectum**——词表标 'is' 的 9 词(zijn/gaan/komen/beginnen/blijven/lopen/rijden/worden/vergeten)显示/朗读 "is + 分词"(`PP_ZIJN`+`ppLabel`,磁贴/词卡/图鉴/朗读同源;syncSize pp 按**最长单词**测宽+双行高度约束,叶子块行距 1.0;顺修图鉴 zullen "null"→"-");②词卡模块间隙 16px+释义虚线分隔;③关卡按钮按词型带 k-sg/k-pl/k-pp 类,圆角镜像磁贴;④分组标题改词表原文 band.*:"Imperfectum (enk.)/(mv.)/Perfectum"(legend.* 保留)。QA:bot 149 对全清零错误+视觉验收两图。
- **link-match-demo v1.15(2026-10-01,发布前布局五项;仅改 demo,主版冻结)**:①模式介绍弹窗点"开始"自动关主菜单;②**统一词卡组件 `wordCardHTML`**——横幅/图鉴/结算共用一种卡(四形态+原形弧线+当前词型高亮+定宽 80px 可换行释义),横幅即图鉴卡不再维护两套,闯关槽 72px 大卡(挑战 64px);③顶栏**固定屏幕顶部下一格**(safe-area+10px,三列 grid、元素等高 36px 纵向居中),关卡数贴菜单按钮右侧、进度条中/分数右;④提示/词典 **dock 固定屏幕底部上一格**(10px 空隙),词卡槽(bannerSlot)移出 dock 紧贴桌盘文档流——body `justify-content:center` 遗留会造成顶栏与桌盘 ~200px 空隙,已改 flex-start;⑤**k-pp 弃 clip-path 改叶子形**(纯 `border-radius` 对角大圆角,描边/选中虚线框原生跟随——切角+补线、drop-shadow 两轮修补失败后的换形拍板);syncSize 按槽位+dock+底隙扣高度。QA:bot 149 对 18 关全清零错误、布局几何断言全过、介绍弹窗关菜单/词卡统一/收起态贴槽底断言、视觉验收三图。
- **link-match v1.14(2026-10-05,五轮反馈十项;demo+主版同步)**:**幽灵块致命坑**——buildPairsFrom 按全部空位 forEach 放块,块数<空位时越界写 `{...undefined}`={} 幽灵块(truthy)→ 渲染崩/盘面残/计数 stale(9 词关恰好 18=18 不触发,8 词关必炸);修复=洗牌后 pos.length=tiles.length,兜底 tiles.forEach。--bdur 一直没设(动画默认 10s≠15s 窗口);k-pp 选中=随形 inset accent 环+剪影光晕(outline/drop-shadow 观感均不对);菜单加语言行(nl/中文/en)、模式按钮去副标题改右侧分数+虚线名+title 气泡、**点模式先弹介绍弹窗(说明+最高分+开始)**;每日去 0/18 胶囊(levels 保留);词卡放大(闯关槽 64px/18px 字)。demo 专属:关卡列表按三形态分组、图鉴修好(NIG 四组)+菜单入口。
- **link-match-demo(2026-10-05,用户供 NIG I–IV 词表包)**:独立单文件,词表锁定 Taalhuis 50 词(43 复用主库 + 7 新词 kijken/worden/liegen/zullen/drijven/lachen/laten,形式取词表原文、hue 自动、专属小插画);18 关纯序号 1–18(无 A1.x),每形态独立均衡切块(sg/pl [9,9,8,8,8,8]、pp 49 词 [9,8,8,8,8,8]),顺序切片每词每形式恰好一关;**zullen 无 pp** → 分词轮与四形态卡过滤 null;collectedPool 改从 LINK_LEVELS 取词(TIERS 不存在);存档键 linkmatchdemo.v1;demo QA 用 `?bust` 打开 `/link-match-demo/`。
- **link-match v1.13(2026-10-05,四轮反馈六项)**:**四形态单词卡**(横幅+图鉴卡统一展示 原形/单过/复过/分词;当前盘词型加粗高亮、其余灰;原形同字号+同款下划线,横幅高亮取 a.f);下划线换带小环手绘弧线(磁贴两主题+卡片 .swu 同款,Papier 退化色条);k-pp 选中 outline 被 clip 裁坏 → 随形 drop-shadow 光晕;下一关图标 scaleY 对称翻转无效 → 改画右向"|→";横幅/提示等待默认统一 15s(**旧档等于旧默认值 10/12 的迁移到 15,自定义保留**);闯关 dock 竖排+横幅固定槽位 56px(body.in-levels,startLink/dealModeBoard 切换;模式保持覆盖式)。
- **link-match v1.12(2026-10-04,三轮反馈)**:**闯关改 4×5=20 格盘**——9 词×1 对(同屏零重复)+开局 2 随机缺口(重排天然保留);PAIR_TOTAL 改动态(发牌按实块数:闯关 0/9、模式 0/18);ROWS 改 let(闯关 5/模式 9);**simulateSolvable 原按总格数计数,有缺口永不判可解** → 按实块计数;buildBoardDOM/块收集加缺口守卫;buildPairsFrom(picks,per,gapCount);模式保持 4×9(9 词×2 对);下划线居中(left 32%)。回归:42/42 关+四模式+新手演示(4×5)全绿。
- **link-match v1.11(2026-10-04,发试玩前收官)**:**插画 108 词全覆盖**(补 23 场景+新道具 bubbleBang/bubbleShout/waves/bird/bowArrow;顺修 SCENES 引用但 PROP 缺失的 11 个道具别名与 `coinBehind` 裸调 `coinS` 的 throw);**TTS 终审=环境定性**(内嵌测试窗语音引擎瘫死:入队永不 onstart 亦无 error,页面无责;代码加 1.3s 无声 watchdog → toast 引导换浏览器);k-pp 接缝二修(切角处圆角归零+斜条压缝 2.5%);**手绘暗色补完**(--grug-ink 双色变量:暗色 face 浅墨圈/歪斜圆角/浅墨手绘下划线);下划线缩短至左锚 36%(两主题);主题改名 grug→Sketch/手绘、papier→Post-it/便签(存档值不变,**设置面板 seg 标签曾硬编码 → 改走 i18n**);全量回归:同步 bot 42/42 关 + 四模式零错误。
- **link-match v1.10(2026-10-04,二轮反馈七项)**:朗读修复(空队列不 cancel、cancel 后 70ms 延迟开口、speakGen 代数令牌、iOS 首手势静音解锁——v1.9 起朗读被 Chrome cancel→speak 竞态吞掉,用户报"还是没有");模式 HUD 重排(模式下隐藏 lvlTag,body.mode-hud 紧凑档,修倒计时换行);模式分数条 `.score-bar`(开局捕获 best 为右端目标、得分填充、record 态;levels 仍分数胶囊);**一屏一词型**(sampleModeVerbs 整盘单一形式、换盘不重复、modeFormState 各 start* 重置保每日种子确定);k-pp 切角补斜边(face 恒 4:3 → 斜边恒 36.87°,::before/::after 墨条);syncSize 逐块测字(长词不再拖小全板);.hico inline-block(修结算图标独占一行);横幅 collapseBanner(手动点掉只收词面不断连击,自然到期仍清)。
- **link-match v1.9(2026-10-04,试玩 13 项)**:HUD 语境化(短关卡名+中槽按模式切进度/倒计时/最佳分)、词块 weight500+×0.93、菜单 ✕/点外回游戏/图标翻转、分数胶囊、emoji→手绘 SVG(色块偏移+墨线)、下划线一笔、庆祝进分数槽、词行删除、盘面 **4×9=18 对**(轮数=⌈池/9⌉,42 关,迁移 lvOrder v3)、连线虚线+边中点+lit 边框、--hot 统一橙红、朗读关→确认音、插画 grugRough 滤镜(feTurbulence+displacement,零重绘手绘化)。
- **link-match v1.8(2026-10-04)**:**Grug 手作主题**(用户从四方向效果图选定 D)——`settings.theme` 默认 "grug",Papier 可切回;CSS 在 `body.theme-grug:not(.dark)` 下覆盖(暗色变量级联在后不破坏);tile 歪斜走 applyTileRotations(inline transform,与 scale/translate 动画属性不冲突);字号测量按主题选字体(手写体更宽)。效果图:docs/mockups/aesthetics.html。
- **tile-match v0.9(2026-10-04,一次性解冻做美术,功能仍冻结)**:移植 link-match v1.8/v1.9 风格——Grug 主题(Thema 设置,Grug 默认/Papier 切回)+ 字号按主题手写字体测量 ×0.93/字重500 + emoji 全清换手绘 SVG(ICO_STAR/FLAME/CLOCK/TARGET)+ 分数真胶囊(**渐变字会吞 SVG 描边**,两主题都改实底)+ grugRough 滤镜 + --hot + 菜单 ✕/点外 + TTS=0 确认音;**与 link-match 实现差异:三消词块移动走 transform translate,歪斜必须合并进同一 transform(tileRot),不能独立 rotate**;hint 开关作用域到主题圆角/色染(no-shape/no-color);顺修弹窗后兜底自愈 pickRefillTile 读 level.verbs 崩(加空回退)。

## 已踩过的坑(别再踩)

## 云端/部署类(v1.17–v1.19 新增)

- **Cloudflare 项目类型**:用户在 Dashboard 建的是**新版 Workers 项目**(现在的默认),不是经典 Pages——Pages 专用配置(`pages_build_output_dir`)在 Workers 项目下 **0 秒构建失败**;纯静态 Worker 也不能加绑定("Bindings cannot be added to a Worker that only has static assets")。现状:Workers 格式(assets+worker.js 路由),别改回 Pages。
- **`wrangler dev` 状态目录必须在仓库外**(`--persist-to /tmp/xxx`):默认 `.wrangler/` 在资产目录 `.` 内,dev 自己写状态触发自己重载→**无限 reload 循环**。附带好处:--persist-to 后 D1 与 `d1 execute --local` 同实例,不存在 pages dev 时代的双实例坑。
- **wrangler 登录态会过期/切账号**:报"In a non-interactive environment..."(要 CLOUDFLARE_API_TOKEN)或 7403 "account is not valid"→ 让用户跑一次 `npx wrangler login`(浏览器授权);自动化环境可设 CLOUDFLARE_API_TOKEN。
- **内联 `<script>` 给 `localStorage.setItem` 传值必须是字符串字面量**:传对象会隐式 `toString()` 存成 `"[object Object]"`→启动解析失败→登录墙死循环(Google 回调致命 bug,PR #7)。正确写法:`JSON.stringify(JSON.stringify(obj))` + `<>&`/行分隔符 unicode 转义。用户名密码登录走前端 JSON.stringify 不经过这条路,所以只在 OAuth 出现——**修登录 bug 先分清走哪条路径**。
- **排行榜去重不能按"每天一次"闸**:会把当天后来打出的更高分永久挡在服务器外(用户实测 5235 vs 榜上 15)。正确姿势:记录"已上报分数",本地最高>已上报就补报(服务器 `MAX()` 幂等,重复无害);启动时也补报一次,存量缺口自动修正。
- **前端/后端同源函数是拷贝**:`genDisplayName`(显示名词库)在 `functions/api/_lib.js` 和 demo 前端各一份——**改动必须两边同步**(漏一边=前端启动 ReferenceError)。
- **Google OAuth 三个硬知识**:①`workers.dev`/`github.io`/免费域名都在公共后缀名单,**无法通过 Google 域名验证**——发布(Publish)必须有自购域名+Search Console 验证+公开的 privacy/terms 页;②Testing 模式 Test users 上限 100 人,名单外 "Access blocked";③Auth Platform 的 metrics 面板有 1–2 天延迟,以 D1 数据为准。
- **清理测试账号必须精确圈定**:DELETE 的 WHERE 里只放测试用户名;曾险些误伤真实用户数据(自查后手动补了 display_name)——动远程库前先 SELECT 确认影响行。
- **QA 别留在本地服务器页面**:测完 `wrangler dev` 要停+提醒关掉 127.0.0.1 标签页——用户在死掉的本地页点登录("停留在登录界面"),排查半天其实是服务器没起。另外 Google 凭据在本地要用 `--var` 假值,真值只在生产 Secret。

## 引擎与 QA 类(v1.17 之前)

- **交叉消除去重**:行/列连段交叉共享同一块时,消除列表必须按格去重,否则二次置 null 后 t.el 崩、busy 卡死(tile-match v0.86 修复)。
- **link-match 路径坐标约定(v1.2 坑)**:`findPathOcc(occ, r1, c1, r2, c2)` 收 **0 基棋盘坐标**,内部自己 +1 转外圈;调用方**禁止再 +1**(v1.1 双重偏移 → 有路判不能连/假提示/连线画偏一格,QA bot 因相邻对在偏移系也可连而漏测)。折线回溯的根父指针(dir=-1)处要显式 push 起点 A。改引擎必跑 `node link-match/test/path-engine.test.mjs`(异构参照实现对照+折线合法性+全消链路)。
- **drawPath 端点方向判定也是 [r,c](v1.9 坑,用户发现)**:`edge()` 里列差才是水平、行差才是垂直(`dx=nxt[1]-pt[1]`),轴序颠倒 → 端点从错误一侧出边、连线出现斜线段。复测办法:连对后导出 `#pathSvg polyline` points,断言相邻点至少共一轴(diag=false)。
- **异步链路异常会卡死 busy**:await 链外层 try/finally 复位 busy,全局错误捕获(window.__errors)留痕;showResult/updateHUD 等「先置空后使用」的次序错误用 NLM3.errors() 排查。
- **IAB QA 三坑(2026-10-04)**:①`browser.tabs.new()` 建的页 **reload 后视口归零**(innerWidth=0 → syncSize 算出负 tw、字号砸到 7.9px 地板),每次 reload 后必须重设 390×844 并手动 `syncSize()`;②后台/冻结页的**截图可能是旧帧**(DOM 已变、画面没刷),布局断言以 evaluate 读 DOM 为准,截图前 `void body.offsetWidth` 强制重流;③tab 句柄的 `evaluate` **不 await 异步 IIFE**(返回 Promise 序列化成 {}),载荷一律同步 IIFE 返回 `JSON.stringify(...)`;异步步骤放在 cell 层 await。

- 补牌生成的 tile 必须 `boardEl.appendChild`(曾导致棋盘隐形减员)。
- 首次解锁判断用全局 `save.collected`,不是本局 `collectedRun`。
- 任何 UI 显示触发**不要用 requestAnimationFrame**(后台标签页不触发 → 卡死),用 `void el.offsetWidth` 强制重流。
- 图鉴里打开的卡片 z-index(70)必须高于图鉴(50),否则关不掉。
- 引擎是 COLS×ROWS 非方形网格,遍历边界别写死同一个常量。
- **QA 钩子细节**:`NLM3/NLM4.findMove()` 返回 `{a:[r,c], b:[r,c]}`(不是 r1/c1/r2/c2),bot 调 `swap(mv.a[0],mv.a[1],mv.b[0],mv.b[1])`;种子存档若未收集本关词,消除会弹首解锁卡并挂起 `await swap`(卡片等点击)——QA 种子直接全词收集最省事。
- **隐藏标签页定时器节流**:Chrome 后台页 setTimeout 会被钳到 ~1s,朗读链/计时类自动化要放长等待或插桩看时间戳;系测试环境现象,与产品无关。
