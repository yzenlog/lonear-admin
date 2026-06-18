# Admin Linear Demo Design Guide

本文档定义本项目后续界面开发的 UI 方向、公共组件边界和组件视觉规则。当前项目是一个基于 React + Vite + lucide-react 的后台管理系统，现有视觉来源以 `src/App.css` 和 `src/App.tsx` 为准。

## 1. 设计定位

### 产品气质

- **高密度后台管理**：优先服务日常操作、扫描、筛选、对比和批量处理，不做营销页式大留白和装饰性排版。
- **Linear-like 浅色工作台**：轻量、克制、边界清晰，界面像一个长期打开的工作空间。
- **列表优先**：事项、成员、角色、审计、集成都应优先使用列表、表格、紧凑面板承载。
- **低噪声强调**：主色只用于当前选中、主行动、关键状态和品牌识别，不大面积铺色。

### 关键词

`clean` / `dense` / `focused` / `quiet` / `precise` / `admin-first`

### 不做的方向

- 不做大圆角卡片堆叠，不做卡片套卡片。
- 不做大面积渐变、装饰光斑、插画背景。
- 不做强烈单色主题页面，蓝色是强调色，不是全屏主色。
- 不做复杂拟物阴影，阴影只用于轻微层级提示。

## 2. 设计原则

1. **功能先于装饰**：每个视觉元素都应帮助用户定位、操作、判断状态。
2. **边框建立层级**：用 `1px` 边框、浅底色和少量阴影区分区域。
3. **低圆角**：常规组件圆角控制在 `6px - 8px`，小徽标 `4px - 5px`。
4. **稳定布局**：侧边栏、顶栏、列表列宽、按钮尺寸应保持稳定，动态内容不应挤压骨架。
5. **中文后台语境**：中文文案短、直接，按钮用动词，状态用名词或短语。
6. **图标辅助识别**：使用 `lucide-react`，图标服务信息扫描，不作为装饰堆叠。

## 3. 视觉 Tokens

后续新增样式优先复用 `src/App.css` 的 `:root` 变量。除非确实扩展语义，不要在业务组件中随手新增颜色。

### 色彩

| 用途 | Token | 值 | 使用方式 |
| --- | --- | --- | --- |
| 页面背景 | `--bg` | `#fbfbfd` | 主内容底色 |
| 侧边栏背景 | `--sidebar-bg` | `#ffffff` | 左侧导航、固定底部用户菜单 |
| 弱表面 | `--surface` | `#f6f7f9` | 输入框、按钮 hover、卡片内部弱底 |
| 次级表面 | `--surface-2` | `#eef0f3` | 徽标、选项、弱分隔区域 |
| Hover 表面 | `--surface-hover` | `#f1f3f6` | 导航项、可点击行 hover |
| 默认边框 | `--border` | `#e9ebef` | 区域分隔、表格行、按钮边框 |
| 强边框 | `--border-strong` | `#dde0e5` | hover、focus、滚动条 |
| 主文字 | `--text` | `#1a1d21` | 标题、重要内容 |
| 次级文字 | `--text-muted` | `#565b66` | 导航、表格辅助列 |
| 弱文字 | `--text-dim` | `#8b909a` | 时间、计数、占位提示 |
| 主色 | `--accent` | `#1066cc` | 主按钮、选中态、品牌块 |
| 主色 hover | `--accent-hover` | `#0d57ab` | 主按钮 hover |
| 主色弱底 | `--accent-soft` | `rgba(16, 102, 204, 0.1)` | 选中行、选中导航 |
| 主色次弱底 | `--accent-soft-2` | `rgba(16, 102, 204, 0.14)` | 更强的选中或提示底 |
| 成功 | `--green` | `#1a9d62` | 在线、完成、正向变化 |
| 危险 | `--red` | `#e0413a` | 高优先级、取消、危险提示 |
| 警告 | `--amber` | `#e08a00` | 进行中、待确认 |
| 辅助紫 | `--purple` | `#8b3ce6` | 团队或标签色，不作为主主题 |

