# Vol.1 颜值即正义：传说中的的玻璃美学！

> **摘要**：在这个扁平化设计横行的年代，小风酱决定逆流而上，用 CSS 和一点点 JS 魔法，在浏览器里复刻~~（存疑！）~~Windows 7 时代那令人魂牵梦绕的 Aero Glass 效果。本文将解密 `.glass-container` 的实现细节，以及那个吓哭浏览器JS引擎的动态反光层。

---

## 1. 拒绝塑料感：Aero 的三大定律

小风酱在设计之初就立下了一个 Flag：这个博客绝对不能看起来像是由一堆塑料卡片拼起来的。它必须要有质感，要有厚度，要像一块精心打磨的玻璃悬浮在壁纸之上 (-v-)。

经过无数次调整 `theme.css`，风风总结出了 **Aero 玻璃特效的三大定律**：

1.  **模糊 (Blur)**：背景必须模糊，但不能糊成一团。
2.  **光晕 (Glow)**：边缘要有内发光，模拟玻璃的厚度。
3.  **反光 (Reflection)**：表面要有一道贯穿的流光，仿佛有光源在移动。

### 核心实现：`.glass-container`

在 `src/styles/theme.css` 中，定义了所有玻璃组件的基类。这里没有使用复杂的图片素材，全靠 CSS3 的 `backdrop-filter` 硬算 (qwq)。

```css
/* src/styles/theme.css */
.glass-container {
  /* 1. 核心模糊：让背景虚化，同时提高亮度模拟玻璃的高透感 */
  -webkit-backdrop-filter: var(--aero-blur) brightness(1.1);
  backdrop-filter: var(--aero-blur) brightness(1.08);

  /* 2. 边框：半透明白边，勾勒轮廓 */
  border: 1px solid var(--aero-border-color);

  /* 3. 阴影：外发光 + 投影，制造悬浮感 */
  box-shadow:
    var(--aero-glow),
    0 6px 30px rgba(0, 0, 0, 0.15);

  /* 性能优化：告诉浏览器这个元素要搞事情，请开启 GPU 加速 */
  transform: translateZ(0);
  will-change: transform, opacity;
}
```

但这还不够！为了模拟玻璃边缘被光线照射时的剔透感，小风酱利用 `::after` 伪元素给容器加了一层**内阴影 (Inset Shadow)** 和**线性渐变**：

```css
.glass-container::after {
  content: '';
  position: absolute;
  inset: 0; /* 铺满整个容器 */
  border-radius: inherit; /* 继承圆角 */

  /* 边缘内发光 */
  box-shadow: inset 0 0 15px rgba(255, 255, 255, 0);

  /* 垂直方向的微弱渐变，模拟光照 */
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.1) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0.03) 100%
  );

  /* 不响应鼠标事件，防止遮挡内容 */
  pointer-events: none;
}
```

这样一来，任何加上 `.glass-container` 类的 `div`，瞬间就有了灵魂 (awa)。

---

## 2. 疯狂的实验：ReflectionLayer 反光层

如果只是上面的效果，那充其量只是 iOS 的毛玻璃。Windows Aero 的精髓在于那道**斜切的、彩虹色的反光**。

通常的做法是给每个卡片加一个 `linear-gradient` 背景。但小风酱发现了一个问题：如果页面上有多个卡片（比如标题栏、侧边栏、内容区），每个卡片的反光都是独立的，看起来就像是碎掉的玻璃，完全没有整体感 (TAT)。

**理想的效果是：** 反光应该是一道巨大的光束，连续地穿过屏幕上所有的玻璃组件。

为了实现这个效果，小风酱编写了 `ReflectionLayer.vue` 组件。这是一个**纯粹的视觉欺诈**。

### 原理揭秘

1.  **全屏覆盖**：`ReflectionLayer` 是一个 `fixed` 定位的层，覆盖在所有内容之下，壁纸之上。
2.  **绘制反光**：在这个层上，用 CSS 绘制那道复杂的彩虹渐变（见 `theme.css` 里那长得离谱的 `--reflection-gradients`）。
3.  **挖孔显示 (Clip-Path)**：这是最骚的操作。JS 会实时计算页面上所有 `.glass-container` 的位置，然后用 `clip-path: polygon(...)` 把全屏的反光层裁剪出玻璃组件的形状。

