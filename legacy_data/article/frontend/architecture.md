# 风风博客开发心得（二）：前端架构与页面布局

> 本文深入探讨博客的前端实现细节。内容基于 `src/main.ts`、`src/router/index.ts` 及布局组件源码整理，已与 2025/12/12 版本代码对齐。

## 1. 架构总览：分层而治

作为一个“看脸”的项目，前端架构设计的核心在于：**如何优雅地管理复杂的视觉效果，同时不牺牲代码的可维护性。**

我们采用了经典的 Vue 3 全家桶（Vite + TS + Pinia + Router），但在结构上做了一些特殊的安排：

- **入口 (`src/main.ts`)**: 负责应用初始化，挂载 Pinia 和 Router。
- **骨架 (`MainLayout.vue`)**: 全局布局的大管家，负责壁纸、主题切换、移动端适配。
- **皮肤 (`theme.css`)**: 定义了所有的视觉变量（颜色、模糊度、光影）。
- **特效 (`ReflectionLayer.vue`)**: 一个独立的层，专门负责那个炫酷的“Aero 反光”效果。

## 2. 视觉核心：MainLayout 与 ReflectionLayer

### 2.1 MainLayout 的职责

`src/components/layout/MainLayout.vue` 是整个应用的容器。它不仅要渲染 `<router-view>`，还要一手包揽脏活累活：

- **壁纸管理**: 它根据 `isDarkTheme` 动态切换背景图，并应用平滑的过渡动画。
- **设备检测**: 通过 `window.innerWidth < 768` 判断是否为移动端，并据此切换布局模式（桌面端 vs 移动端抽屉）。
- **滚动锁定**: 当移动端侧边栏打开时，它会锁定 `<body>` 的滚动。为了防止滚动条消失导致页面“跳动”，代码里还贴心地计算了滚动条宽度并添加了 `padding-right`。

### 2.2 ReflectionLayer 的魔法

你可能注意到了，博客里的玻璃卡片上有一层流动的光影。这可不是简单的 CSS `background` 就能做到的，因为光影需要跨越多个独立的组件（标题栏、侧边栏、内容区）保持连续。

`src/components/layout/ReflectionLayer.vue` 就是为此而生的。它的实现逻辑非常硬核：

1.  **监听**: 使用 `ResizeObserver` 监听各个玻璃面板（Header, Nav, Content）的尺寸和位置变化。
2.  **计算**: 实时计算出这些面板在屏幕上的坐标，生成 `polygon(...)` 剪裁路径。
3.  **注入**: 将这些路径赋值给 CSS 变量（如 `--header-clip`, `--content-clip`）。
4.  **渲染**: 一个全屏的 `div` 使用这些剪裁路径，配合 `theme.css` 里定义的复杂渐变 `--reflection-gradients`，在正确的位置“画”出反光。

这样，光影看起来就像是附着在玻璃表面一样自然。

## 3. 路由设计：不仅是跳转

在 `src/router/index.ts` 中，我们做了一些特别的配置：

- **瞬间回到顶部**: `scrollBehavior` 被设置为 `{ top: 0, left: 0, behavior: 'instant' }`。这意味着每次切换页面，你都会立即回到顶部，而不是平滑滚动，这对于长文章的阅读体验更友好。
- **数据预加载**: 在 `beforeEach` 守卫中，我们通过检查 `to.name` 来预加载数据。比如去“友链”页时，如果 Store 里没数据，路由守卫会先调用 `friendStore.fetchFriends()`。虽然这会稍微延迟页面跳转，但能保证用户看到页面时内容已经就绪。
- **权限控制**: 访问 `/admin` 开头的路由时，会检查 `adminStore.isAuthenticated`，没登录就踢回登录页。

## 4. 样式系统：可爱的字体与 Aero

打开 `src/styles/theme.css`，你会发现这里定义了整个站点的灵魂。

- **Aero 变量**: `--aero-blur` 控制毛玻璃模糊度，`--aero-glow` 控制发光。
- **字体**: 我们引入了三款字体，其中正文和标题使用了 **"Aa偷吃可爱长大的"**。这个字体应该就是传说中吃可爱多长大的。
- **暗色模式**: 通过 `.dark-theme` 类覆盖 CSS 变量。我们没有写两套 CSS，而是重新定义了变量的值（比如把半透明白背景换成半透明黑背景），从而实现了丝滑的主题切换。

## 5. 移动端适配的小细节

在 `MainLayout.vue` 中，针对移动端做了很多降级处理：

- **禁用重特效**: 在 `@media (hover: none)` 下，我们移除了部分复杂的 `backdrop-filter` 和悬停效果，以保证在手机上的流畅度。
- **安全区适配**: 底部导航栏考虑了 `env(safe-area-inset-bottom)`，防止被 iPhone 的“黑条”遮挡。

## 6. 小结

前端不仅仅是把数据展示出来，更是要提供愉悦的视觉和交互体验。

通过 `ReflectionLayer` 的动态计算和 `MainLayout` 的细腻控制，我们成功在 Web 上复刻了类似~~也许吧OAO~~原生应用的 Aero 玻璃质感。

下一篇，我们将深入**路由与页面导航实现**，聊聊那个会打字的标题栏是怎么做出来的。

---

> 没有未来的小风酱 著  
> 2025-12-12重写 （已与源码核对，不久之后应该会重构 `ReflectionLayer` 做一些更好的效果）