### 阴影

- `--shadow-sm: 0 1px 2px rgba(16, 24, 40, 0.04)`：卡片、头像、轻层级。
- `--shadow: 0 4px 14px rgba(16, 24, 40, 0.08)`：只用于浮层、菜单、弹窗，不用于普通页面区域。

### 字体

字体栈保持：

```css
Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
Arial, "PingFang SC", "Microsoft YaHei", sans-serif
```

字号建议：

| 场景 | 字号 | 字重 |
| --- | --- | --- |
| 页面基础 | `13px` | `400` |
| 顶栏面包屑/工作区名 | `13.5px` | `600` |
| 面板标题 | `13.5px` | `600` |
| 导航项 | `13px` | `400 / 500` |
| 按钮 | `12px - 12.5px` | `600` |
| 辅助信息 | `11.5px - 12px` | `400 / 500` |
| 指标数字 | `24px` | `700` |

规则：

- 不用 viewport 缩放字号。
- `letter-spacing` 保持 `0`，不要用负字距。
- 表格编号、计数可使用 `font-variant-numeric: tabular-nums`。

### 间距与尺寸

- 基础间距使用 `4px` 系统：`4 / 6 / 8 / 10 / 12 / 14 / 16 / 22`。
- 侧边栏宽度：`250px`，窄屏收起后 `58px`。
- 顶栏高度：`50px`。
- 图标按钮：`30px * 30px`。
- 主要按钮高度约 `30px`，横向 padding `13px`。
- 列表行垂直 padding `9px`，行高保持紧凑。
- 卡片与面板圆角 `8px`，按钮和输入框圆角 `6px - 7px`。

## 4. 应用骨架

### AppShell

当前骨架为：

- 左侧 `Sidebar`：固定宽度，独立滚动。
- 底部用户菜单：固定在侧边栏底部，不跟随导航滚动。
- 右侧 `MainPanel`：包含固定顶栏和可滚动内容区。
- 顶栏 `Topbar`：承载面包屑、通知、导出、主行动。

布局规则：

- 页面根容器使用 `height: 100vh; overflow: hidden;`，避免全页滚动破坏后台体验。
- 每个主要滚动区域都要有明确容器，如 `.sidebar-scroll`、`.content`、`.admin-content`。
- 内容区域宽度不足时，表格和列表允许内部横向滚动，不压缩到不可读。

### 响应式

断点延续现有规则：

- `<= 980px`：指标卡、集成卡从 4/3 列降为 2 列，隐藏顶栏 notice。
- `<= 860px`：侧边栏收为图标栏，文字隐藏；主按钮只保留图标；表格行纵向堆叠。
- `<= 640px`：顶栏辅助图标隐藏，Tabs 和 Toolbar 横向滚动。

新增页面必须检查这三个断点。

## 5. 公共组件定义

后续建议逐步从 `src/App.tsx` 中抽离公共组件，放入：

```text
src/components/layout/
src/components/navigation/
src/components/ui/
src/components/data-display/
src/components/forms/
```

### Layout Components

#### `AppShell`

用途：应用级布局容器。

视觉规则：

- 使用 `grid-template-columns: 250px minmax(0, 1fr)`。
- 背景使用 `--bg`。
- 不允许在 `AppShell` 内再包一层大卡片。

#### `Sidebar`

用途：主导航、工作区切换、搜索、用户菜单。

视觉规则：

- 背景 `--sidebar-bg`，右边框 `1px solid var(--border)`。
- 内部拆分为 `.sidebar-scroll` 和 `.sidebar-footer`。
- 滚动条使用细样式，thumb 使用 `--border-strong`。

#### `Topbar`

用途：当前页面上下文和页面级动作。

视觉规则：

- 高度 `50px`。
- 背景 `rgba(255, 255, 255, 0.85)` + `backdrop-filter: blur(8px)`。
- 下边框 `1px solid var(--border)`。
- 右侧动作区使用 `6px` gap。

### Navigation Components

#### `WorkspaceSwitcher`