看看 `ReflectionLayer.vue` 里的这段逻辑：

```typescript
// src/components/layout/ReflectionLayer.vue

const updateMaskPositions = () => {
  const padding = 4 // 稍微内缩一点，防止溢出
  const header = document.querySelector('.title-bar')
  // ... 获取其他元素

  if (header) {
    const rect = header.getBoundingClientRect()
    // 计算多边形坐标，并通过 CSS 变量传给样式
    document.documentElement.style.setProperty(
      '--header-clip',
      `polygon(${rect.left + padding}px ${rect.top + padding}px,
              ${rect.right - padding}px ${rect.top + padding}px,
              ${rect.right - padding}px ${rect.bottom - padding}px,
              ${rect.left + padding}px ${rect.bottom - padding}px)`,
    )
  }
  // ... 对 Nav 和 Content 做同样的事
}
```

而在 CSS 中，反光层是这样应用裁剪的：

```css
/* 标题栏的反光替身 */
.header-mask {
  /* 只有被裁剪出来的区域才会显示背景的彩虹光 */
  clip-path: var(--header-clip, none);
  background: var(--reflection-gradients);
}
```

这样做的结果是：虽然物理上反光层是分离的，但在视觉上，那道彩虹光束是**连续**穿过标题栏和内容区的！当用户滚动页面时，JS 会监听 `scroll` 事件并实时更新坐标，保证反光纹理静止在屏幕上，而玻璃窗口在移动。

虽然这对浏览器渲染引擎来说有点残忍（每帧都在重绘 clip-path），但为了颜值，这点性能牺牲是值得的！(ov0)

---

## 3. 暗黑模式：不仅是变黑

在 `App.vue` 中，通过切换根节点的 `.dark-theme` 类来实现主题切换。

对于 Aero 风格来说，暗黑模式不仅仅是把背景变黑那么简单。在 `theme.css` 中，小风酱为暗黑模式重新调制了一套变量：

```css
.dark-theme {
  /* 降低透明度，增加黑色底色 */
  --dark-bg-base: rgba(0, 0, 0, 0.4);

  /* 调整文字颜色为高亮白 */
  --dark-text: rgba(255, 255, 255, 0.9);

  /* 关键：反光颜色要变淡！ */
  /* 在亮色模式下反光是彩色的，但在暗色模式下，太鲜艳会很刺眼 */
  /* 所以这里把 --reflection-1 等变量调成了冷色调的淡蓝/淡紫 */
  --reflection-1: rgba(223, 246, 252, 0.22);
  /* ... */
}
```

同时，壁纸也会随之切换。在 `MainLayout.vue` 中，壁纸的切换加了一个 `transition`，让白天到黑夜的过渡丝般顺滑：

```css
.wallpaper {
  transition: background-image 0.6s ease;
}
```

---

## 4. 细节微调：滚动条与字体

为了不破坏整体的玻璃质感，原生那个灰头土脸的滚动条必须死 (qwq)。

在 `theme.css` 里，Webkit 滚动条被重新设计成了透明背景 + 半透明滑块：

```css
::-webkit-scrollbar {
  width: 8px;
  background-color: transparent; /* 轨道透明 */
}

::-webkit-scrollbar-thumb {
  background: rgba(120, 120, 120, 0.3); /* 滑块半透明 */
  border-radius: 4px;
}
```

字体方面，引入了 `QingNingYouYuan`（青柠幼圆）作为主字体，圆润的笔画和圆角的玻璃窗口相得益彰，瞬间提升了博客的可爱值。

---

## 下集预告

外表装修得差不多了，接下来该给这个博客注入一点动态的灵魂了。

下一篇 **Vol.2 动效的艺术**，将研究如何让文字像**打字机**一样一个个蹦出来，以及如何利用 Vue 的 `<Transition>` 组件实现页面之间丝滑的**淡入淡出**和**滑动切换**。

别走开，动起来才更好看！(>w<)

---

> 没有未来的小风酱 著
