# ROADMAP.md — 路线图(优先级由用户定)

> **2026-10-02 转向(用户拍板)**:本任务线**只做 link-match(连连看)**。tile-match 冻结在 v0.87(已上线,已交付功能全部保留),不再排新迭代;其专属候选(四消对照分支等)封存,见文末。

## 云端与产品化(v1.17–v1.19,2026-10-05 全部上线 ✅)

- ~~Cloudflare 登录 + 云存档(用户名密码)~~ ✅ v1.17:Workers 静态资产+`worker.js` 路由+D1;localStorage 主存档+云合并,进度永不因更新清零。
- ~~欢迎页登录前置(登录优先+游客兜底)~~ ✅ v1.18;~~Google 登录(OAuth)~~ ✅ v1.18;~~设置面板补 Google 入口(老玩家)~~ ✅ PR#4。
- ~~隐私政策 / 服务条款页~~ ✅ PR#5;~~公开落地页(修 Google 发布验证三连拒)~~ ✅ v1.19;**Google OAuth 已 Publish 成功**(用户操作)。
- ~~自定义域名~~ ✅ `play.channon-tian.com`(Workers custom domain)。
- ~~个人档案页 + 可改显示名(不查重,形容词×名词随机组合)~~ ✅ v1.19;~~删除账号(两步确认,连带云端数据)~~ ✅ v1.19。
- ~~每日挑战排行榜(UTC 0:00 翻日)~~ ✅ v1.19:游客可看不可上榜;登录后自动补报当天最高分(v1.19 追修:分数感知补报,防"当天更高分被去重闸挡掉")。

## link-match 现状基线(v1.5,已上线)

- 玩法:动词**原形 ↔ 单一变位**经典连连看(≤2 折角 + 外圈路径);每关专练一种形式。
- 内容:**108 词 / 51 关**——形式分组(每档内先单数各轮、再复数、最后分词;轮数=⌈池/7⌉,每词每种形式至少一次);每关 7 词 × 2 对 = 14 对;4×7 棋盘 + 外圈连线带。
- 模式:关卡 + 无尽 + 每日挑战(180s/日期种子/每日一次)+ 生存(每对间 15s 续命);盘下词行(点击朗读)。
- 引擎:BFS 寻路(坐标约定见 AGENTS 坑记录)、词对校验、布盘可解性模拟、卡死重排 + 相邻成对兜底;教学横幅 + TTS 朗读 + 连击计分 + 消除动效(描线/粒子/弹字)。
- 回归:`node link-match/test/path-engine.test.mjs`(改路径引擎必跑)。
- 地址:https://channontian.github.io/gamified-learning/link-match/(静态镜像;正式站 play.channon-tian.com)

## 下一波(候选,优先级用户定)

### 1. 账号体系补全(云端线的自然延续)
- **密码找回**:现在密码忘了账号就找不回(无邮箱验证/重置流程)——需要接邮件服务(如 Resend 免费档)或改 magic-link 登录。
- **账号关联**:用户名密码账号 ↔ Google 账号绑定(现在并存为两个身份,靠合并规则兜底不丢数据)。
- **排行榜防刷**:分数由客户端上报,理论可伪造——加合理性校验(时长→分数上限)或对局回放校验。
- Apple 登录(需 $99/年 开发者账号,已买域名后可行);排行榜全时段榜/连续天数。

### 2. 内容铺量(主体)
- B2/C1 词池与档位(词库容量估算见下表);插画补齐(图鉴中部分词仍是首字母纹章 fallback)。
- demo 定稿后把 demo 专属修复**同步回 link-match 主版**(冻结政策,逐项过)。

### 3. 竞品调研得出的提升项(2026-10-04,详见 docs/RESEARCH-competitors.md,待拍板)
- P1 连击里程碑庆祝(v1.7 已在试验关 A1.1/A1.2 落地,**全量铺开待试玩定夺**)+ P3 交互式首教学(同左)+ P5 分数飞行 + P6 清盘彩带(v1.7 试验)。
- P2 主题皮肤系统(现已有 Sketch/Post-it 双主题,扩皮肤池);P4 进度仪式感(档位毕业页、图鉴完成度、每日连续天数)。
- 远期候选:Onnect 式"定时洗牌"硬核模式;明确不抄:energy/广告/付费墙/near-miss 操控。

### 4. 平台增强
- PWA/manifest(单文件天然离线,加 manifest 可安装到桌面)。
- 更多界面语言(i18n 词典结构已就绪)。
- Google OAuth 同意屏幕收尾:homepage URL 改 `https://play.channon-tian.com/`、应用名统一 "Koppelen"(Search Console 验证后 24h 重试)。

## 词库容量估算(2026-10-01,两产品共用词库;铺量时用 NT2Lex 精确校准)

荷兰语强变化/不规则动词总量约 **200-250**(Onzetaal "200+",含前缀派生);剔除古旧/极罕见/纯书面后,游戏可用约 **150-160**:

| 档 | 可用词(估) | 例 |
|---|---|---|
| A1 | ~15-20 | zijn, hebben, gaan, komen, zien, geven, nemen, eten, drinken, lopen, zitten, liggen, staan, lezen |
| A2 | ~30-35 | blijven, schrijven, spreken, beginnen, begrijpen, brengen, denken, vinden, helpen, kopen, krijgen, vragen, wassen, dragen, verliezen, winnen, hangen |
| B1 | ~45 | bedriegen, bederven, bevelen, bewegen, gelden, smelten, zwellen, wijken, weven, trekken, zwijgen, wijzen, werpen |
| B2 | ~35 | 较低频书面词 |
| C1 | ~15 | 低频文学词 |
| C2 | ~10 | 古旧词(delven, erven 类) |

link-match 每关 7 词 × 轮转取池,同池可支撑的关卡数远多于三消(每词只占用 2 格),扩池前 A1-B1 已够 20+ 关轮换。

## 封存(随任务线转向,不再排期)

- **tile-match 四消对照分支**(原形+三变位同消)——**已试玩否决(2026-10-04,用户)**:原型 `four-match/`(v0.2)已建并上线,但盘面四连太难自然拼出、频繁死局重排("一直在重置");路线暂时否掉,玩法回归三消。原型与教训留档(复盘见 DEVLOG),重启需先解决中盘供给机制。
- **原形百搭块**(易混淆,曾明确否决)。
- tile-match 其余打磨项(音效层次、B2/C1 词池、横幅时长设置)随冻结一并搁置;历史三消密度/关卡推论见本文件在 git 历史(7a65f5e 之前)中的版本。

## 已知边界(暂不处理)

- Chrome 无 nl 语音时的朗读质量取决于系统语言包(设置内有引导与试听)。
- 特小屏(iPhone SE 级)棋盘按高度收缩,字号随格子变小(实测仍完整显示)。
