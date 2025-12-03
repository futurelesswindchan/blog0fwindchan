# 风风博客博客开发心得（二）：前端架构与页面布局

> 本文基于仓库中实际实现整理前端架构要点，引用文件示例：`src/main.ts`、`src/App.vue`、`src/components/layout/MainLayout.vue`、`src/components/layout/ReflectionLayer.vue`、`src/styles/theme.css`、`src/router/index.ts`。

## 1. 架构总览

项目采用 Vue 3 + Vite + TypeScript，结构上强调分层和复用：

- 入口：`src/main.ts`（应用初始化、全局样式、Pinia 与 Router 挂载）。
- 根组件：`src/App.vue` 基本作为路由容器，真正的页面框架由 `MainLayout` 提供。
- 主布局：`src/components/layout/MainLayout.vue` 管理壁纸、主题、导航、移动/桌面适配与页面切换。
- 反光层：`src/components/layout/ReflectionLayer.vue` 负责跨区域的高光/反射效果（使用 CSS 变量与 JS 计算 clip-path）。
- 通用组件：`src/components/common/` 放置 `TypeWriter`、`LazyImage`、`ContentTypeWriter` 等复用组件。
- 样式：全局变量与主题在 `src/styles/theme.css`，组件/页面有各自样式文件。

这些模块按职责分离，便于单元维护与增量优化。

## 2. MainLayout 的职责与结构

`MainLayout.vue` 是全局布局的中心，主要职责：

- 管理主题与壁纸（`isDarkTheme`，并持久化到 `localStorage`）。
- 检测设备（`isMobile`，源码中以 `window.innerWidth < 768` 做判断并在 `resize` 时更新）。
- 控制移动抽屉（`showMobileNav`）以及相关的滚动锁定/恢复逻辑（保存 `scrollPosition`，设置 `document.documentElement.style.overflow` 和 `paddingRight`）。
- 渲染壁纸层、`ReflectionLayer`（反光）、顶部/侧边导航与主体内容（`<router-view>`），并根据路由深度选择页面切换动画。

示意代码片段（设备检测）:

```ts
const checkDevice = () => {
  isMobile.value = window.innerWidth < 768
}
window.addEventListener('resize', checkDevice)
```

滚动锁定（移动抽屉）要点：打开抽屉时保存滚动位置并设置 overflow:hidden，关闭时恢复滚动与 paddingRight，避免界面闪动。

## 3. 三层视觉结构（壁纸、反光、内容）

布局上常把界面分为：

1. 壁纸层（`wallpaper-container` / `wallpaper`）— 管理大图或渐变背景及其过渡动画（由 `MainLayout` 的 `wallpaperStyle` 计算）。
2. 反光层（`ReflectionLayer`）— 使用 `--reflection-gradients` 等 CSS 变量作为背景，并通过 JS 计算 clip-path 将光效限定在标题栏、导航、内容区域。
3. 内容层 — 实际交互区域，包含顶部栏、侧栏（`NavPanel`）、主内容（`<router-view>`），通常使用玻璃样式（受 `--aero-*` 变量控制）。

ReflectionLayer 关键实现点：使用 `ResizeObserver` 与 `scroll`/`resize` 事件计算区域边界并写入 CSS 自定义属性（例如 `--header-clip`、`--nav-clip`、`--content-clip`），背景使用 `var(--reflection-gradients)`。

## 4. 页面布局与响应式实践

主要页面（Home、Articles、Gallery、Friends、Settings）都通过路由进行分发，页面结构与样式遵循以下规则：

- 内容容器通常居中且有圆角玻璃背景（`.glass-container`），在移动端会切换为全宽流式布局。
- 列表页（如画廊）使用 CSS Grid 适配多列；详情页（文章/角色）使用居中窄列以提高阅读体验。
- 底部导航/按钮在移动端会通过 `env(safe-area-inset-bottom)` 添加安全区内边距，避免被刘海/手势区域遮挡。
- 视觉复杂度在移动端被自动降级（`@media (hover: none)`），禁用或替换 heavy CSS（如 `backdrop-filter`）以降低渲染开销。

示意：安全区适配

```css
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .bottom-bar {
    padding-bottom: calc(env(safe-area-inset-bottom) + 8px);
  }
}
```

## 5. 路由、过渡与预加载

路由定义在 `src/router/index.ts`：

- 所有页面嵌套在 `MainLayout` 下，根路径 `''` 重定向到 `/home`，未匹配路径也重定向到 `/home`。
- `scrollBehavior()` 在导航时返回 `{ top: 0, left: 0, behavior: 'instant' }`，保证页面切换回到顶部。
- `beforeEach` 守卫会在进入某些页面（如 `Friends`、`Gallery`）时触发对应 store 的预加载（例如 `useFriendStore().fetchFriends()`），并在导航期间添加 `page-transitioning` 类；`afterEach` 会在 `TRANSITION_DURATION`（400ms）后移除该类。

示意（router scrollBehavior）:

```ts
const router = createRouter({ ... , scrollBehavior: () => ({ top: 0, left: 0, behavior: 'instant' }) })
```

页面切换过渡名在 `MainLayout` 中基于路由深度计算，用于选择不同的进出动画。

## 6. 主题系统与视觉变量

全局视觉通过 `src/styles/theme.css` 管理，关键点包括：

- CSS 变量：`--aero-blur`、`--aero-border-color`、`--aero-glow`、`--reflection-gradients`、以及多组 `--reflection-*` 来控制高光颜色与层次。
- `.dark-theme` 类会覆盖部分变量以实现暗色风格。
- 在 `@media (hover: none)` 或移动端会降低特效，避免性能问题。

这些变量在组件样式中被广泛引用，使得全局主题调整变得简单而一致。

## 7. 组件复用与性能考量

- 常用组件（`TypeWriter`、`LazyImage`、`ArticleNavigation`、`ContentTypeWriter`）集中在 `src/components/common/`，便于跨页面复用。
- 图片使用 `LazyImage` 做懒加载与失败重试，画廊使用分页/按需加载减少一次性请求。
- 重绘开销大的视觉效果在移动端自动降级，MainLayout 的 `isMobile` 与 CSS 媒体查询共同作用以保证性能。

## 8. 小结

本项目在架构上把「视觉与 UX 层」与「数据/页面逻辑层」分离：`MainLayout` 与 `ReflectionLayer` 负责视觉框架，路由与 store 负责数据与页面逻辑。通过 CSS 变量、组件化与组合式 API，实现了可维护、适配良好且视觉统一的前端架构。

---

> 没有未来的小风酱 著
> 2025-12-1 (已与全栈架构同步)