用途：显示和切换当前工作区。

视觉规则：

- 高度由内容和 `padding: 10px` 决定，圆角 `8px`。
- logo 尺寸 `24px`，圆角 `7px`，背景 `--accent`。
- hover 使用 `--surface-hover`。

状态：

- `open`：chevron 旋转 `180deg`。
- 后续可接入 Popover，浮层阴影使用 `--shadow`。

#### `SidebarSearch`

用途：全局搜索和快捷入口。

视觉规则：

- 背景 `--surface`，边框 `--border`，圆角 `7px`。
- focus/hover 时背景切到 `--surface-2`，边框 `--border-strong`。
- 快捷键使用 `kbd`，边框 `--border-strong`，白底。

#### `NavSection`

用途：导航分组。

视觉规则：

- section title 使用 `11px / 600 / uppercase`，颜色 `--text-dim`。
- 折叠 icon 使用 `ChevronDown`，collapsed 时旋转 `-90deg`。
- 分组本身不加卡片背景。

#### `NavItem`

用途：导航入口。

视觉规则：

- 高度由 `padding: 6px 9px` + `line-height: 20px` 决定。
- 图标尺寸 `17px`，`strokeWidth: 2.1`。
- 圆角 `7px`。
- hover：背景 `--surface-hover`，文字 `--text`。
- active：背景 `--accent-soft`，文字和图标 `--accent`，字重 `500`。

#### `TeamBlock`

用途：团队导航组。

视觉规则：

- 团队头像 `15px`，圆角 `4px`，使用团队色。
- 团队名 `12.5px / 600`。
- 计数使用 `--text-dim`。

### Action Components

#### `Button`

变体：

- `primary`：用于页面最重要动作，如新建、保存、邀请。
- `secondary`：用于面板动作，如导出、查看全部。
- `ghost`：用于导航、行操作、轻量命令。

视觉规则：

- `primary` 背景 `--accent`，hover `--accent-hover`，文字白色。
- `secondary` 使用 `--surface` 背景、`--border` 边框、`--text-muted` 文字。
- 高度默认 `28px - 30px`。
- 圆角 `6px - 7px`。
- 按钮内有明确图标时，优先使用 icon + text；窄屏可只保留 icon。

#### `IconButton`

用途：通知、导出、更多、关闭、折叠等图标动作。

视觉规则：

- 固定 `30px * 30px`，圆角 `7px`。
- 默认透明背景、透明边框、文字 `--text-muted`。
- hover：边框 `--border`，背景 `--surface`，文字 `--text`。
- 必须提供 `aria-label`。

#### `FilterChip`

用途：筛选、显示、分组、排序等工具栏条件。

视觉规则：

- `padding: 5px 10px`，圆角 `6px`。
- 白底、`--border` 边框、`--text-muted` 文字。
- hover 时只增强边框和文字，不大面积变色。

### Data Display Components

#### `Tabs`

用途：同一数据集合的视图切换。

视觉规则：

- 位于顶栏下方，底部边框连到页面。
- active 使用 `2px` 底部主色线。
- count 使用 `--text-dim`，不抢主标签。

#### `Toolbar`

用途：承载筛选、显示、分组、排序、批量操作。

视觉规则：

- 高度由 `padding: 13px 22px` 决定。
- 下边框 `--border`。
- 项目之间 `8px` gap。
- 移动端允许横向滚动。

#### `DataTable`

用途：成员、角色、审计日志等结构化数据。

视觉规则：

- 外层一般放在 `AdminPanel` 内。
- 行高 `50px` 左右，行边框 `--border`。
- 主列使用 `strong`，辅助信息使用 `span` + `--text-muted`。
- 最后一行不显示底部边框。

#### `IssueRow`

用途：事项列表核心行组件。

视觉规则：

- 使用 grid 固定列，保证扫描稳定。
- hover 背景 `--surface`。
- selected 背景 `--accent-soft`。
- 标题单行省略，完成状态降权并加删除线。
- 优先级、ID、更新时间、负责人等辅助信息保持弱化。

