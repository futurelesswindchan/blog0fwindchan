# 风风博客博客开发心得（七）：主题与美术风格实现

> 本篇将基于仓库中的真实实现细节（`src/styles/theme.css`、`src/components/layout/MainLayout.vue`、`src/components/layout/ReflectionLayer.vue`）说明主题与视觉实现要点，包含变量名、切换逻辑与降级策略，便于开发者快速定位代码。

## 1 设计目标

视觉以 Aero 玻璃拟态为核心：通透、反光、柔和渐变与分层发光。目标仍然是兼顾桌面与移动端体验，并通过 CSS 变量便捷调整全局效果。

## 2 实际的全局变量（在 src/styles/theme.css）

项目把主题相关的变量放在 `:root`（`src/styles/theme.css`），部分关键变量名如下（不完全列表）：

- `--aero-blur`：用于 `backdrop-filter` 的模糊量（例如 `blur(4px)`）。
- `--aero-border-color`、`--aero-glow`：边框色与全局发光（box-shadow）。
- `--aero-animation`：全局动画 timing 函数。
- `--reflection-angle`、`--reflection-1` .. `--reflection-7`、`--reflection-gradients`：用于反光层的角度与多组渐变色（ReflectionLayer 使用这些变量作为背景）。
- `--light-bg-base` / `--dark-bg-base`、`--light-text` / `--dark-text`、`--dark-border`：亮/暗主题的基础色。
- `--page-transition-duration` / `--page-transition-timing` / `--page-transition-blur`：页面切换过渡的时长、曲线和过渡时的模糊效果。

这些变量在 `theme.css` 中有完整定义，暗色主题会覆盖一组 `--reflection-*` 变量以调和配色。

## 3 玻璃容器与交互（.glass-container）

代码中所有主要容器（标题栏 `.title-bar`、内容区 `.content-view`、移动端的 `.mobile-header` 等）都带有 `.glass-container`，其主要实现点：

- 使用 `backdrop-filter`（桌面端）结合 `border`、`box-shadow` 实现玻璃效果。变量由 `--aero-blur`、`--aero-border-color`、`--aero-glow` 控制。
- 在支持 hover 的设备上提供悬停增强（`:hover` 下改变背景、阴影、轻微位移）；在触控设备（`@media (hover: none)`）里自动降级，移除 `backdrop-filter` 和重度 transform，以节省性能。
- 为移动端提供 `:active` 样式以保证触觉反馈。

示例（项目内实现的要点）：

```css
.glass-container {
  backdrop-filter: var(--aero-blur) brightness(1.08);
  border: 1px solid var(--aero-border-color);
  box-shadow:
    var(--aero-glow),
    0 6px 30px rgba(0, 0, 0, 0.15);
  transition: all 0.3s var(--aero-animation);
}
@media (hover: none) {
  .glass-container {
    backdrop-filter: none;
    transform: none;
  }
}
```

## 4 反光层（ReflectionLayer）与 clip-path

反光通过 `src/components/layout/ReflectionLayer.vue` 实现：

- 该组件在页面最上层渲染若干 `.reflection-mask` 区块（`header-mask`、`nav-mask`、`content-mask`），并通过 JS 计算目标元素（标题栏、导航、内容区）的 bounding rect，将其转换为 CSS `--*-clip`（polygon）变量。
- `ReflectionLayer` 的每个 mask 背景就是 `--reflection-gradients`（在 `theme.css` 中定义的多重 linear-gradient）——达到多带彩色反光的视觉效果。
- 组件会监听 resize、scroll 以及使用 `ResizeObserver` 跟踪元素尺寸变化，从而动态更新 clip-path，保证反光与元素位置对齐。

简化说明：反光的颜色/角度由 CSS 变量控制，位置由 `ReflectionLayer` 用 clip-path 实时对齐。

## 5 主题切换（MainLayout.vue 的实现细节）

主题切换在 `src/components/layout/MainLayout.vue` 中用 `isDarkTheme` 控制：

- 初始状态从 `localStorage.getItem('theme')` 读取（值为 `'dark'` 或 `'light'`）。
- 切换函数 `toggleWallpaper()` 会翻转 `isDarkTheme` 并将新值写回 `localStorage`；组件根节点使用 `:class="{ 'dark-theme': isDarkTheme }"`，CSS 中通过 `.dark-theme` 覆盖或替换部分变量（例如对 `--reflection-*` 的重新赋值和暗色容器背景）。
- 同时，切换还会替换壁纸图片（`lightWallpaper` / `darkWallpaper`）以加强视觉差异。

代码片段（逻辑要点）：

```ts
const isDarkTheme = ref(false)
onMounted(() => {
  isDarkTheme.value = localStorage.getItem('theme') === 'dark'
})
function toggleWallpaper() {
  isDarkTheme.value = !isDarkTheme.value
  localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light')
}
```

## 6 字体与图标（实际文件声明）

项目在 `src/styles/theme.css` 中声明了多组 `@font-face`：示例包括 `Aa偷吃可爱长大的`、`JetBrainsMono`、`FleurDeLeah`。`body` 的字体栈使用了这些自定义字体优先级加载。

图标方面使用 FontAwesome（在组件中以 `<i class="fas fa-...">` 或 `font-awesome-icon` 调用），UI 按钮、导航条等广泛应用图标以提升辨识度。

## 7 细节与降级策略（实际行为）

- 移动端自动降级：`@media (hover: none)` 分支里禁用了 `backdrop-filter` 并移除复杂 transform，以避免在低性能设备或移动端出现卡顿。
- 滚动时禁用壁纸过渡（`wallpaper.no-transition`），避免滚动时产生重绘压力。
- 滚动条与导航的样式在 `theme.css` 中进行了美化（`::-webkit-scrollbar` 系列），并在暗色主题下调整 thumb 颜色。

## 8 TODO

- 如果要让主题在首次加载时更平滑，可在 HTML 根节点或 `index.html` 中插入一段脚本，优先从 `localStorage` 恢复 `dark`/`light` 类，避免首次渲染的“闪烁”。
- 若需更灵活的主题：考虑把核心颜色抽成 CSS custom properties 的两个集合（light/dark），并在 JS 中只切换 `data-theme="dark"` / `data-theme="light"`，减少大量重复样式覆盖。

## 9 已更新的要点速览

- 主题变量、反光实现、字体、壁纸切换与降级策略均以 `src/styles/theme.css`、`src/components/layout/MainLayout.vue` 和 `ReflectionLayer.vue` 中的实现为准。
- 主题切换通过 `isDarkTheme` + 根节点 `dark-theme` 类 + `localStorage` 实现（同时切换壁纸图片）。
- 反光使用 `--reflection-gradients` 与 `ReflectionLayer` 动态 clip-path 对齐。

---

> 没有未来的小风酱 著
> 2025-12-1 (已与全栈架构同步)
