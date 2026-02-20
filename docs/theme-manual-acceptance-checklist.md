# 主题深浅色手工验收 Checklist

> 适用页面：Home、Dashboard、PaperList、PaperEdit（含对话框/空态/图表区块）。

## 1) 文本可读性（Text）
- [ ] 标题（H1/H2）在 light/dark 都清晰可读，无发灰、发虚。
- [ ] 次级说明文本（muted/secondary）在 dark 下仍具备足够对比度。
- [ ] 按钮文字（primary/outline/destructive）在 hover/active/disabled 状态可辨识。
- [ ] 状态标签文本（成功/进行中/失败）颜色与背景组合在深浅色均可读。

## 2) 边框与分割（Border/Stroke）
- [ ] 卡片边框在 dark 下不会“消失”或过亮刺眼。
- [ ] 表格分割线、弹窗边框、输入框边框在 light/dark 层次明确。
- [ ] focus ring 在键盘导航下可见，且不与背景混淆。

## 3) 卡片与容器（Card/Surface）
- [ ] 页面背景渐变（from-background/via-accent/to-background）在两种主题过渡自然。
- [ ] 卡片 hover（如 PaperList 卡片）在 light/dark 下都有明显反馈。
- [ ] sticky header + backdrop blur 在 dark 下不出现文字糊底。

## 4) 空态（Empty State）
- [ ] 空态图标、标题、说明文案在 dark 下保持层次。
- [ ] 空态主按钮与次按钮在两种主题下都满足可点击感与可读性。

## 5) 弹窗与抽屉（Dialog/Sheet）
- [ ] 删除确认弹窗、版本历史、LaTeX 导出弹窗在 dark 下对比正常。
- [ ] 弹窗遮罩与前景内容分离明确，无“贴背景”现象。
- [ ] 关闭、取消、确认按钮在 light/dark 均可快速识别。

## 6) 图表与数据可视化（Charts）
- [ ] Dashboard 分布图卡片在 light/dark 下轴线、标签、图例可读。
- [ ] 图表空态与图表正文切换时，无颜色跳变异常。
- [ ] 统计数字与趋势文本在深色背景下不过曝或过暗。

## 7) 主题切换体验（Theme Toggle）
- [ ] 点击主题切换按钮后，页面 token 与控件样式立即切换。
- [ ] 刷新页面后主题可从 localStorage 恢复。
- [ ] 切换按钮 aria-label 与图标方向（切到深色/浅色）保持一致。

## 8) 无障碍与一致性（A11y/Consistency）
- [ ] 主要交互元素有语义标签（aria-label、aria-pressed 等）。
- [ ] light/dark 下同一组件的空间布局不发生抖动。
- [ ] 键盘 Tab 导航在两种主题下均可识别当前焦点。
