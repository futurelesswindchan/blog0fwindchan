# Vol.1 赛博地基：构建“会呼吸”的网页图层！

> **摘要**：在真正开始写业务代码之前，小风酱决定先把网页的“地基”打造成一个拥有深度、光影和生命力的赛博空间。  
> 本文将揭秘 `MainLayout.vue` 的 Z 轴分层哲学，深挖丧心病狂的全屏反光层实现，以及那个能自动感知主题的 Canvas 粒子引擎。

---

## 1. 拒绝扁平：网页的 Z 轴魔法

在传统的网页设计中，一切都是平铺在 `<body>` 里的卡片。但在风风博客中，网页被赋予了**厚度**。

打开 `src/components/layout/MainLayout.vue`，你会发现整个页面其实是一个极其精密的“三明治”结构：

```html
<!-- MainLayout.vue 的极简结构图 -->
<div class="main-layout theme-transition">
  <!-- 底层：壁纸 (z-index: -2) -->
  <div class="wallpaper-container">...</div>

  <!-- 光影层：全屏反光 (仅桌面端) -->
  <ReflectionLayer v-if="!isMobile" />

  <!-- 粒子层：Canvas 粒子系统 -->
  <ParticleLayer v-if="!isMobile" :is-dark-theme="isDarkTheme" />

  <!-- 顶层交互：玻璃容器与路由视图 (z-index: 1000+) -->
  <div class="content-container desktop-layout">
    <header class="title-bar glass-container">...</header>
    <div class="main-content">
      <NavPanel />
      <div class="content-view glass-container">...</div>
    </div>
  </div>
</div>
```

这种设计让壁纸、光影、粒子和文字在不同的 Z 轴空间里互不干扰。配合 Vue Router 的 `<transition>` 动画，每一次页面跳转，都像是玻璃卡片在赛博空间中滑行。

---

## 2. 玻璃美学的核心：.glass-container 与暗色模式

在 `src/styles/theme.css` 中，小风酱定义了博客的视觉灵魂： `.glass-container`。

它可不仅仅是一个带透明度的普通 `div` ，而是被 `backdrop-filter` 属性赋予了灵魂的魔法容器！并且通过伪元素 `::after` 注入了一层极其微妙的**内发光边界**，用来模拟玻璃的物理厚度：

```css
.glass-container {
  /* 核心模糊：让背景虚化，同时提高亮度模拟高透感 */
  -webkit-backdrop-filter: var(--aero-blur) brightness(1.1);
  backdrop-filter: var(--aero-blur) brightness(1.08);
  border: 1px solid var(--aero-border-color);

  /* 悬浮阴影 */
  box-shadow:
    var(--aero-glow),
    0 6px 30px rgba(0, 0, 0, 0.15);
  transform: translateZ(0); /* 开启 GPU 硬件加速！ */
}

/* 玻璃的厚度感与反光 */
.glass-container::after {
  content: '';
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 15px rgba(255, 255, 255, 0); /* 边缘内发光 */
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  pointer-events: none; /* 关键：防止遮挡鼠标点击！ */
}
```

**暗色模式 (Dark Theme) 的丝滑切换：**
在 `MainLayout.vue` 中，点击主题切换按钮后，不仅会替换背景图，还会给顶层容器挂上 `.dark-theme` 类。此时，CSS 变量瞬间切换，原本白色的玻璃反光变成了冷色调的深邃玻璃，整个过程伴随 `transition: background-color 0.5s ease`，极其丝滑！

---

## 3. 疯狂的视觉欺诈：ReflectionLayer 反光层

如果要评选这个博客里最丧心病狂的代码， `ReflectionLayer.vue` 绝对榜上有名。

**问题：** 怎么让一道斜向的彩虹流光，完美且连续地穿过页面上三个分离的玻璃容器（标题栏、侧边栏、内容区）？
**答案：全屏作画，精细挖孔。**

小风酱写了一个 `ResizeObserver`，实时追踪这三个容器在屏幕上的坐标：

