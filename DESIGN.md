# DESIGN.md — 对话增强

## 1. Objective
在 DSH 原会话里完成选文原位评论与引用回复，不离开阅读位置、不自动发送用户草稿。

## 2. Product Context
参考实机查看的 MiniMax Code：选文浮条 → 原位评论 → 自动生成清晰的原生引用卡片。无独立管理面板、无独立工具箱。不侵入或劫持宿主原生发送与停止按钮。

## 3. Visual Foundations
颜色仅用宿主 --dsw-alias-bg-layer-1/2、--dsw-alias-border-l1/l2、--dsw-alias-label-primary/secondary、--dsw-alias-brand-primary 和 state-error-primary。字体继承；正文 14px、辅助 12px、区块标题 14px/600。4px 基础间距，控件间 8px，区块内 12px；边框 1px，圆角 6px。

## 4. Accessibility
按钮具名，键盘可达；输入区有明确标签，focus-visible 2px accent；错误 role=alert。零非必要动画。

## 5. Voice & Tone
中文短句，直接描述动作：“引用”“批注回复”“保存批注”。

## 6. Implementation Practices
React 插槽组件；不改宿主 DOM，不覆写消息渲染器。选区原位填写评论，保存时将明确区分的原文与批注放入原生 inputActions.insertQuote 卡片；卡片由宿主保留、预览、移除并随普通消息发送。宿主原生停止与发送按钮由宿主全权负责，插件不介入回合调度。旧版未发送批注只提供按需恢复，不自动删除。

## 7. Anti-Patterns
无渐变、无功能卡片网格、无装饰 emoji。禁止用选中 DOM 位置伪造 Markdown 原文坐标。禁止覆盖或劫持宿主原生按钮。

## 8. Decision-Making
数据保全 > 操作可解释 > 与宿主一致 > 可见控件数量。优先 additive slots；原历史和附件保持不变。