#### `MetricCard`

用途：概览页关键指标。

视觉规则：

- 白底、`1px` 边框、`8px` 圆角、`--shadow-sm`。
- 图标底使用 `--accent-soft`，图标色 `--accent`。
- 数字 `24px`，变化值用语义色。

#### `AdminPanel`

用途：后台模块容器，如成员、权限、审计、设置。

视觉规则：

- 白底、`1px solid var(--border)`、圆角 `8px`、`--shadow-sm`。
- 内部 Header 高度约 `48px`，底部边框。
- 不在 `AdminPanel` 内再放大卡片作为主要区域。

#### `IntegrationCard`

用途：集成、插件、API token 等小型入口。

视觉规则：

- 适合 2-3 列网格。
- 图标块 `34px`，圆角 `7px`，背景 `--surface`。
- hover 时边框增强、背景轻微变化。

#### `EmptyState`

用途：无数据、无搜索结果。

视觉规则：

- 文案短，例如“没有匹配的事项”。
- 使用 `--text-dim`，不要大插画。
- 放在列表或面板内部，保持上下 padding `24px - 32px`。

### Feedback Components

#### `Badge`

用途：导航计数、数量提示。

视觉规则：

- 高度约 `16px`，横向 padding `6px`。
- 圆角 `5px`。
- 默认 `--surface-2` 背景、`--text-dim` 文字。
- active 导航内可切为白底 + `--accent`。

#### `StatusPill`

用途：Backlog、待办、进行中、已完成、已取消等状态。

视觉规则：

- 高度约 `20px`，`padding: 2px 8px`。
- 圆角 `5px`。
- 内含 `6px` 状态点。
- 颜色使用状态语义，不随业务随意新增。

状态色建议：

- Backlog：灰底 `#eef0f3`，文字 `--text-muted`。
- Todo：灰底 `#e7e9ee`，文字 `#4a4f59`。
- Progress：`rgba(224, 138, 0, 0.13)`，文字 `#b06a00`。
- Done：`rgba(26, 157, 98, 0.13)`，文字 `#157a4c`。
- Cancelled：`rgba(224, 65, 58, 0.12)`，文字 `#c32f29`。

#### `Avatar`

用途：成员、负责人、工作区标识。

视觉规则：

- 普通尺寸 `26px`，小尺寸 `24px`。
- 圆形成员头像，团队小头像可使用 `4px` 圆角。
- 背景色来自团队或用户配置，文字白色。

#### `Notice`

用途：顶栏轻量状态反馈，如“工作区已同步”。

视觉规则：

- 顶栏右侧，最大宽度 `180px`。
- 使用 `--text-dim`，`12px`。
- 移动端隐藏。

### Form Components

#### `FormField`

用途：设置页、编辑面板。

视觉规则：

- label 使用 `12px / 600 / --text-muted`。
- input/select 高度 `34px`。
- 背景白色、边框 `--border`、圆角 `7px`。
- 横向 padding `10px`。

状态：

- focus：边框 `--accent`，外层可加 `0 0 0 3px var(--accent-soft)`。
- error：边框使用 `--red`，错误文案 `12px`。
- disabled：背景 `--surface`，文字 `--text-dim`，cursor 默认或 not-allowed。

## 6. 交互状态规范

所有可交互组件至少包含：

- 默认态：低噪声，边框和文字清晰。
- hover：背景或边框轻微增强。
- active/selected：使用 `--accent-soft` 和 `--accent`。
- focus-visible：必须可见，建议 `outline: 2px solid var(--accent)` 或主色弱环。
- disabled：降低对比度，禁用 pointer 行为。
- loading：按钮保留原尺寸，文字可改为“保存中...”等短文案。

动效：

- 常规 transition 控制在 `0.1s - 0.15s ease`。
- 只做颜色、背景、边框、轻微旋转，不做大幅位移。

## 7. 图标规则

- 默认使用 `lucide-react`。
- 常规图标尺寸：
  - 导航：`17px`。
  - 顶栏：`17px`。
  - 小按钮/筛选：`13px - 14px`。
  - 卡片图标：`18px`。