```typescript
// ReflectionLayer.vue 中的几何计算
const updateMaskPositions = () => {
  const padding = 4
  const header = document.querySelector('.title-bar')

  if (header) {
    const rect = header.getBoundingClientRect()
    // 算出多边形的四个顶点坐标，存入 CSS 变量！
    document.documentElement.style.setProperty(
      '--header-clip',
      `polygon(${rect.left + padding}px ${rect.top + padding}px,
              ${rect.right - padding}px ${rect.top + padding}px,
              ... )`,
    )
  }
  // 对 Nav 和 Content 做同样的事...
}
```

而在 CSS 层面，这个组件绘制了一个铺满屏幕的、包含 14 重渐变的超级彩虹光束（ `--reflection-gradients`）。然后，利用刚才 JS 算出的坐标，用 `clip-path` 把不需要发光的地方“剪掉”：

```css
/* 只有被裁剪出来的区域才会显示彩虹光 */
.header-mask {
  clip-path: var(--header-clip, none);
  background: var(--reflection-gradients);
}
```

这样，当用户滚动页面时，由于反光层是 `fixed` 固定的，玻璃容器在屏幕上滑动，光束看起来就像是真实的光源照射在移动的玻璃上一样。视觉效果直接拉满！(≧▽≦)

---

## 4. 注入灵魂：自适应 Canvas 粒子引擎

如果只有静态的光影，未免太死板了。于是小风酱手搓了一个零依赖的 HTML5 Canvas 粒子引擎： `ParticleLayer.vue`。

**它的厉害之处在哪里？**
它不是乱飘的雪花，它**能感知主题**！awa

1. **颜色汲取**：通过 `getThemeColors()`，粒子系统会主动去读取 CSS 中定义的 `--reflection-X` (反光颜色) 变量。这意味着只要改了 CSS 主题，粒子的颜色会自动跟着变！
2. **形态变换**：它还能和主题模式打组合技，在暗色模式下，粒子变成了星星和圆点，宛如宇宙星空；在亮色模式下，则是各种几何碎片，仿佛被光线切割的玻璃碎片~

```typescript
// Particle.ts 中的形态分配
const shapes = isDark
  ? ['circle', 'star'] // 暗色模式：星星与圆点，宛如宇宙星空
  : ['triangle', 'shard', 'diamond', 'hexagon', 'square'] // 亮色模式：几何碎片
```

3. **性能克制**：为了不让用户的电脑风扇起飞，小风酱巧妙地使用了 `requestAnimationFrame`，并且监听了全局设置 ( `settingsStore.particles.enabled`)。如果不喜欢特效，只要在设置里关掉，Canvas 的 `v-if` 就会直接把 DOM 卸载，一点内存都不占！

---

## 5. 伸缩自如：NavPanel 与移动端适配

最后，来看看博客的导航中枢—— `NavPanel.vue`。

为了在桌面端不占用过多的阅读空间，导航栏默认是收起的（只有图标）。当鼠标悬停或点击时，它会通过 CSS `transition` 和 `cubic-bezier` 贝塞尔曲线，像果冻一样弹出来：

```css
.nav-panel {
  width: 60px;
  /* 极其舒适的果冻弹射动画 */
  transition: width 0.4s cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
.nav-panel.expanded {
  width: 200px;
}
```

而由于手机屏幕寸土寸金，小风酱直接写了另一套组件： `MobileNavPanel.vue`。
在移动端，侧边栏变成了经典的抽屉式菜单，配合原生的 `touch-action: none` 遮罩层，防止用户在呼出菜单时误触底层内容。

这一切的响应式切换，都在 `MainLayout.vue` 的 `checkDevice()` 函数中被精准控制。

---

## 下集预告

地基打好了，光影和粒子也开始流转了。
接下来，我们将降落到这个赛博空间的正中央—— **首页**。

下一篇 **Vol.2 极客主页：小风酱的赛博自留地**，我们将顺着这层流光溢彩的玻璃地基，踏入博客的首页。 去看看那个长得像~~（明明是抄袭好不好qwq）~~ GitHub 贡献图的热力图到底藏着怎样的魔法！

别走开，好看的皮囊和有趣的灵魂，这里全都有！(>w<)

---

> 沉迷写 CSS 动画不可自拔的小风酱 著  
> 本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
