# RESEARCH-competitors.md — 同类热门消除游戏调研(2026-10-04)

> 目的:看 App Store / Google Play 上最热、好评最多的同类型小游戏(不限教育类)的美术与交互设计,对照 link-match 找提升点。调研当天的评分/收入数据来自公开报道与榜单追踪,会随时间变化。

## 一、调研对象与定位

| 游戏 | 品类/与我们的关系 | 量级 |
|---|---|---|
| Royal Match (Dream Games) | 消除类标杆,美术/交互基准 | 顶级畅销;D1 留存 ~39.5%(Deconstructor of Fun) |
| Candy Crush Saga (King) | 消除类长青,juice 与奖励心理教科书 | 常青;near-miss 心理有学术论文 |
| Match Factory! (Peak/Zynga) | 三消 tile 品类当前最赚钱之一(峰值 $6.7M/月) | 高生产值动效+社交 meta |
| Zen Match (Moon Active) | 放松系 tile match(iOS ~4.6) | "zen"美学品牌、皮肤/主题解锁 |
| Onnect (Infinity Games) | **连线对玩法(与 link-match 最近亲)** | 极简禅意 Onet 重制 |
| Wordscapes (PeopleFun) | **语言学习+拼词,定位与我们最像**(iOS ~4.9) | 品类口碑之王 |
| Block Blast! | 2025 全球下载第一(3.56 亿) | 极简+无摩擦留存 |

## 二、值得抄的设计(按来源)

### 美术/表现
1. **核心盘面的"润泽感"是第一竞争力**(Royal Match/Match Factory 的共识):消除瞬间多层反馈叠加——缩放挤压、粒子、音高随连击递增、屏幕微震。理论来源:"Juice it or lose it" 讲座(juice=为可用游戏叠加动画+声音层)。
2. **皮肤/主题解锁**(Zen Match 系普遍做法):tile 皮肤、背景主题、季节场景作为长线视觉目标;Mahjong 系甚至五套手绘皮肤。纯装饰、不碰玩法。
3. **放松系美术即品牌**(Zen Match/Wordscapes/Onnect):柔和背景、"wind down"定位、极简禅意;Wordscapes 4.9 分证明"学习感+消除+无压力"能拿品类最高口碑。
4. **动画即信息**(Royal Match 经验文):资源飞入/飞出存储的双向流动动画,让经济系统不言自明;任务完成瞬间播放完成动画再切新任务;角色/头像对局势有情绪反应(临近失败时 King 紧张)。

### 交互/结构
5. **无挫败 onboarding**(Royal Match):早期关卡结构上不会失败、无长教程、HUD 极简;靠"成功中学习"过新手期。
6. **两个动作的 meta**:升级装饰 or 打下一关,从第一分钟就定死;困惑时做减法(简化)而不是加解释文字。
7. **一切活动喂给主玩法**:所有事件都通过同一个"Play"按钮推进,不另开模式/货币;活动只是叠在主线上的可选目标。
8. **快速重开 + 只在失败时刻给选择**(Candy Crush/Royal Match):不强制广告、结算不拖沓。
9. **社交/目标 meta**(Match Factory):clan、排行榜、目标设定负责长线留存。
10. **连线品类的进阶手法**(Onnect):后期盘面会移动/洗牌,打破静态;品类整体定位是"专注训练+放松"。

### 心理(要选择性吸收)
11. **近失(near-miss)与变率强化**是 Candy Crush 类的成瘾引擎(学术+英国议会报告点名)。**我们不做挫败操控**;但"差一点"的紧张感可以正向用于生存模式的倒计时。

## 三、对照 link-match(v1.6 现状)

**已有的、不必羡慕的**:纸感美术语言(和放松系同路但更有辨识度)、弱提示哲学、形式=形状/动词=颜色的编码、消除 juice 基础(描线+粒子+弹字+闪亮 pop+双音阶)、教学横幅+朗读、词行、四模式(51 关/无尽/每日/生存)、图鉴计数、三语言、零广告零内购。

**差距 → 提升点(全部不引入付费/广告)**:

| # | 提升 | 对标 | 说明 |
|---|---|---|---|
| P1 | **连击里程碑庆祝** | Candy Crush 连锁升级 | ×3/×5/×8 递进:更亮的闪、全盘轻波纹、和弦音;连击是我们唯一"cascade 替代物",值得给它仪式感 |
| P2 | **主题皮肤系统** | Zen Match 皮肤/主题 | 3 套起步:纸(默认)/黑板粉笔/暮色夜灯,纯 CSS 变量即可;用**收集词数**解锁(非付费);与插画补齐任务协同 |
| P3 | **交互式首教学** | Royal Match 无教程 | 现在 Speluitleg 是文字;改为 3 步演示(点原形→点变位→连线自己画出来),语境化代替说明文 |
| P4 | **进度仪式感** | Wordscapes/Royal Match | 档位毕业页(A1 af! 🎉)、图鉴完成度百分比、每日连续天数(纯展示) |
| P5 | **分数流动画** | Royal Match 资源双向流动 | 得分从消除位置飞向分数计;让"分数经济"可感 |
| P6 | **清盘终章 + 触觉** | Candy Crush 结算 | 清盘时剩余动效分层播放;Android 加 navigator.vibrate(iOS Safari 不支持,注明) |

**明确不抄**:energy/体力墙、插屏广告、付费墙关卡(Zen Match 被骂的点)、near-miss 挫败操控——与教育定位冲突。

## 四、来源

- Deconstructor of Fun — Royal Match: The New King from Turkey: https://www.deconstructoroffun.com/blog/2021/3/21/royal-match-the-new-king-from-turkey
- Funovus — Royal Match Dominates Match-3: What Can ALL Designers Learn: https://www.funovus.com/blogs/royal-match-dominates-match-3-what-can-all-designers-learn
- Juice it or lose it 演示: https://longwelwind.net ;Vlambeer screen-shake 综述: https://valdemird.com
- Near-miss 研究(Candy Crush Sweet Tooth, Journal of Gambling Studies)与英国议会报告(2019)
- Match Factory 收入与 meta(premortem.games 2024-02);Zen Match/Onnect/Wordscapes 评分:App Store/Google Play 页面与榜单追踪(Sensor Tower/Chartoo,2026-10 查证)