- 默认 `strokeWidth` 使用 `2.1`，强调图标可用 `2.4`。
- 不手写 SVG，不用 emoji 作为功能图标。
- 图标按钮必须有可访问名称，如 `aria-label`。

## 8. 文案规范

- 按钮：使用动词或动宾短语，如“新建”“保存”“导出”“邀请成员”。
- 状态：使用短状态，如“待办”“进行中”“已完成”“已取消”。
- 空状态：说明结果，不解释系统，如“没有匹配的事项”。
- 顶栏 notice：用完成时态，如“工作区已同步”“成员 已打开”。
- 避免长句塞入按钮、徽标、表格列；必要时省略并用 tooltip 承载完整信息。

## 9. 页面类型约定

### 列表型页面

适用：事项、成员、审计日志、角色列表。

结构：

1. `Topbar`
2. 可选 `Tabs`
3. 可选 `Toolbar`
4. `DataTable` 或 `IssueList`

规则：

- 列表是主体，不用额外 hero。
- 过滤、排序、分组放在 toolbar。
- 数据行 hover 可点击，选中态用主色弱底。

### 概览型页面

适用：工作区概览、管理首页。

结构：

1. `MetricGrid`
2. 近期活动或关键表格
3. 次级入口卡片

规则：

- 指标卡数量控制在 3-4 个。
- 卡片只承载独立摘要，不要将整个页面分成大卡片墙。

### 设置型页面

适用：系统设置、权限配置、集成配置。

结构：

1. `AdminPanel`
2. `PanelHeader`
3. `FormField` 列表或分组表格

规则：

- 表单宽度建议 `560px` 左右。
- 保存动作放在 header 右侧或底部 sticky 操作区，避免重复。

## 10. 可访问性与工程约束

- 可点击元素使用 `button` 或正确的交互标签，不用 `div` 模拟按钮。
- 输入框必须有 label 或 `aria-label`。
- 图标按钮必须有 `aria-label`。
- 列表、tabs 等复合组件保留合理 role，如 `role="tablist"`、`role="tab"`。
- 键盘快捷键展示必须和真实行为一致，例如 `Cmd/Ctrl + K` 聚焦搜索。
- 新增颜色、尺寸、阴影时先判断是否能复用 token。
- 不在业务 JSX 内硬编码大量视觉值；内联样式仅用于数据驱动颜色，如团队色、标签色。

## 11. 后续组件抽离建议

建议按以下优先级抽离，保证后续页面复用：

1. `components/ui/Button.tsx`
2. `components/ui/IconButton.tsx`
3. `components/ui/Avatar.tsx`
4. `components/ui/Badge.tsx`
5. `components/ui/StatusPill.tsx`
6. `components/layout/AppShell.tsx`
7. `components/layout/Topbar.tsx`
8. `components/navigation/Sidebar.tsx`
9. `components/navigation/NavSection.tsx`
10. `components/data-display/DataTable.tsx`
11. `components/data-display/MetricCard.tsx`
12. `components/forms/FormField.tsx`

抽离时保持现有 className 和 CSS token 优先，避免为了组件化重写视觉系统。

## 12. 新界面开发 Checklist

开发新页面前检查：

- 是否沿用 `AppShell + Sidebar + Topbar`。
- 是否复用现有颜色 token，避免新增随意 hex。
- 是否使用 `lucide-react` 图标，并控制尺寸和 stroke。
- 是否遵守 `6px - 8px` 圆角。
- 是否避免卡片套卡片。
- 是否在 `980px / 860px / 640px` 下可用。
- 表格或列表内容过长时是否省略、换行或横向滚动。
- 图标按钮、输入、tabs 是否具备基础可访问属性。
- 空状态、加载态、错误态是否有简短文案。

## 13. 一句话方向

后续所有界面都应像一个“轻、快、可长期使用的后台工作台”：白底、细边框、低圆角、高信息密度、少装饰、强扫描、主色克制。
