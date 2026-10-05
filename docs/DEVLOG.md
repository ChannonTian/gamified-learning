# DEVLOG.md — 迭代日志

## 2026-10-05 · v1.19(link-match-demo)档案页+显示名 + 每日排行榜 + 落地页

- **档案页(菜单 Profiel 按钮)**:显示名(输入框+Opslaan,不查重——设计拍板:显示名只是昵称,身份靠账号;撞名无实际危害)+登录态区(未登录=用户名/密码+Google;已登录=Ingelogd als+Uitloggen+**Verwijder account 两步确认**,3 秒内再点才执行,服务端连带删 daily_scores/sessions/saves/users)。显示名规则:登录用户建号时按 user id 确定性生成(形容词32×名词32,存 users.display_name 新列,两设备同默认名);游客本地生成即落盘(**修:genDisplayName 曾只写后端,前端未定义启动即崩,复测捕获;两份词库需同步**);改登录用户的名走 PATCH /api/profile。
- **每日排行榜(UTC 0:00 自然翻日)**:新表 daily_scores(date,user_id,score,PK(date,user_id));POST /api/score(登录,保留当日最高,`ON CONFLICT DO UPDATE SET score=MAX(...)`)、GET /api/leaderboard(当日 top50,COALESCE(display_name,username),带 token 附自己名次);**游客可看不可上榜**(无服务器身份,匿名上榜引刷分),榜单内联"Inloggen om mee te doen"→档案页;前端:每日挑战介绍弹窗加 Klassement 按钮、结算 cloudSubmitDaily() 自动提交(save.lbSent=UTC 日期去重)、登录/启动 cloudPull 后自动补报当天成绩=**游客打的分数登录后当场上榜**。
- **落地页(根 index.html 重写)**:原 tile-match 跳转页改为公开落地页——Koppelen(+Link Match 别名文案)标题、Speel 按钮、三游戏链接、隐私/条款链接。起因:Google OAuth 发布验证三连拒(homepage 未验证/在登录墙后/应用名不匹配)。**Google 侧待办**:同意屏幕应用名改 "Koppelen"、homepage URL 改 `https://play.channon-tian.com/`、Search Console 验证域名后等 24h 重试。
- QA:后端 10 项(signup 自动显示名/GET/PATCH/分数提交+当日最高保留/榜单带 token 有 me 游客 me=null/非法分 400/超长名 400)全绿;浏览器:Profiel 按钮/游客改名存本地+toast/排行榜渲染(行+游客提示)/显示名启动崩 bug 修复复测/零错误;本地页面 200(落地页含 Koppelen、privacy-policy、terms)。远程迁移已完成(users.display_name、daily_scores)。
- 另:Google Auth Platform 指标面板 0 traffic 0 users 为正常延迟(1-2 天批量更新),以 D1 数据为准。

## 2026-10-01 · 试玩 UX 追加二(词卡弹窗提示拆除 + 盘卡间隙)

- **词卡弹窗"点击查看释义"拆除(用户实测仍在)**:上一轮只删了图鉴行的悬停提示,漏了词卡弹窗的两段式解锁(cardTip 文案→"…"→再点关)。全清:#cardTip 元素+CSS、三语 card.tip 键、gloss-open 逻辑;释义**常显**(0.65 灰度为原设计),点卡任意处即关(cardPanel.onclick=closeCard)。
- **盘卡间隙**:bannerSlot 76/84→**86/94**、#learnBanner top:0→**10px**——卡与桌盘间实测 26px(原 8px),卡体 76/84 不变;syncSize 按 slot.offsetHeight 自动适配。
- QA:bot 18 关 149 对+每日 2 盘+无尽 2 盘零错误(与 v1.18 欢迎门共存,welcomeDone 种子绕行);弹窗无提示文案/点卡即关/间隙 26px 断言;截图验收(弹窗 pass;间隙图倒计时条不可见为后台标签动画冻结伪影,DOM 3px 橙条在,先前轮次已验过渲染)。
## 2026-10-05 · v1.18(link-match-demo)欢迎页登录前置 + Google 登录

- **欢迎页(登录优先,用户拍板;Google/游客兜底)**:首次进入且未登录的新玩家全屏弹出——`welcomeNeeded(): !cloudAuth && !save.welcomeDone && done为空 && lUnlocked<=1`,老档/已登录/选过游客的永不打扰;内容=标题+副标题+语言行+用户名/密码(Inloggen/Nieuw account 主位)+Met Google doorgaan+虚线"Direct als gast spelen"兜底(注明进度仅存本机,随时可注册)。`cloudDoAuth` 重构为 `(isNew, uEl, pEl, after)` 签名,设置面板与欢迎页共用;`buildLangRow` 从 renderMenuLang 抽出供欢迎页复用(欢迎页可切三语)。`welcomeDoneNow`=welcomeDone:true+persist+关欢迎页+**openMenu()(修:不重开菜单玩家会落在空屏,复测捕获)**。NLM3 增 skipWelcome/welcomeNeeded。
- **Google OAuth(授权码流程)**:`GET /api/auth/google` 302→accounts.google.com(client_id/redirect_uri/scope=openid email profile/state)+HttpOnly SameSite=Lax state cookie(10min);`GET /api/auth/google/callback` 校验 state→code 换 token→userinfo→users 表 find-or-create(`google_sub` 唯一;用户名取邮箱前缀 ≤20 字符,撞名追加 sub 尾四位;pass_hash='google'=不可密码登录)→newSession→返回小 HTML 写 localStorage 后 location.replace 回游戏(token 不进 URL)。env.GOOGLE_CLIENT_ID/SECRET 未配置时 501 JSON 优雅降级;`</script>` 转义防注入。worker.js 增两路由。**存量库需迁移**:`ALTER TABLE users ADD COLUMN google_sub TEXT`(schema.sql 建表已含,远程/本地存量库手动执行)。
- QA:本地全错误路径(302 参数+state cookie ✓/state 不匹配拒 ✓/缺 code 拒 ✓/假 code→Google 兑换失败优雅页 ✓);浏览器 390×844:fresh 弹欢迎页 ✓、切中文即时生效 ✓、欢迎页注册→登录态+落菜单 ✓、刷新不再弹+uiLang 保持 ✓、游客→落菜单+刷新不再弹 ✓、已登录玩家(含旧 token 401 清除后)不弹 ✓;**修了一个复测捕获的 bug**:welcomeDoneNow 不重开菜单,游客/注册后落空屏。全程零错误。
- **追记(部署配置)**:GOOGLE_CLIENT_ID 以 `[vars]` 进 wrangler.toml(Cloudflare 配置同步要求;client_id 本就公开可入库),GOOGLE_CLIENT_SECRET 只存 Dashboard Secret(wrangler deploy 不动 secrets,明文 vars 以配置文件为准)。

## 2026-10-05 · v1.17(link-match-demo)Cloudflare 登录 + 云存档(下一里程碑落地)

