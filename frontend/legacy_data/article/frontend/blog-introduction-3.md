# Vol.3 路由的魔法：无缝跃迁与加载的艺术

> **摘要**：在传统的网页中，点击链接意味着漫长的白屏和等待。但在现代的单页应用 (SPA) 里，我们可以把每一次点击变成一次丝滑的空间跃迁。  
> 本文将深入风风博客的中枢神经——`vue-router`，揭秘全局路由守卫中的“300ms 阈值加载逻辑”，以及那个被全站广泛使用的全局 Toast通知系统。

---

## 1. 拒绝假死：路由守卫的视觉护航

当你点击菜单里的“绘画长廊”时，如果画廊里的图片数据还没从后端拉取完，页面就会面临两个尴尬的选择：

1. 立刻跳转，然后给用户看一个空荡荡的骨架屏（很丑qwq）。
2. 在后台默默拉取数据，这期间页面毫无反应，让用户以为自己没点上，于是开始疯狂连点（更可怕QAQ）。

小风酱选择了第三条路：**前置拦截 + 视觉安抚**。

在 `frontend/src/router/index.ts` 中，利用全局前置守卫 `beforeEach`，拦截了所有需要重度数据依赖的页面（比如文章列表、画廊、友链等）。

```typescript
// 在路由模块外部定义的全局变量，用于跨钩子共享状态
let activeLoadingToastId: number | null = null // 用于在路由成功放行后，精准销毁该提示框，避免内存泄漏与视觉残留。
let loadingStartTime: number = 0 // 用于在加载完成后计算用户等待的时间。如果加载极快，则抑制成功提示的弹出，避免视觉打扰。

// 路由前置守卫：侦测并拦截
router.beforeEach(async (to, from, next) => {
  const isDataHeavyRoute = ['Friends', 'Gallery', 'Articles'].includes(to.name as string)

  if (isDataHeavyRoute) {
    // 1. 记录开始时间
    loadingStartTime = performance.now()

    // 2. 呼出一个无限期存在的 Loading Toast，安抚用户情绪
    activeLoadingToastId = toastStore.add({
      title: '次元跃迁准备中...',
      message: `正在为您搬运${to.meta.title}的数据，请稍候~`,
      type: 'info',
      duration: 0, // 设置为 0，让它一直存在，直到我们手动销毁
    })

    // 3. 异步拉取数据 (以画廊为例)
    if (to.name === 'Gallery') {
      const artworkStore = useArtworkStore()
      if (!artworkStore.artworks.length) await artworkStore.fetchArtworks()
    }
  }

  next() // 数据拉取完毕，放行！
})
```

这一套组合拳打下来，用户点击链接的瞬间就会看到可爱的提示框，等后台数据准备就绪，页面才会进行跳转渲染，彻底告别了白屏和假死。

---

## 2. 细节的巅峰：300ms 阈值机制

数据拉完了，页面跳过去了，那个 `Loading Toast` 怎么办？总不能一直留在屏幕上吧？
当然是在 `afterEach` (后置钩子) 里把它干掉。

但是这里有一个极其细微的用户体验问题：
如果用户的网络极其顺畅，或者数据已经命中了缓存，加载只花了 **50ms**。此时如果还要弹出一个“加载中...”，然后瞬间又弹出一个“加载成功！”，用户的眼睛就会被吵到qwq。

为了解决这个问题，小风酱设计了一个精妙的 **300ms 阈值感知系统**：

```typescript
// 路由后置钩子：清理与反馈
router.afterEach((to) => {
  if (activeLoadingToastId) {
    // 1. 先把刚才的 Loading Toast 销毁掉
    toastStore.remove(activeLoadingToastId)

    // 2. 计算用户实际等待的时间
    const waitTime = performance.now() - loadingStartTime

    // 3. 智能化反馈拦截！
    // 只有当加载耗时超过 300ms，说明用户确实“感觉到了等待”，此时才给予成功反馈。
    // 如果是秒开，则静默跳转，绝不打扰用户。
    if (waitTime > 300) {
      toastStore.add({
        message: `跃迁成功！欢迎来到${to.meta.title}~`,
        type: 'success',
        duration: 1500,
      })
    }
  }
})
```

