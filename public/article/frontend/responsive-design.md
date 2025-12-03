# 风风博客博客开发心得（六）：响应式与移动端适配

> 本文基于项目源码（`src/components/layout/MainLayout.vue`、`NavPanel.vue`、`MobileNavPanel.vue`、`src/styles/*` 等）更新，补充代码级实现细节与降级策略，方便开发者直接对照代码阅读。

## 1 响应式策略与断点

项目沿用移动优先 + 断点渐进增强的思路。关键实现点：

- 全局断点：CSS 中大量使用 `@media (max-width: 768px)` 来定义移动端样式。
- JS 层面：通过 `isMobile`（在 `MainLayout.vue` 中为 `ref`）判断设备宽度并在运行时切换渲染结构（`window.innerWidth < 768`）。

示例（节选自 `MainLayout.vue`）：

```ts
const isMobile = ref(false)
const checkDevice = () => {
  isMobile.value = window.innerWidth < 768
}
onMounted(() => {
  checkDevice()
  window.addEventListener('resize', checkDevice)
})
onUnmounted(() => {
  window.removeEventListener('resize', checkDevice)
})
```

此检查既保证样式在断点处生效，也允许在 JS 中决定是否渲染桌面侧栏或移动抽屉等不同结构。

## 2 桌面 与 移动 的关键差异（实现细节）

- 桌面端：采用“壁纸层 + 反光层 + 内容层”结构。侧边导航 `NavPanel` 固定显示并支持收起/展开（`isExpanded`）。
- 移动端：顶部固定 `mobile-header`，使用 `MobileNavPanel` 作为抽屉导航，配合遮罩 `.mobile-overlay`，通过 `showMobileNav` 控制显示与关闭。
- 路由重定向策略：未匹配路由会重定向到 `/home`，保证移动端直接访问链接不会出现空页面（见 `src/router/index.ts`）。

## 3 抽屉导航的滚动锁定与恢复（防止穿透）

打开移动抽屉时需要锁定页面滚动并在关闭后恢复原位置，MainLayout 的实现要点：

```ts
let scrollPosition = 0
const lockScroll = () => {
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
  document.documentElement.style.overflow = 'hidden'
  document.documentElement.style.paddingRight = `${scrollbarWidth}px`
}
const unlockScroll = () => {
  document.documentElement.style.overflow = ''
  document.documentElement.style.paddingRight = ''
}

watch(showMobileNav, (isOpen) => {
  if (isOpen) {
    scrollPosition = window.scrollY
    lockScroll()
  } else {
    unlockScroll()
    window.scrollTo(0, scrollPosition)
  }
})
```

注意：`scrollbarWidth` 在组件挂载时计算一次以避免多次触发重新布局。

## 4 视觉降级与性能友好策略

- 移动端降级：在 `src/styles/theme.css` 中使用 `@media (hover: none)` 来移除高开销特效（例如 `backdrop-filter`、复杂 `transform`、`will-change`），以减轻低端设备负担。
- 禁用壁纸过渡：`.wallpaper.no-transition` 在滚动或需要时被添加以禁用背景图片过渡，减少重绘开销。
- ReflectionLayer 优化：`ReflectionLayer.vue` 只在桌面端渲染 `nav-mask`（`v-if="!isMobile"`），并使用 `ResizeObserver` + `scroll/resize` 事件更新 clip-path，从而避免在移动端进行不必要的布局计算。

## 5 视窗与安全区处理（iOS 安全区与动态视口）

- 动态视口：部分样式使用 `100dvh`（动态视口高度）以解决移动浏览器地址栏变化带来的高度抖动（代码中可见 `height: 100dvh` 的注释和使用）。
- 安全区适配：在 `src/styles/articleNavigation.css` 与 `src/styles/articleContent.css` 中使用了 `@supports (padding-bottom: env(safe-area-inset-bottom))` 分支，为 iPhone 等设备添加 `padding-bottom: calc(... + env(safe-area-inset-bottom))`，确保底部导航/内容不会被系统安全区遮挡。

示例（文章导航样式中）：

```css
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .bottom-nav {
    padding-bottom: calc(0.8rem + env(safe-area-inset-bottom));
  }
}
```

## 6 响应式样式示例与交互优化

- 按钮/卡片在移动端采用更大点击区域（固定高度 48px）并移除复杂 hover 光效（在 `@media (max-width: 768px)` 中禁用）。
- 页面切换时使用 `page-transitioning` 类配合 CSS 过渡（模糊、遮罩）实现一致的动画节奏，路由中 `TRANSITION_DURATION = 400` 与 CSS 保持一致。

典型 media 查询（节选自 `src/styles/articleContent.css`）：

```css
@media (max-width: 768px) {
  .article-view {
    margin: 0;
    padding: 0.5rem;
  }
  .article-content {
    padding: 1rem;
    border-radius: 8px;
  }
}
```

## 7 TODO

- 首屏闪烁（主题/壁纸切换）：建议在 `index.html` 或根组件初始化时尽早从 `localStorage` 恢复主题类（`dark-theme`）和壁纸 URL，避免首次渲染闪烁。
- 预加载与交互延迟：抽屉打开时如需预加载资源（如头像、缩略图），应使用懒加载并在视觉层先展示骨架，避免阻塞动画。
- 更稳健的检测：如果需更精细的断点或横竖屏判断，可以结合 `matchMedia('(max-width: 768px)')` 或监听 `visualViewport` 提供的变化。

## 8 小结

项目在响应式实现上结合了 CSS 媒体查询与运行时检测（`isMobile`），并在移动端做了明确的性能降级（移除模糊、禁用 heavy transforms、使用 100dvh 与 safe-area 兼容处理）。这些做法保证了桌面精致视觉与移动端流畅交互之间的平衡。

---

> 没有未来的小风酱 著
> 2025-12-1 (已与全栈架构同步)