- **后端(Cloudflare Pages + Pages Functions + D1,全免费档)**:仓库根新增 `functions/api/` 五接口(signup/login/logout/load/save)+ `_lib.js` 共享层——密码 PBKDF2-SHA256 **1 万次迭代**(免费档单请求 10ms CPU 预算,10 万次会 1102 超限)+随机盐、登录发 32B 随机 token 存 `sessions` 表、比较用常量时间异或;`schema.sql` 三表 users/saves/saves(updated_at)幂等建表,**远程与本地 D1 均已应用**;`wrangler.toml` 声明 D1 绑定(linkmatch-db,203f0b16-…)与 `pages_build_output_dir="."`。存档为整包 JSON blob 按 user_id upsert,≤200KB 校验。
- **前端(仅 demo,主版冻结)**:设置面板底部新增 **Cloudopslag 区块**——未登录:用户名/密码+Inloggen/Nieuw account;已登录:Ingelogd als + Nu synchroniseren/Uitloggen + 状态角标(✓ gesynchroniseerd/synchroniseren…/mislukt);i18n 三语 `cloud.*`/`set.cloud` 共 16 键。登录态存 `linkmatchdemo.auth`(`{token, username}`)。**localStorage 仍是唯一主存档**:persist() → 4s 去抖上传(cloudQueueSave);visibilitychange hidden 时 keepalive 补发;一切请求失败静默(fail 角标,下次 persist 自动重试)——离线照玩。登录成功/启动时 cloudPull:拉云端 → `cloudMerge` 合并(**数值取大、布尔取或、数组并集、对象递归、其余本地优先**;本地无进度的新设备不覆盖 settings/style/lvOrder——注意新设备的字符串偏好如 uiLang 也不跟随云端,属有意行为)→ persist 去抖回推;401 静默登出。`NLM3.cloud()` 钩子(auth/user/status/inFlight)。
- **⚠️ wrangler 坑(本地开发)**:`wrangler pages dev`(4.147)**不读 wrangler.toml 的 D1 绑定**——启动必须 `wrangler pages dev --port N --d1 DB=linkmatch-db`;且 flag 建的本地库与 `wrangler d1 execute --local` **不是同一本地实例**,首次要对 `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite` 重灌 schema(IF NOT EXISTS 幂等)。线上绑定以 Dashboard 项目 Settings→Bindings 为准,连接 Git 后须核对。`.gitignore` 补 `.wrangler/`。
- QA:curl 10 项全绿(注册/重复 409/用户名密码校验 400/错密码 401/正确登录/存读档往返逐字段一致/伪 token 401/logout 后原 token 失效/非法 body 400);浏览器 390×844(IAB):注册→"Ingelogd als qa_ui"、L0 skipDemo+连对→15 分→4s 后自动上传"✓ gesynchroniseerd"、刷新登录态保持+进度在、切中文文案全对且切语言触发同步、**清 localStorage 存档(保留 token)刷新→云端整档恢复**(demoDone/counts.eten 回来)、设置面板截图云区块融入手绘主题、全程 console 零错误。
- **追记(同日,部署形态改为 Workers)**:用户在 Dashboard 建的是**新版 Workers 项目**(Cloudflare 现在的默认),不是经典 Pages——`pages_build_output_dir` 格式令 Git CI 构建 **0 秒失败**(此前"Bindings cannot be added to a Worker that only has static assets"同因:纯静态 Worker 不认 Functions)。改法:`wrangler.toml` 换 Workers 格式(`main="worker.js"` + `[assets] directory="." binding=ASSETS run_worker_first=["/api/*"]`)+ 新增 `worker.js`(5 条路由复用 functions/api/ 的 handlers,签名兼容)+ `.assetsignore`(源码/文档不进资产包,游戏 HTML 全保留);**前端零改动**(同 /api/* 路径)。**本地 dev=`npx wrangler dev --persist-to 仓库外目录`**——状态目录在仓库内会被资产监视器看到→无限重载循环;--persist-to 后消失,且 D1 绑定从此与 `d1 execute --local` 同实例(/pages dev 双实例坑一并消灭)。D1 绑定经 `wrangler deploy` 自动生效,无需 Dashboard 手动加。curl 10 项在 Workers 形态全绿,资产排除验证(functions/、AGENTS.md 对外 404)。
## 2026-10-01 · 试玩 UX 六项(link-match-demo;截图反馈追加)

- **图鉴三小项**:行上"点击查看"提示移除;**开卡朗读完整四形态**(speakPair 重构为通用 `speakWords(seq)`,代数令牌/防吞逻辑不变,showCard 朗读 inf/sg/pl/is+pp);抽屉加 **✕ 关闭按钮**(#bookClose)。
- **词卡高度终修(截图1)**:槽位 64/72→**76/84px**;showLearnBanner 出卡后实测词形区 scrollHeight,超出槽高**逐级缩字号**(17/19 起步,-1 到放得下,下限 11)——中文释义+四形态(含 is begonnen 双词)任何组合都完整;wc-forms 行距 1.3→1.2。视觉验收确认顶栏等高 36px、词卡不截断。
- **死局洗牌(不止每日)**:检测原来只挂在"成功一连后"——玩家点不出对永不洗牌会卡死;抽 `reshuffleIfStuck()`:成功与**失败尝试**路径都调,500ms 复查再 toast+洗牌。注入无解盘断言 toast 通过。
- **连击框等高(截图2)**:`.combo-tag` padding 撑高→固定 **36px**(与顶栏胶囊一致)。
- **顺修 pp null 回归(bot 抓到)**:sampleModeVerbs 抽 pp 盘没排除无分词的 zullen → ppLabel 返 null → syncSize `.split` 崩、磁贴空白;修=tryPush 跳过无 pp 词(与关卡构建同规则)+ syncSize/buildBoardDOM/wordOf 三处 `ppLabel(...)||sg` 兜底。
- QA:闯关 18 关 149 对、每日连清 3 盘、无尽连清 3 盘零错误;视觉验收三图(顶栏等高/词卡自适应/图鉴抽屉)。同期 Cloudflare 登录+云存档由并行会话落地(见上条),已经 PR #1 并入 main。

## 2026-10-01 · v1.16(link-match-demo)is+perfectum + 关卡列表形状/标题 + 词卡间隙(追加四项)

- **is + perfectum(#6)**:词表 Perfectum 栏标 'is' 的 9 词(zijn/gaan/komen/beginnen/blijven/lopen/rijden/worden/vergeten;lopen/rijden 词表注 (is)**、vergeten (is)*)在游戏内显示/朗读 **"is + 分词"**(is gegaan)——`PP_ZIJN` 集合 + `ppLabel(V)`,磁贴(buildBoardDOM)、四形态卡(wordCardHTML)、图鉴行、朗读(wordOf→speakPair)同一数据源;pp 磁贴双行放得下:syncSize 改按**最长单词**测宽(is 换行)、双行时字号受高度约束(≤th×0.42)、叶子块行距 1.0。顺修图鉴 zullen 行渲染 "null" → "-"。
- **词卡间隙(2.1)**:横幅容器与 `.word-card` gap 10/12→16px,词形组行距 4px、字距 12px,释义加虚线左分隔(padding-left 12px)——插画|词形|释义三模块不再挤。
- **关卡按钮形状随词型(#7)**:renderLevelGrid 给按钮加 k-sg/k-pl/k-pp 类,CSS 镜像磁贴圆角(grug 20/16/21/15、4/7/3/6、叶子 26/6/27/5;基础主题 16px/7px/叶子 20px 4px)——菜单里看形状就知道本关练哪种词型。
- **分组标题用词表原文(#8)**:FORM_KEY 改指新 band.* 键(nl/zh/en 同文):"Imperfectum (enk.) / Imperfectum (mv.) / Perfectum",替换 legend.*(legend.* 保留未删)。
- QA:9 词 ppLabel 断言(staan/doen 不加 is、zullen 仍 null)、分组标题三行、三组按钮计算圆角=磁贴值、pp 磁贴 "is gegaan" 双行 hOK、横幅/图鉴卡 gap 16px+虚线分隔、图鉴 zullen "-"、bot 149 对全清零错误;视觉验收两图(关卡列表形状+标题、is gegaan 横幅+双行磁贴)4 倍放大确认。
- **QA 环境新坑**:超时的截图调用会留**僵尸续跑**(cell 被 abort 但 JS 继续,清理/点击在后台污染后续状态)——重截前先读状态,不行就完整重建;goto 后的 evaluate 必须等 `typeof startLink==="function"` 就绪(否则静默失败、seed 白做);screenshot 偶发 "surface preparation timed out"(3s),间隔重试即可。

## 2026-10-01 · v1.15(link-match-demo)固定布局 + 统一词卡 + 叶形磁贴(发布前五项;主版冻结)

- **主版冻结政策(用户拍板)**:本轮起只改 demo,demo 定稿发布后再同步回 link-match 主版;下一里程碑=Cloudflare 登录+云存档,**此后更新不得让玩家进度清零**(增量迁移纪律,先例 lvOrder v2/缺口盘)。
- **模式介绍弹窗**:点"开始"现在同步关主菜单(`menuScreen` 移除 on)——不再出现"弹窗开局了、菜单还开着"。
- **统一词卡组件**:新 `wordCardHTML(vi, activeF)`——`.word-card` = 插画 + 四形态(原形带环弧线下划线、当前盘词型高亮)+ 定宽 80px 可换行释义。横幅(`showLearnBanner`)、图鉴详情(`#cardBody`)、(结算)共用同一组件,**不再维护两套词卡**。闯关槽 64→72px(挑战 64px),词/插画整体放大;释义定宽换行,给左侧四词让位。
- **顶栏固定顶部**:HUD `position:fixed; top:calc(env(safe-area-inset-top)+10px)`,三列 grid(1fr auto 1fr),菜单钮+关卡数(贴菜单钮右侧)/进度条/分数等高 36px、纵向居中;`boardWrap` margin-top 64px。
- **底部固定**:词卡槽 `#bannerSlot` 移出 dock、紧贴桌盘文档流(闯关 72px);提示/词典 `#dock` 固定 `bottom:calc(env(safe-area-inset-bottom)+10px)`(留空隙);body `justify-content:center→flex-start`(修固定布局后顶栏与桌盘间 ~200px 空隙)。`syncSize` 改按 槽位+dock+10px 底隙+14px 余量 扣可用高;所有模式收起态统一在槽内收成 13px 底条(连击窗口继续)。
- **k-pp 叶子形**:切角矩形修补两轮仍缺角(clip-path 裁坏 outline / drop-shadow 观感不对)→ 用户拍板换形:**纯 `border-radius: 24px 4px 24px 4px`**(grug 26/6/27/5)对角大圆角=叶子;描边、选中虚线框、暗色全部原生跟随,删除全部特殊选中规则。
- QA:bot 149 对(=18 关全部词对)全清、0 重排、0 错误;几何断言(hudTop 10/词卡贴盘 0px/dock 底隙 10/lvlNextToMenu)全过;介绍弹窗关菜单、统一词卡(四形态+swu+插画+释义)、收起 18px 贴槽底、连对重展开断言;**首教演示 QA 坑**:清档后 L0 `maybeStartDemo` 置 busy=true 挡掉 attemptPair——bot 前先 `save.demoDone=true`;存档键 `L0..L17`(显示 1–18);视觉验收:pp 关叶形+虚线选中、闯关大词卡、无尽 36 块固定布局三图 pass(无尽顶栏无中央 0/18 属设计:挑战模式按 v1.10/v1.14 要求改为右侧"得分填向最高分"分数条)。

## 2026-10-05 · v1.14(link-match + demo)幽灵块根因修复 + 模式介绍弹窗 + 菜单改版(用户五轮反馈十项)

- **幽灵块(致命,demo L3/L4 实测)**:`buildPairsFrom` 把全部空位 forEach 放块——8 词关 16 块放进 18 空位,末尾 2 位写入 `{...undefined}`=**空对象幽灵块**(truthy)→ buildBoardDOM 渲染 `VERBS[undefined].hue` 抛错 → **棋盘半成品/计数 stale/一点就"通关"/无法通关**(9 词关 18=18 恰好不触发,故"前两关不错")。修复:洗牌后 `pos.length=tiles.length` 只取实块数;兜底路径同雷(tiles.forEach)。demo 与主版同步。
- **横幅进度条时长**:`--bdur` 从未设置(动画默认 10s)→ 窗口改 15s 后肉眼可见"条先没" → showLearnBanner 按 bannerMs 设置。两文件同步。
- **k-pp 选中**:drop-shadow 方案观感不对(用户截图)→ 改 **inset 3px accent 内环(随 clip 走)+ 剪影光晕**,暗色单独外阴影。两文件同步。
- **demo 专属**:关卡列表按三形态分组(band-head 标题);图鉴修好(TIERS 残留崩溃 → NIG-I..IV 四组 50 行)+ 主菜单加图鉴入口。
- **菜单改版(两文件)**:主菜单加**界面语言切换行**(nl/中文/en,即时生效);模式按钮去副标题 → **右侧分数不换行**、模式名**虚线下划线 + title 悬停气泡**;点模式先弹**介绍弹窗**(说明+最高分+开始/返回)——不再"没准备好就被开局"。
- **每日挑战去掉 0/18 目标胶囊**(levels 保留);词卡整体放大(基础 16px;闯关槽位 64px/字号 18px/插画 52px)。
- QA:demo L3/L4 各 6 次重建 16 块成对 ✓、bot 18/18 关、介绍弹窗流程(含 Start 真进入)、--bdur=15s(计算样式核实)、图鉴 4 组 50 行、中文界面截图;主版镜像同项全绿(菜单/介绍/0/9/15s/每日无胶囊);引擎回归 ALL PASS;零错误。

## 2026-10-05 · link-match-demo:Taalhuis NIG I–IV 限定词表特别试玩版(用户供包)

- **独立单文件 `link-match-demo/`**:词表锁定为用户提供的 Taalhuis "Lijstje werkwoorden NIG I–IV"(4 份 PDF,50 词,含 sg/pl/pp/英文释义)——43 词复用主库(形式/插画/翻译),**7 个新词补数据+专属小插画**(kijken/worden/liegen/zullen/drijven/lachen/laten,形式取词表原文)。
- **关卡:18 关纯序号(1–18,不用 A1.x)**——每形态轮数=⌈池/9⌉ 均衡切块(sg/pl:50→[9,9,8,8,8,8];pp:49→[9,8,8,8,8,8]),顺序切片每词每形式恰好一关;**zullen 无分词**(词表注明"-"),分词轮与四形态卡自动排除;先全部单数轮、再复数、再分词(与主版一致)。collectedPool 改从 LINK_LEVELS 取(原 TIERS 已不存在)。
- 其余玩法(4×5 小盘/2 缺口/四形态卡/固定横幅槽位/三模式)与主版一致;**存档独立** `linkmatchdemo.v1`;标题 "Koppelen · demo NIG I–IV"。
- QA:结构断言(50 词/18 关/轮次切分/zullen 卡三形态)、bot 清 **18/18 关**+无尽盘、7 新词插画渲染、菜单纯序号截图、零错误;存档已清。根/产品 README 校正(51→42 关、4×5 盘、四形态横幅、词行移除)+ demo 章节。

## 2026-10-05 · v1.13(link-match)四形态单词卡 + 闯关横幅固定槽位(用户四轮反馈六项)

- **单词卡改革**:连线横幅与图鉴详情卡统一展示**完整四形态**(原形/单数过去/复数过去/过去分词),当前盘词型**加粗高亮**(词相色)、其余浅灰;原形与其它形态同字号、仅带磁贴同款下划线(横幅高亮=`a.f`,图鉴卡无关卡语境故不做高亮)。
- **下划线换款**(截图1):单波线 → **带小环的手绘弧线**(100×12 viewBox,arc large-arc 成环),磁贴浅/暗两版 + 卡片 `.swu` 同款(Papier 主题退化为色条)。
- **k-pp 选中外框**(截图2):虚线 outline 被 clip-path 裁掉 → 切角块选中改**随形 drop-shadow 光晕**(accent 双层),其余词形保持虚线框。
- **下一关图标**(截图3):v1.9 的 scaleY(-1) 对左右对称的"←|"图标完全无效 → 改画**右向"|→"**(bar 左、箭头右),与"返回游戏 ←|"明确区分。
- **15s 统一默认**:横幅时长(=连击窗口)10→15、提示等待 12→15;**旧档迁移**——存量里等于旧默认值(10/12)的升到 15,用户自定义保留。
- **闯关横幅固定槽位**:dock 改竖排(bannerSlot + dock-row);闯关模式槽位恒 56px——按钮固定下移,横幅+倒计时条位置永不变;手动点掉=槽内收成 13px 底条(槽高不变);挑战模式保持覆盖式(收起下滑)。`body.in-levels` 在 startLink/dealModeBoard 切换。
- QA:四形态横幅(zijn **was** waren geweest,was 高亮)+图鉴卡+光晕+图标截图;15s 新档/迁移档验证;闯关收起后槽高 56 不变、按钮 offsetTop 不动;模式覆盖式回归;bot L0-L9+无尽盘全清零错误。

## 2026-10-04 · v1.12(link-match)闯关小盘零重复 + 下划线居中(用户三轮反馈)

- **闯关改 4×5=20 格盘**:9 词×**1 对**(18 块,同屏零重复)+ **开局 2 个随机缺口**(缺口格永久空置,重排天然保留——reshuffle 只在实块格位间换位);`PAIR_TOTAL` 改动态(发牌按实块数重设:闯关 0/9、模式 0/18);`ROWS` 改 let(闯关 5/模式 9),引擎/布局全部运行时读取。
- **三挑战模式保持 4×9=36 格**(9 词×2 对,接受同屏重复,认知负荷不变)。
- **配套修复**:`simulateSolvable` 的 `left=ROWS*COLS` 按总格数计数——有缺口时永不判可解 → 改按实块计数;`buildBoardDOM`/startLink 块收集加缺口空值守卫;`buildPairsFrom(picks, per, gapCount)` 支持每词对数与缺口(兜底路径改为行主序相邻放置,缺口在 open 之外)。
- **下划线居中**(用户:左对齐很奇怪):三处(left 9%→32%,宽 36% 不变)。
- 回归:引擎测试全绿;同步 bot 清 **42/42 关**(小盘 9 对/关,缺口全程保留、行界不越界);无尽连清 2 盘(36 块/1900 分)、生存超时结算;新手 3 步演示在 4×5 盘走通(demoDone 入档);零错误。

## 2026-10-04 · v1.11(link-match)插画全补齐 + 暗色手绘化 + TTS 终审(明天发试玩前)

- **TTS 终审定性**:探针实测——测试窗口(应用内嵌浏览器)180 个语音在列、utterance 正常入队(`speaking:true`),但**永不 onstart 也不 onerror**,连全新页面第一句、完全不 cancel 也一样 → 该窗口语音引擎本身瘫死,非页面代码问题。v1.10 的竞态修复仍有效(健康浏览器路径正确)。新增**无声诊断**:连对后 1.3s 内 utterance 未开口且仍排队 → toast 提示"此窗口无法朗读,请在 Chrome/Safari 测试"(每会话一次);QA 在瘫窗口验证 toast 正确弹出。
- **插画 108 词全覆盖**:补 23 个 fallback 词的场景(kunnen/moeten/willen/mogen/zoeken/zwemmen/vliegen/stelen/schieten/roepen/verdwijnen/duiken/verstaan/genieten/dwingen/glijden/kruipen/bestaan/onthouden/vertrekken/verschijnen/bevriezen/stinken);新增道具 bubbleBang/bubbleShout/waves/bird/bowArrow。**顺修存量 bug**:SCENES 引用的 sparkles/gift/arrowR/arrowL/arrowD/heart/ball/apple/dashedCircle/speedLines/pencilPaper 从未在 PROP 里,sceneSVG 静默跳过(约 13 个场景缺道具);`coinBehind` 裸调 `coinS` 直接 throw(bedriegen 卡片插画必炸、曾把异步 QA bot 冻死)→ 改 `PROP.coinS`。全量扫描:108 词 × 2 画风渲染零异常。
- **k-pp 切角二次修**(用户:边缘还是有点缺角):切角处 border-radius 6/5px→0(墨线圈走直线到切点),斜条 32%→34% 长、起点 75.5%→73.5%(两端各压过接缝 ~2.5%),缺口消除。
- **手绘暗色模式补完**(用户:下划线是纯直线?字体界面不一样):暗色此前整体回落到通用主题——现在 `--grug-ink` 双色变量(#3b332a/#d8cdb2)贯穿:face 暖色染+浅墨线圈+weight500、四个词形歪斜圆角、k-pp 斜条、**下划线换浅墨手绘 SVG 弯线**、k-inf 角点隐藏、选中虚线框。QA 截图:暗色整板手绘语言一致。
- **原形下划线缩短**(两主题):从横跨 85% 缩到左锚 36%;Papier 通用条同步。
- **主题改名**(仅显示名,存档值 grug/papier 不变):Grug→**Sketch/手绘**,Papier→**Post-it/便签**(nl/zh/en);顺修设置面板主题按钮硬编码标签 → 走 i18n 词典。
- **全量可玩性回归(发试玩前)**:同步 bot(无 await,免疫后台页 setTimeout 节流)清盘 **42/42 关**零错误零卡死;无尽连清 2 盘、生存清盘→强制超时→结算入 best、每日重置后完整流程(清盘→自动发第二盘 k-pl→强制时间到→dailyDone/dailyBest 入档)。QA 环境备注:`tabs.new()` 的页 reload 后视口归零(每次 reload 后须重设);后台页截图可能是冻结旧帧,以 DOM 为准;tab.evaluate 不 await 异步 IIFE,重活用同步 IIFE + cell 层轮询。

## 2026-10-04 · v1.10(link-match)朗读修复 + 模式 HUD 二轮(用户试玩反馈七项)

- **审计 v1.9 十三项**:12 项已落实;唯一未生效的是第 11 项"朗读"——调用链在(`showLearnBanner→speakPair`),但 `speechSynthesis.cancel()` 后**同步** `speak()` 被 Chrome 竞态静默吞掉(link-match 没同步 tile-match v0.86 的"延迟开口"修复),连快时每对都在 cancel→speak,故"朗读就没了"。修复:空队列不 cancel;刚 cancel 过延迟 70ms 开口;**代数令牌 speakGen** 让新横幅接管后旧链全部失效;另加 iOS/Safari 首次手势静音音节解锁 speechSynthesis。QA:speak 后 150ms 内 `speaking|pending=true`。
- **模式 HUD 重排(修"倒计时被迫换行")**:每日中槽原有 lvlTag+进度胶囊+计时三胶囊,390px 必挤爆。模式(无尽/每日/生存)下隐藏 lvlTag(模式自明),无尽中槽清空(最佳分移入分数条目标位);`body.mode-hud` 紧凑档(胶囊收边、分数条 min-width 88)。QA:四模式在 390px 连击激活时 HUD 全部单行(hudH 56)。
- **模式分数条(新规)**:levels 保持 ⭐分数胶囊;模式改 `.score-bar`——开局捕获个人最佳为**目标固定在右端**(endless=Oneindig/daily=当日/survival=Survival),得分从左**填充进度条**,超越目标进 record 态(目标字转橙红)。里程碑庆祝对两种分数框都兼容。
- **一屏一词型**:`sampleModeVerbs` 整盘只取一种形式(sg/pl/pp),清盘换型不与上一盘重复;modeFormState 在各 start* 重置,**每日挑战保持种子确定性**。help.modes 三语言补一句。QA:连抓多盘形式唯一。
- **k-pp 切角"缺角"修复**:切角 clip-path 把 grug 墨线圈一起裁掉;块面恒 4:3 → 斜边角恒 36.87°,用 face::before/::after 两根 2.2px 墨条补描(75.5% 起位、32% 长)。QA:2x 特写视觉确认轮廓完整。
- **逐块字号**:`syncSize` 从"最长词定全板字号"改为**逐块实测**(长词单独缩,短词保住可读字号);QA 同板 5 档字号 17.3–18.6px。地板 8.5×grug0.93=7.9 下限不变。
- **结算图标对齐**:v1.9 把 emoji 换 `.hico` 时 `display:block`,在结算文本里独占一行(用户:"分数图标去哪了");改 `inline-block + vertical-align:-3px`,计时/最佳/结算全处对齐。QA:结算 "🪙 15 · beste: 800" 同行。
- **横幅手动点掉不断连击**:`bannerEl.onclick` 由 hideBanner 改 **collapseBanner**——卡片下滑只剩底部 3px 倒计时条(`translateY(calc(100% - 13px))`),连击窗口与朗读继续;自然到期仍清连击。QA:点掉后 streak 保持、下对重连自动展开、3s 到期 streak 归零。
- QA 存档已清;引擎回归全绿;console 零错误。QA 环境坑:tabs.new() 的页 **reload 后视口归零**(每次 reload 后须重设 390×844),后台页截图可能是冻结旧帧(以 DOM 为准)。

## 2026-10-04 · v0.9(tile-match)Grug 手作主题 + 连连看 v1.8/v1.9 风格移植(用户:照连连看的改法升级三消美术)

- **Grug 主题系统**(承 link-match v1.8,方向 D):设置新增 `Thema`(Grug **默认** / Papier 原版);`body.theme-grug:not(.dark)` 覆盖暖纸变量、词块纸染 12%+墨线描边+错位硬阴影+weight500、三形式各异手绘圆角(sg 波浪圆角/pl 紧角/pp 切角)、选中虚线圈、HUD/按钮/面板墨线歪斜圆角;`body.theme-grug.dark` 只降饱和,暗色变量级联在后不破坏。**与连连看的实现差异**:三消词块移动走 transform translate,歪斜必须合并进同一 transform(placeTile/tileRot,随重力自动更新),不能用独立 rotate。主题切换时即时重排歪斜+重算字号。
- **字号按主题测量**:computeLevelFont 用手写字体栈实测(手写体更宽)+ ×0.93 防溢出;词块字重 500。
- **hint 开关在主题下的语义**:颜色提示关 → grug 纸面纯色(no-color 不吃色染);形状提示关 → 回退统一圆角(grug 手绘圆角带 :not(.no-shape) 作用域)。
- **emoji 全清**(承 v1.9#5b):⭐→ICO_STAR、🔥→ICO_FLAME、⏱→ICO_CLOCK、🎯→ICO_TARGET(新绘同风格:色块偏移+墨线描边);结果文案/帮助文案内 🎉🏆🔥💡 同步清除(三语言)。**分数框从渐变字改真胶囊**(黄底 #e3b52e 圆胶囊,两主题通用;渐变字会让 SVG 描边透明,link-match 同款问题绕开)。
- **其余移植**:grugRough 插画滤镜(bannerArt/cardArt/book-art)、`--hot` 统一橙红(score-pop 大字/combo 主按钮)、菜单右上 ✕ + 点面板外回当前对局(仅会话存活)、朗读音量=0 时消除成功补上行确认双音(v1.9#11)。
- **顺修一个健壮性缺口**(QA bot 撞出):结算弹窗后棋盘若再被 swap(真实玩家被弹窗挡住,自动化会穿过),兜底自愈路径 `pickRefillTile` 读 `level.verbs` 崩——加 level 空回退 [0,1,2]。
- QA:grug 亮/暗、papier 切换(UI 真路径)四态截图与渲染断言(手写字体/纸染色/歪斜矩阵/胶囊底色/图标 SVG);grugRough 滤镜实测作用于横幅;bot 6 步零错误;弹窗后强制 swap 自愈不再崩;交叉消除负向路径无异常;存档备份/恢复,旧档无 theme 键自动合并默认 grug(与 link-match 同策略)。

## 2026-10-04 · v1.9(link-match)试玩反馈 13 项(用户逐条清单)

- **1 HUD 语境化**:关卡名缩短为 `A1.2`(去形式标注;网格按钮保留形式小字);中槽按模式切换——闯关/每日=对数进度条、生存=倒计时、无尽=个人最佳分(星图标,实时刷新,修了渲染顺序滞后一拍)。
- **2 词块排版**:字重 700→500、grug 字号 ×0.93——"上一版的感觉、字再大一点"的折中。
- **3 菜单**:右上角 ✕;点击面板外任意位置回到当前对局;下一关图标垂直翻转(与"返回游戏"区分);主按钮(返回游戏/下一关)用统一橙红底+米白字(可读性)。
- **4 分数框**:圆球改 wobbly 胶囊,四位分数不溢出、对齐正常。
- **5a 连击框**:hud-right flex 不再被挤压遮挡,图标+数字不再撞车。
- **5b emoji 全清**:⭐/🔥/⏱/🎉/🏆/💡 → 手绘 SVG(色块偏移+墨线描边,"色块与线条有重叠");文案内 emoji 同步清除(三语言)。
- **6 下划线一笔**:双笔画改单笔画慢弯线(参考用户截图)。
- **7 庆祝**:去掉块上大字;里程碑词("Mooi!/Geweldig!…")改在**分数框位置**滚动出场 1.3s 后分数回归;波纹+和弦保留。
- **8 词行移除 + 扩容**:wordRow 整体删除,目标聚焦顶部;盘面 4×7→**4×9=18 对(36 块)**;轮数=⌈池/9⌉ → **42 关**(A1 9/A2 15/B1 18),验证每词每形式≥1;迁移 lvOrder v3(v2 51 关映射,超出新轮次的 done/best 丢弃,collection/daily/无尽最佳保留)。长词由 syncSize 测宽缩字防溢出。
- **9/10 连线与强调色统一**:`--hot` 橙红(稍暗于连击倒计时)用于连线、连对时两块**边框亮起**(lit)、选中/主按钮;连线改**虚线**(10-8),端点=两块朝向路径一侧的**边中点**(不再连中心)。
- **11 朗读保留**:TTS 正常;设置里 Voorlezen 滑杆=0 即关闭;关闭时连对成功加一记上行双音确认(不影响递进音效)。
- **12 插画手绘化**:全局 `#grugRough` SVG 滤镜(feTurbulence+displacement)作用于横幅/图鉴卡插画——边缘手绘抖动、色块非完美,零重绘成本。
- QA:新档 HUD/36 块/短名/词行移除;菜单三交互(✕/点外/翻转);三模式中槽切换(解锁后);里程碑庆祝槽+虚线+lit(连对中抽查);4×9 视觉截图(词全部完整);bot 全清 18 对(计分 1900、彩带 26);Papier 切回;暗色组合;迁移 v2→v3 逐键核验(L27→L24,L50 超轮次丢弃);路径引擎回归全绿;console 零错误;QA 存档清理。
- **补丁(用户试玩发现):连线出现斜线段**——drawPath 新写的 edge() 把 `[r,c]` 的行/列差轴序弄反(行差当水平),端点从错误一侧出边、与正交转折间形成斜线;对调后浏览器导出 polyline points 复核全部共轴(diag=false)。已随 618f078 上线。

## 2026-10-04 · four-match 试玩否决,玩法回归三消(用户拍板)
## 2026-10-04 · v1.8(link-match)Grug 手作主题上线(P2 主题系统第一步,用户选定方向 D)

- **方向选定**:四方向效果图(docs/mockups/aesthetics.html)中用户选 D(grug 手作)——"最适合休闲调性";反馈三点已吸收进 mock 并随主题实现:字体统一放大(全 UI 手写字体栈 Chalkboard/Comic Sans/Marker Felt)、下划线真手绘(数据 URI 双笔画 SVG,替代色条)、颜色提示更浅(tile 色相混入降到 12%)。
- **实现**:新设置项 `Thema`(Grug **默认** / Papier 原版可切回);`body.theme-grug:not(.dark)` 覆盖变量与结构(暖纸变量、词块纸染 12%+墨线描边+错位硬阴影、四类形式各异手绘圆角、pp 切角、选中虚线圈、HUD/按钮/chips/面板全手绘风);词块确定性歪斜 ±1.8°(applyTileRotations,按 r,c);暗色组合安全(暗色变量级联在后,`theme-grug.dark` 仅降饱和);字号测量按主题选手写字体(手写体更宽,防溢出)。
- QA:新档默认 grug 渲染截图(与 mock 一致)、Papier↔Grug 切换(旋转/配色/类名三重核验)、暗色组合(暗变量不被主题覆盖、tile 暗底正常、手写字体保留)、bot 清盘 A1.1 全链路(解锁/演示/试点动效兼容)、路径引擎回归全绿、console 零错误、QA 存档清理。

## 2026-10-04 · four-match 试玩否决,玩法回归三消(用户拍板)

- **结论:四消路线暂时否掉**。用户试玩:盘面上四连太难自然拼出,频繁触发死局重排("一直在重置"),挫败感强。玩法回到三消(tile-match)。
- **技术复盘(留档)**:12 类型/35 格下,即便有聚簇偏置+同动词错形+只禁 4 连,开局保底虽能凑出 ≥2 解,但**中盘供给**才是真难点——每消一次,重力补牌后的盘面四连机会迅速枯竭,然后反复 reshuffle。若日后重启,候选方向:定向补牌(往有 3 连残局的方向喂块)、放宽判定(4 连中允许缺一形)、或减少盘面类型数。
- four-match/ 原型保留在线(four-match/README.md 顶部已标注否决状态),不再迭代。
- 对照实验的价值:验证了"判定即检索"在 3 形判定下恰到好处——多一个必要形式,盘面自然供给就跟不上了;三消的判定/供给平衡是试出来的,不是猜出来的。

## 2026-10-04 · v1.7(link-match)竞品调研试点:试验关 A1.1/A1.2(P1/P3/P5/P6)

- **范围控制**:TRIAL_LEVELS={"L0","L1"}——P1 连击里程碑、P5 分数飞行、P6 清盘终章**只在试验关生效**,其余关卡保持原样供对比;P3 首教学天然只在 A1.1 首次进入时出现(save.demoDone)。
- **P1 连击里程碑**(对标 Candy Crush 连锁升级):×3/×5/×8(之后每 +4)触发——消除处弹出大字感叹("Mooi!/Geweldig!/Formidabel!/Legendarisch!",三语言)、棋盘波纹(box-shadow 脉冲)、四音和弦。
- **P3 交互式首教学**(借鉴 Royal Match 无教程):首次进 A1.1 时 3 步演示——橙色胶囊条引导"点动词→点变位→连线自己画出来",点错抖动目标块;完成后 demoDone 落账只出现一次,toast "Nu jij!"。演示期间 demo 接管输入(⚠️ 实现坑:演示拦截必须在 busy 守卫**之前**,且 demoClick 参数不可叫 `t`——会遮蔽全局 i18n 函数,报 "t is not a function" 且 500ms 回调不排上)。
- **P5 分数飞行**(Royal Match 资源流向):+pts 从消除块飞向计分器(getBoundingClientRect+transition,双重重流起步,勿用 rAF)。
- **P6 清盘终章**:26 片彩带从盘心迸落 + 五音上行琶音。
- QA:演示全流程(点错抖目标/步进条文/自动连消/demoDone 持久化/复进不重现,截图确认)、里程碑(streak=3 → "Mooi!"大字+波纹+飞行)、清盘彩带 26 片、非试验关回归(无 fly/big/ripple)、路径引擎回归全绿、console 零错误、QA 存档清理。

## 2026-10-04 · v1.6(link-match)试玩反馈三连:关卡编号 / 非阻塞连击 / 延迟 peer 提示

- **#1 关卡编号化**(用户:没区分度):关卡名改为 **A1.1–A1.9 / A2.1–A2.18 / B1.1–B1.24**(档内序号)+ 形式标注(HUD "A1.2 · enk.",网格按钮 = 编号+形式小字);轮次角标取消(编号本身已区分);help.rules 三语言同步。
- **#2 非阻塞连击**(用户:动效挡点击,断爽感):attemptPair 改**全程同步**——词格立即腾出、alive 立即置否、计分/横幅/续命即时落账,消失动画与清盘发牌/重排全走 setTimeout;busy 在游玩中不再置 true。快速连击实测 3ms 间隔两连成功(15+25 连击链)。配套:消除残块不可再选(alive 守卫);drawPath 改为只移除自己那批节点(背靠背连线互不吞)。
- **#3 延迟 peer 提示**(用户:选中别自动放大,等玩家自己发现):选中后**不再立即**点亮同动词块;闲置 hintWait 秒后,已选中→点亮同动词块,未选中→照旧提示一对;hintWait=0(Off)彻底关闭;与总提示共用同一滑杆。
- QA:编号显示(网格/HUD)、3ms 双连+残块守卫、peer 三态(立即 0/1s 后 3 块/0 关闭)、bot 高速清关(1220 分)结算+解锁、回归全绿、console 零错误、QA 存档清理。

## 2026-10-04 · four-match v0.2 下划线 + 5×7 + 内容铺到 A1–B2(用户试玩反馈三连)

- **原形块加粗下划线**(用户:原型可以加个下划线):胶囊形外再叠橙色 `::after` 横条,与 link-match 的原形标记同视觉语言;`.face` 加 `position:relative`。
- **棋盘 6×6 → 5×7**(用户:桌盘小一点、块大一点):35 格,词块宽 73px(390 档),字号 12→14.6px;用户偏好"词尽量大"回归。
- **内容 A1–B2**(用户:A1-B2 都做出来看看):99 词 / **33 关**——A1 15 词承 tile-match;A2 30 词同;B1 40+2(bevelen 为 tile-match 漏收的常用词,buigen 补入)→14 关;B2 新增 12 词(bergen/spinnen/rijzen/gelijken/bezwijken/vlechten/mijden/doorzien/overzien/bezingen/verslinden/delven,全部真强变化,自校时纠正 rijzen pl=rezen、bergen pl=borgen 两处笔误)。菜单改**按档分节目录**(A1/A2/B1/B2 标题行+四列网格,面板滚动)。
- **开局保底失效修复**:12 类型/35 格下随机盘面难凑 ≥2 解(B2.2 实测只有 1 解)。三招:①同动词聚簇时**错开形式**(相邻不同形,四形齐更容易);②布盘从"禁 3 连"改**只禁 4 连**(3 连=差一块的好局面,三消版禁 3 连的规则不适用四消);③兜底 forceTwoNearMiss 重写为行/列两个四连近局。复查 8 关×3 次 24 盘**全部 ≥2 解**、零错误。
- **顺修 tile-match 数据笔误**:zwijgen 单数过去式 "zweg"→"zweeg"(冻结产品的一字数据纠错,非功能迭代)。
- QA:99 词去重/形式齐全/分档计数校验(node);菜单 4 节 33 钮锁定链;A1/A2/B1/B2 各档抽关零错误;bot 全清 B2.2(5 步,收集 3 动词,解锁链 32,结算弹窗正常);下划线渲染像素确认;390×844 双截图(菜单分档+棋盘);nlm4 测试存档清理。

## 2026-10-04 · v1.5(link-match)试玩反馈六连 + 内容收完(108 词 / 51 关 / 生存模式)

- **#1+#3 形式分组重排**(用户:每关形式不同容易混淆):关卡改为**形式分组**——每档内先单数过去式各轮、再复数、最后分词(A1 顺序 sg×3→pl×3→pp×3);关卡网格加档位标题行(A1/A2/B1),轮次角标保留。
- **#2 界面用语**(用户问 level 是否荷兰语):调研确认 **"level" 就是荷兰语游戏界面标准用词**(荷兰游戏社区/词典均接受;"niveau" 更多指难度/CEFR 等级)→ "Verder spelen" 改 **"Volgend level"**(zh 下一关/en Next level)。来源:tweakers.net、vertalen.nu。
- **#4 手感加强**(用户:消除反馈再强一点):折线改**描入动画**(dasharray+transition,取代 SMIL 的可靠方案)+ 底层宽辉光;两端**粒子扩散环**;消除位置**得分弹字**(+pts ×连击);块消除先 flash 亮起再 pop 消散;音效改**低频"咚"+双音上扬**(连击≥3 加第三音)。
- **#5 生存模式**:过第 1 关解锁;每次配对成功续命 15s(点错只断连击不失败),超时结束入最佳分(`best["Survival"]`);HUD 计时芯片 ≤5s 变红脉冲;菜单入口带最佳分副标题;清盘连发、死局重排均不停表。
- **#6 空白利用**:棋盘与操作坞之间新增**词行**(wordRow)——本盘 7 词的"原形→变位"chips,色点对应动词颜色,点击朗读(speakPair),配对消除后划线变淡=被动复习+进度可见;矮屏(<600px)自动隐藏。
- **#7 内容收完**:词库 85→**108 词**(新增 kunnen/moeten/willen/mogen/zoeken/zwemmen/vliegen/stelen/schieten/roepen/verdwijnen/duiken/verstaan/genieten/dwingen/glijden/kruipen/bestaan/onthouden/vertrekken/verschijnen/bevriezen/stinken;调研纠正 mogen pp=**gemogen** 非古体 gemoogd);TIERS 改按词名定义(不再用脆弱的索引区间);轮数=⌈池/7⌉ → **51 关**(A1 9 / A2 18 / B1 24),验证**每词每形式≥1 次、关内无重复**。
- **迁移**:旧序(档,轮,形式)→新序(档,形式,轮)的 done/best 按映射精确搬家(18 关旧进度零丢失),counts/dailyBest/Oneindig 原样保留;lvOrder="v2" 防重跑。
- QA:新档菜单(4 模式锁态+Volgend level 文案)、51 关网格+3 档标题+42 角标、旧档迁移逐键核对、L1 bot 全清(第二轮新词)、动效元素逐一验证(弹字/粒子/描线 dasharray/词行点亮,消除瞬间截图确认外圈辉光)、生存全流程(续命数值精确 15000→14381→递减→重置、超时结算、最佳分、紧急态红脉冲、切模式清理)、路径引擎回归全绿、console 零错误、QA 存档清理。

## 2026-10-03 · four-match v0.1 四消独立原型(用户:先做一个单独的四消原型)

- 落地封存方案:原形+三变位**四形同消**、从 A1 起、每关 3 词、12 类型/36 格(6×6)。独立单文件 `four-match/`,存档 `nlm4.prototype.v1`、钩子 `window.NLM4`,与 tile-match/link-match 解耦。
- 判定:≥4 连同动词且四形齐全(五连带一个重复可消);形状提示四档=胶囊(原形)/圆角(单数过去)/直角(复数过去)/切角(分词);每关 3 词按 HUE_PALETTE 取色防撞;开局保底 ≥2 解、闲置 12s 自动提示、无步数计分制。
- v0.86/v0.87 防坑全部内置:交叉连段按格去重、burst 空引用防御、重力自愈、trySwap try/catch/finally、全局错误留痕、speechGen 朗读代数令牌(新横幅打断旧链、60ms 延迟开口)、强制重流不用 rAF、syncWidths JS 算宽。
- QA:菜单锁定/开局保底、bot 3 步集齐 3 动词过关零错误、结算三按钮+解锁/best/done 入档、下一关流转、`NLM4.install` 构造行/列共享 (0,2) 的交叉布局一次消除无冻结无空洞、桌面+390×844 截图词全部完整显示;nlm4 测试存档已清理。
- **玩法观察(待试玩定夺)**:3 词/关 + 0.62 聚类偏置下四连非常容易凑出(bot 3 步通关)——偏松;调紧候选:每关 4-5 词、聚类偏置调低、要求 ≥5 连。6×6 格下词号约 11-12px(390 宽),比 tile-match 的 4×9(约 18px)小,若嫌小可改 5×7(35 格,格宽 +20%)。

## 2026-10-02 · v1.4(link-match)关卡扩容 9→18 + 横幅时长设置项(试玩前增量)

- **关卡翻倍**:每档(A1/A2/B1)从 3 关扩到 6 关(两轮 × 三形式),共 **18 关**;第二轮走词池轮转的下一片,A1 池 14 词恰好两轮互补,A2/B1 同形式两轮**零重叠**(全是新词)。标签仍是"档位 · 形式"(学习目标优先),完成态靠关卡网格的 done 标记区分。`help.rules` 文案同步改两轮制。
- **横幅时长设置项**(原硬编码 10s):设置面板新增"Bannerduur"拖杆(5-30s,默认 10),横幅时长=连击窗口语义不变;旧档无该字段自动补默认值。
- 玩法说明新增模式一段(help.modes,三语言):过第 1 关解锁无尽与每日。
- QA:18 关网格渲染+锁定态;第二轮新词关(L9)bot 全清 14 对、解锁链延伸;横幅 6s 档实测存活 ≈5.5s+观察者启动延迟 ≈6s 符合;旧档去 bannerMs 重载自动补 10;路径引擎回归全绿;console 零错误;QA 存档备份恢复。

## 2026-10-02 · v1.3(link-match)无尽模式 + 每日挑战(用户拍板"先加模式")

- **两模式上线**(沿用 tile-match 已验证惯例):过第 1 关解锁;只用**已收集动词**(`counts>0`);菜单按钮带锁定态+副标题(未解锁提示 / 每日"Elke dag een nieuwe puzzel"或"✓ Vandaag: N" / 无尽最佳分);会话保活("Terug naar spel"回到当局)。
- **无尽**:无关卡目标,清盘自动发下一盘,**连击窗口跨盘延续**(横幅不关、streak 继续累加);最佳分实时入库(`best["Oneindig"]`),中途离开/刷新不丢。
- **每日挑战**:180s 倒计时(HUD 计时芯片)+ 当日日期种子(同日同盘,种子跨盘延续决定后续发盘);时间到=当日完成:`dailyBest[日期]`(0 分也记,菜单完成态要能显示)+ `dailyDone=日期`,菜单灰显带 ✓,再点弹 toast 拒绝;结算只有"Menu"一个按钮。
- **盘面生成参数化**:`buildPairsFrom(picks)`(每词 {v,f}:原形×2+变位×2);词形挂到**每块**(`t.f`)替代全局 `curLevel.type`——`wordOf`/`buildBoardDOM` 改读块上形式,关卡行为不变。`syncSize` 字号测量改为量当前盘面块(模式无词表也能正确量,关卡结果一致)。
- **采样**:`sampleModeVerbs` 从收集池取 7 词,同一盘内**变位词串不重复**(撞串自动换词/换形式);同一动词可用不同形式多次入盘(收词少时自然补足)。
- QA:新档锁定态→bot 过 L1 解锁(菜单副标题三语言正确);无尽 28 对跨 2 盘、连击跨盘延续计分**分毫不差**(1220+3180=4400)、最佳实时入库;保活回到当局;每日到时结算、✓ 完成态、再入被拒、刷新保持;当日种子两次生成序列一致;模式切换弃局正确(mode 复位、计时器隐藏);无尽截图确认混排三形式+形状提示+字号完整;全程 console/unhandledrejection 零错误;存档备份恢复。修了两处 QA 中发现的 bug:syncSize 读模式盘崩溃(curLevel.verbs 不存在)、endTimeUp 后计时芯片未隐藏。

## 2026-10-02 · 任务线转向:只做 link-match(用户拍板)

- 方向收敛:后续迭代只做连连看(link-match);tile-match 冻结在 v0.87,已上线功能全部保留,不再排新迭代。
- ROADMAP 按新方向重写:link-match 基线(v1.2)、下一波(内容铺量:词库 B2/C1、关卡扩容、插画补齐)、候选方向(每日/无尽、横幅时长设置项、排行榜接口、PWA、更多界面语言)待拍板。
- 封存:tile-match 四消对照分支(转向前方案存档于 ROADMAP)、原形百搭块(此前已否决)。
- 同步更新 AGENTS(项目定位/当前状态)与 README(产品表状态列)。

## 2026-10-02 · v1.2(link-match)路径判定坐标系修复 + 回归测试固化(用户截图报障)

- **有路判"不能连"**(用户截图:nemen 一折可达 nam 却被阻):根因是 `findPathOcc` 内部已 +1 转外圈坐标,`attemptPair`/`findAnyPairNow` 调用处又 +1 → 点击判定与提示在一个整体偏移一格的坐标系里找路。三个历史症状同源:有路被阻、没路反出提示、连线画偏一格。布盘模拟(`pairConnectable`/`findAnyPair`)坐标正确,QA bot 走的相邻对在偏移系里也总可连——故 v1.1 的 bot 清盘 QA 没暴露。修:两处调用去掉多余 +1。
- **连线丢失起点**:折线回溯回到起点时提前 break,起点 A 没进折线 → 相邻两块的连线退化成一个点、绕行线差最后一段永远碰不到第一块。修:父指针为根时显式 push 起点。
- **回归固化**:`link-match/test/path-engine.test.mjs`(零依赖,`node link-match/test/path-engine.test.mjs`):独立参照实现(直连/一折/二折三段枚举,与 BFS 异构)对照 400 张随机盘全部格对(44k+ 判定)必须零分歧;返回折线逐段校验(端点=两块本身、共线连续、中间不穿块、≤2 折角);全消链路 300 局(消除→卡死重排→相邻兜底)必须全清。
- QA(浏览器):用户截图盘面原样回放——旧代码对 nemen–nam 恰返回 null、新代码给出正确一折折线;9 关 × 全候选对 3402 判定零分歧;提示一致性 9/9(提示必可连、无提示时参照实现也确认无可连);恶意点击(两块同为原形)拒绝且盘面不变;bot 全清盘 14 对、计分与连击公式精确吻合(990+100 清盘奖励=1090)、每词计数=2、解锁正常;2 折绕外圈连线截图确认两端贴块。测试存档备份/恢复。
- ⚠️ 发布状态核实:v0.86(tile-match 卡死修复)此前已随代码提交上线;v0.87 代码(每日一次/朗读令牌/图鉴手风琴)曾只记文档、代码留在工作区,已于本次发布窗口提交上线(42e1d9c)。发布前补跑冒烟+交叉卡死回归(消除 +30、busy 复位、无空洞、零错误)。

## 2026-10-02 · v0.87 每日一次 + 朗读跟随横幅 + 图鉴纵向目录(tile-match,用户反馈三连)

- **每日挑战限每日一次**:计时结束=完成,`save.dailyDone`=当日 key 入档;完成后菜单每日按钮灰显、副标"✓ Vandaag: N",再点只弹 toast 不开局;结算弹窗去掉"再来一次"。0 分完成也记录 dailyBest(否则菜单完成态不显示)。旧档无该字段,merge 默认 null,向后兼容。
- **朗读混读修复**(用户:两组快速先后消除,尤其连锁触发时混读):根因是 speakVerb 的 cancel() 会触发旧朗读链的 onend→next(),旧链继续读下一词,与新链并行。加 `speechGen` 代数令牌:每次新朗读/停止 +1,链上每步校验,过期整链作废——朗读永远跟随最新教学横幅;首词延迟 60ms 开口,避开 iOS cancel 异步生效窗口。link-match 是单条单词朗读无链,无此问题,未改。
- **图鉴 CEFR 折叠改纵向目录**(用户:折叠不要横向并排):折叠头原是无 display 样式的行内 button,折叠后相邻档头横向并排;改全宽 flex 手风琴行 + 右侧"已收集/总数"计数(如 A1 4/15),折叠后竖向堆叠;词条列表结构不变。
- QA:每日全流程(完成→锁定→toast→拒绝开局)、0 分完成态、朗读三场景(双横幅 10ms 先后=旧链 0 词、新链完整四形;中途插入=严格接管;hideBanner=立即停)、图鉴展开/折叠截图(390×844)、bot 6 步回归零错误;真实存档备份/恢复,旧档兼容验证。注意:隐藏标签页 Chrome 会把 setTimeout 节流到 ~1s,朗读链测试要放长等待或插桩看时间戳——系测试环境现象,真机前台正常。

## 2026-10-01 · v0.86 修复「消除后卡死」(tile-match,用户手机复现两次)

- 根因:行连段与列连段**交叉共享同一块**(L/T 形)时,消除列表含重复项;第二次处理该格时 board 已置 null → t.el 抛 TypeError → resolve 中断 → busy 永久 true(重力未执行:悬空块不落、全盘不可点)。与设备无关,概率触发。
- 修复:消除格子按格去重;burst 循环加空引用防御;重力后自愈填充残留空格;trySwap 包 try/catch/finally(busy 必复位+棋盘自愈+报错提示);全局 error/unhandledrejection 捕获进 window.__errors。
- 顺修:showResult 先置 level=null 再读 level.goal(过关结算弹窗从不显示)、updateHUD 在 level 置空后读 level.goal(横幅超时报错一次)。
- 回归:NLM3.install() 构造交叉布局,消除后无冻结无空洞;bot 通关后横幅超时窗内零错误。


> 每次迭代追加一节:日期、内容、用户反馈来源、修掉的 bug。最新在最上。

## 2026-10-02 · v1.1(link-match)试玩反馈五连修

- **错词也能消**(用户抓到):attemptPair 只查路径、不查词对 → 补校验(同动词 + 原形/形式各一块),非法配对抖动拒绝。QA 补了"人工乱点路径"的用例(bot 只走合法路径,漏测)。
- **折线不可见**:dash 动画在动态插入的 SMIL 上不生效,dashoffset 停在 100 → 整条线被 gap 吞掉;改实线绘制,坐标经 bounding box 验证无误。
- **死局重排兜底**:相邻成对布点(行主序成对放置,外圈路径保证 ≤2 折角可连),不再可能死循环"无对可连"。
- **体验**:原形块标记强化(粗下划线+角标点);选中块时同动词块微高亮(帮玩家看清能配谁)。
- i18n 审计脚本化:代码引用键 vs 词典键 diff,补 "btn.next" 缺失(用户看到的字面 "btn.next" 按钮即此因)。

## 2026-10-02 · v1.0(link-match)连连看独立产品

- 用户新方向:连连看玩法,每关只练一种配对(原形↔单数 / 原形↔复数 / 原形↔分词);**独立网页独立产品**,复用资源但解耦。
- 新建 `link-match/index.html`(拷贝式复用 85 词/插画库/i18n/主题):9 关 = A1/A2/B1 × sg/pl/pp,每关 7 词 × 2 对 = 14 对,4×7 盘 + 外圈路径带。
- 引擎:经典 ≤2 折角 BFS(方向+折角数状态,父指针重建折线);布点后可解性模拟验证(不可解重排,兜底相邻布点);死局自动重排;闲置提示高亮可连对。
- 呈现:原形块橙色下划线标记;变位块形状=形式;配对成功 → 折线描线动画 + 教学横幅(`lopen — liepen`,10s=连击窗口)+ 朗读两词;图鉴 CEFR 折叠 + 每词配对计数。
- 修过的坑:par 父指针表未初始化为数组(BFS 崩);save.collected 残留引用(改 counts 体系);resize 不触发导致小屏尺寸陈旧(加 visualViewport/轮询安全网)。
- QA:bot 自动清盘 L1(14 对)、L2 单对验证、四尺寸布局、存档链路全部通过。

## 2026-10-01 · v0.85 会话保活与"回到当前游戏"

- 用户反馈:无尽中点"Verder spelen"去了 A1.3——"继续游戏"实为"下一关"语义,缺少"回到当前对局"。
- 重构:打开菜单**不再销毁会话**(无尽/每日暂停计时保留进度,关卡保留棋盘);菜单顶部新增主按钮 **"Terug naar spel / 回到当前游戏"**;会话进行中隐藏"继续游戏"避免误触。
- 无尽/每日最佳分改为**实时记录**(updateHUD 内),中途放弃/刷新不丢分;放弃会话统一走 abandonSession()(含每日按当日 key 记录)。
- 过关/时间到结算时清空会话(level=null),菜单不再显示"回到当前游戏"。

## 2026-10-01 · v0.8 插画形象化 + 英语界面 + 连击/提示联动

- **插画形象化**(用户反馈"只有首字母差太远"):新增坐/跳/闪避三种小人姿态 + 45 个道具(书/杯子/椅子/地毯/路灯/气泡×4/锤子/灯泡/价签/硬币/奖杯×2/相框/墓碑/挂锁/汽车/绳索/音符/气球/冰块/水罐/吸管/毛巾/绳结/信封/楼梯/墙/禁止标志/天平/脚印/雪花/小船/雨云/心+十字/剑/破圈/对勾/路径/问号…)+ **73 词场景组合表**(数据驱动,每词一行:姿态+道具坐标)。
- 修复"继续游戏关卡变了":QA 污染存档所致 → 引入 `save.done`(每关完成记录),继续 = 第一个未完成的已解锁关卡;QA 流程今后须备份/恢复存档(记入 AGENTS)。
- 修复"同盘颜色重复":激活动词按 12 色调色板按位取色(无尽/每日抽样也不再撞色)。
- 英语界面:I18N 增加 en 词典,设置语言 Nederlands/中文/English;释义跟随(en/zh)。
- 提示等待:设置改为**滑杆**(0-30s,默认 12s = 横幅 10s+2s,旧值 7 自动迁移);用户反馈"默认值不显示"由此解决。
- 教学横幅扩展到**所有模式**(无尽/每日也显示,替代中央闪现)。
- 图鉴按 CEFR 档(A1/A2/B1)折叠/展开,档内显示关卡小标题。
- QA 修正:同关词形冲突检查排除同动词(复数=分词是语言事实)。

## 2026-10-01 · v0.7 内容大扩充 + 无尽/每日模式

- 词库 12 → **85 词**(A1 15 / A2 30 / B1 40),关卡 3 → **17 关**(每关 5 词,目标=收齐本关);同关词形冲突自动校验通过(同动词"复数=分词"属语言事实,由形状系统区分)。
- 新词插画:首字母纹章 fallback(风格/深浅主题感知);深色模式插画墨色改浅(修复对比度)。
- **无尽模式**:通过第 1 关解锁;已收集词池随机 6 词;刷分;☰ 离场记录最佳分(菜单副标题显示)。
- **每日挑战**:同解锁;日期种子(mulberry 变体)+ 已收集词池抽样 6 词;180 秒倒计时(HUD 计时标签);时间到结算 + 当日最佳。
- 引擎:Math.random → rng 注入(每日种子);beginSession 重构;checkEnd 仅关卡模式;非关卡模式消除用中央闪现。
- 菜单 7 项(两新模式带副标题与锁定态)。
- 修复:用户反馈"关卡名和目标右对齐"→ HUD/操作坞宽度由 JS 与棋盘实时同步(棋盘可能被 max-height 收缩导致错位)。

## 2026-10-01 · v0.6 状态栏炫化 + 连击倒计时
## 2026-10-01 · v0.65 顶部三区 + 连击 10s + 关卡命名对齐 CEFR

- HUD 改三区网格:左 ☰ / 中 关卡号+目标进度 / 右 连击(分数左侧发光芯片)+ 分数。
- 连击倒计时(教学横幅时长)8s → **10s**。
- 关卡命名从 A1.x 改为 **A2.1/A2.2/B1.1**:词表以 A2 档起步(过去式变位是 NT2 的 A2 语法主题)。
- 词库容量估算入档(见 ROADMAP:A1~15-20 / A2~30-35 / B1~45 / B2~35 / C1~15 / C2~10,可用合计 ~150-160)。

## 2026-10-01 · v0.6 状态栏炫化 + 连击倒计时

- 状态栏拆两行:关卡+目标进度胶囊(渐变填充)/ 连击芯片(发光脉冲)+ 得分(金色渐变+弹跳动画);"?"收进菜单。
- 教学横幅改为**覆盖操作坞**(按钮+留白)的绝对定位层,绝不碰棋盘;操作坞抬离屏幕底边(iOS 底部条防误触);棋盘与底坞固定间距。
- 横幅时长 3.6s → **8s**,并成为连击倒计时:横幅消失(超时/点按)连击清零;释义右置、三变位放大到 16px。
- 棋盘下方形状图例移除(用户判定无用);界面整体恢复垂直居中。

## 2026-10-01 · v0.5 图标化 + 语音 + 标准开头

- 主菜单重构为标准五项(Nieuw spel / Verder spelen / Levels / Speluitleg / Instellities),介绍文案移入玩法介绍,画风选择移入设置。
- 设置面板 8 项:画风、界面及注释语言(nl/zh,全 UI i18n)、音效音量、朗读音量、提示等待时长、颜色提示、形状提示、深色模式。
- 菜单/HUD/操作坞全部换成代码绘制 SVG 图标(去 emoji);HUD 按钮 40px。
- 教学横幅 + Web Speech nl-NL 朗读(原形→单数→复数→分词);设置显示检测到的语音名 + 试听按钮 + 无 nl 语音时的 Chrome 设置引导。
- 修复:图鉴内打开的卡片被图鉴盖住关不掉(卡片 z-index 70 > 图鉴 50)。

## 2026-10-01 · v0.45 4×9 竖屏

- 用户"完全不发挥竖屏"反馈 → 矩阵 4×4 → **4×9(16:27)**;引擎从正方形泛化为 COLS×ROWS(28 处系统性替换,逐处断言);关卡恢复 3 关 × 4 词。
- 修复:横幅用 requestAnimationFrame 触发显示,后台标签页 rAF 不触发 → 横幅永不出现且对局卡死;改为强制重流。
- 棋盘 overflow:hidden,补牌不再闪现到 HUD 上。

## 2026-10-01 · v0.4 计分制 + 手机布局

- 移除步数限制,改计分:每块 10 分 × 连锁倍数,连击加成,每关最佳分入库并在菜单显示。
- 手机竖屏布局:顶栏贴顶/操作坞贴底/图鉴变底部抽屉(safe-area 适配)。
- 词典图鉴:已收集动词可点回看卡片;每词累计消除次数(×N 徽章)入库展示。

## 2026-10-01 · v0.35 入库与部署

- 游戏移入 `tile-match/`;根跳转页;LICENSE = PolyForm Noncommercial 1.0.0;README 体系。
- GitHub 仓库 ChannonTian/gamified-learning(用户改 public),GitHub Pages 部署(root,跳转页直达游戏)。
- 修复:补牌 tile 未 appendChild → 棋盘隐形减员(最严重 bug);首次解锁误用本局记录(重玩重复弹卡);样张 SVG 缺外壳;菜单无返回出口。

## 2026-10-01 · v0.3 难度与视觉二轮(用户反馈驱动)

- 8×8 → 6×6、开局保底 ≥2 解、闲置自动提示、提示只高亮"补全连线的那一块"、修复动画中点提示被吞(排队机制)。
- 词块 4:3 横向化 + 全盘统一字号;形状改微妙(圆角/平角/切角);界面全面荷兰语。
- 移除步数压力的讨论在此埋点(v0.4 落地)。

## 2026-10-01 · v0.2 首轮用户反馈

- 无效交换静默弹回(不加提示);形状=变位类型、颜色=源动词的双提示系统确立。
- 消融展示分层:首解锁全屏卡 / 重复闪现;图鉴雏形。

## 2026-10-01 · v0.1 原型诞生

- 调研定调:三消×变位的组合无人做过;关键设计 = 匹配判定即检索练习(对抗 chocolate-covered broccoli)。
- 8×8 棋盘、12 个 A2 动词、两关;SVG 插画元素库(小人/物件/两套风格);严格三形式匹配;localStorage 存档。
- QA 方法学建立:浏览器自动化 bot(findMove+swap 循环)+ 双档截图 + console 检查。