这段代码看似简单，但它体现了前端开发中最宝贵的品质—— **克制**。不为了弹窗而弹窗，只在用户需要情绪价值的时候提供反馈。

---

## 3. 全局 Toast 系统：从 UI 到架构

既然上面提到了 `toastStore.add(...)`，那就不得不聊聊这个被全站无数次调用的 Toast（吐司）通知系统了。

市面上有很多现成的 Toast 插件（比如 Element Plus 或 Vuetify 自带的），但为了契合风风博客的美学，小风酱决定基于 Pinia 手搓一套。

这套系统采用了经典的 **状态 (Store) - 挂载点 (Manager) - 视图 (Item)** 三层架构。

### 3.1 状态层：toastStore.ts

Store 的职责极其纯粹：维护一个数组，提供 `add` 和 `remove` 方法。
它甚至支持通过传入 `showConfirm` 参数，把一个普通的提示框瞬间变成一个**确认弹窗**！

### 3.2 挂载点：ToastManager.vue 与 Teleport 的魔法

`ToastManager` 就像是一个幽灵组件。为了防止它被页面中乱七八糟的 `overflow: hidden` 或 `z-index` 遮挡，它使用了 Vue 3 的神级内置组件 `<Teleport>`。

```html
<!-- ToastManager.vue -->
<template>
  <Teleport to="body">
    <!-- 无论这个组件写在代码的什么位置，它最终都会被传送并挂载到 <body> 标签的最末尾 -->
    <div class="toast-container" :class="settingsStore.toast.position">
      <TransitionGroup name="toast-slide">
        <ToastItem v-for="toast in store.toasts" :key="toast.id" v-bind="toast" />
      </TransitionGroup>
    </div>
  </Teleport>
</template>
```

利用 `<TransitionGroup>`，当有新的 Toast 加入数组时，它会自动触发 `toast-slide` 动画，像果冻一样挤进屏幕；旧的 Toast 则会被平滑地推开。通过读取 `settingsStore`，这个弹窗群甚至可以自由地在屏幕的四个角落（左上、左下、右上、右下）之间切换！

### 3.3 视图层：ToastItem.vue 的细节把控

这是一个集成了**生命周期管理**和**CSS 动画**的集大成者。

**动态进度条**：
底部的进度条并不是用 JS 的 `setInterval` 每毫秒去扣减宽度（那样太耗性能了），而是纯靠 CSS Keyframes 驱动：

```css
.progress-bar {
  transform-origin: left;
  animation: progress-shrink linear forwards;
}
@keyframes progress-shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
```

然后在 JS 中，只需要把 `duration` 直接绑定给 `animation-duration` 样式即可！

**鼠标悬停暂停 (Pause on Hover)** ：
如果你正在读一条很长的报错信息，进度条却马上要走完了，怎么办？
`ToastItem` 监听了 `@mouseenter` 和 `@mouseleave` 事件：

```html
<div @mouseenter="pauseTimer" @mouseleave="resumeTimer"></div>
```

当鼠标移入时，JS 会清除倒计时定时器，并且利用 CSS 去暂停动画：
`:style="{ animationPlayState: isPaused ? 'paused' : 'running' }"`。
这样，只要你的鼠标停在 Toast 上，它就永远不会消失！

---

## 下集预告

经过了这番折腾，博客的路由切换已经像科幻电影里的空间跳跃一样丝滑了。

但别忘了，这里是一个**阅读平台**。
下一篇 **Vol.4 核心引擎：沉浸式的文章阅读体系**，我们将进入整个项目的核心——文章详情页。看看 Markdown 是如何被渲染的，以及那个会自动计算阅读进度的彩虹进度条是怎么实现的！

继续探索吧！(>w<)

---

> 觉得 300ms 阈值简直是天才发明的小风酱 著  
> 本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
