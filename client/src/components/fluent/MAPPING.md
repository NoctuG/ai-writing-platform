# Fluent 组件映射表

- `Button` → `@fluentui/react-components` 的 `Button`（`client/src/components/fluent/button.tsx` 薄封装）
- `Card` → `@fluentui/react-components` 的 `Card` + 结构化子组件封装
- `Dialog` → `@fluentui/react-components` 的 `Dialog/DialogTrigger/DialogSurface` 薄封装
- `Tabs` → 自定义封装（保持 `Tabs/TabsList/TabsTrigger/TabsContent` API）
- `Select` → 自定义封装（保持 `SelectTrigger/SelectContent/SelectItem/SelectValue` API）
- `Tooltip` → 自定义兼容封装（调用侧 API 稳定）
- `Toast` → `sonner` Toaster 兼容导出（后续可替换为 Fluent toaster）
- `Skeleton` → 自定义骨架屏薄封装
