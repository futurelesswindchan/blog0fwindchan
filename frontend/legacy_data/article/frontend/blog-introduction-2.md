# Vol.2 极客主页：小风酱的赛博自留地

> **摘要**：一个优秀的极客博客，它的主页绝不能只是干瘪的文章列表。在风风博客中，首页被设计成了一个全能的仪表盘。  
> 本文将带你拆解这个拥有双面头像、动态能量条、以及硬核的 GitHub 风格贡献热力图的赛博空间是如何拼建而成的。

---

## 1. 布局哲学：Bento Grid 便当盒网格

打开 `frontend/src/views/HomeView.vue`，你会发现整个主页的布局非常有秩序。小风酱放弃了传统的上下瀑布流，转而采用了现代网页设计中最流行的 **便当盒网格** 布局。

整个主页被划分为四个功能明确的街区：

- **A 区 (Hero)**：个人名片与 Slogan，主打第一印象。
- **B 区 (Dynamic Stream)**：最新动态，展示最新文章和画作。
- **C 区 (Portals)**：快捷传送门，直达各个分类模块。
- **D 区 (Stats & Plans)**：轨迹与未来，包含热力图和计划板。

这种布局利用了 CSS `grid` 和 `flex` 的强大能力，让每个卡片像便当盒里的格子一样，整齐划一，且在移动端能完美折叠。

---

## 2. 第一印象：Hero 区与双面魔术

在 A 区，小风酱放了一个看起来很正常的头像。但是！当你的鼠标悬停或者点击它时，它会像卡牌一样在 3D 空间中翻转，露出背面的二维码！

这种纯 CSS 驱动的 3D 翻转魔术，是极客们最爱的小把戏：

```css
/* HomeView.vue 头像翻转特效 */
.avatar-wrapper {
  perspective: 1000px; /* 开启 3D 空间透视 */
}

.avatar-inner {
  transition: transform 0.8s;
  transform-style: preserve-3d; /* 保持子元素的 3D 层级 */
}

/* 翻转的触发条件 */
.avatar-inner.is-flipped {
  transform: rotateY(180deg);
}

.avatar-front,
.avatar-back {
  backface-visibility: hidden; /* 关键：元素背对屏幕时隐藏 */
}

.avatar-back {
  transform: rotateY(180deg); /* 背面初始就翻转 180 度藏在后面 */
}
```

配合旁边那句用 `TypeWriter` 组件一个字一个字敲出来的 Slogan，以及那个呼吸闪烁的绿点 `<span class="status-dot"></span>`，可以说是非常有B格啦！(>w<)

---

## 3. 视觉微交互：能量条与扫光动画

在 B 区的动态卡片和 C 区的传送门卡片中，小风酱分别植入了两种不同的 CSS 视觉反馈。

**动态卡片的注水能量条：**
鼠标悬停时，卡片底部会有一道蓝色的能量条渐渐充满。这是通过伪元素 `::after` 的 `width` 动画实现的：

```css
.dynamic-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: -5px;
  width: 0%;
  height: 10px;
  background: rgba(0, 119, 255, 0.75);
  transition: width 0.3s ease-in-out;
}
.dynamic-card:hover::after {
  width: 120%; /* 鼠标放上去，能量充满！ */
}
```

**传送门卡片的斜向扫光：**
利用一个倾斜的渐变层，在鼠标经过时从左到右滑过卡片，营造出一种反光质感：

```css
.portal-card::before {
  /* ...定义渐变光束... */
  transform: skewX(-25deg); /* 把光束倾斜 */
  left: -150%;
}
.portal-card:hover::before {
  left: 150%; /* 光束从左扫到右 */
  transition: left 0.6s ease-in-out;
}
```

---

## 4. 极客的勋章：ContributionHeatmap 热力图

如果说前面的效果只是好看，那 D 区的 `ContributionHeatmap` 就是实打实的硬核咧！

每个极客都对 GitHub 主页上那片绿色的格子有着难以言喻的执念。小风酱决定： **我要在自己的博客里种一片格子！**

### 4.1 数据转换的魔法

后端传来的数据 `contributions` 只是简单的 `[{ date: 'xxx', count: 2 }]`。但热力图需要的是一个 **横向 53 周，纵向 7 天** 的二维网格！

在 `ContributionHeatmap.vue` 中，小风酱写了一段精妙的日期推算逻辑：

```typescript
const heatmapData = computed(() => {
  // 1. 算出 365 天前的日期，并对齐到那个星期的周日
  const startDate = new Date(today.getTime() - 364 * 24 * 60 * 60 * 1000)
  startDate.setDate(startDate.getDate() - startDate.getDay())

  // 2. 将扁平数据转为 Map 字典，将查询复杂度从 O(n) 降到 O(1)
  const dataMap = new Map(activityStore.contributions.map((i) => [i.date, i.count]))

  // 3. 生成 53x7 的二维矩阵
  const grid = []
  for (let w = 0; w < 53; w++) {
    const week: ContributionDay[] = []
    for (let d = 0; d < 7; d++) {
      const dateStr = currentDate.toISOString().split('T')[0]
      week.push({
        date: dateStr,
        count: dataMap.get(dateStr) || 0,
      })
      currentDate.setDate(currentDate.getDate() + 1)
    }
    grid.push(week)
  }
  return grid
})
```

### 4.2 自动推镜的滚动条

由于 53 周的格子在移动端或者窄屏下绝对会撑爆屏幕，所以在 CSS 中，网格区被设置了 `overflow-x: auto`。
但是，我们最关心的永远是“今天”的数据。所以小风酱在 `onMounted` 里加了一个贴心的小动作：等 DOM 渲染完，自动把滚动条推到最右侧！

```typescript
nextTick(() => {
  if (scrollWrapper.value) {
    scrollWrapper.value.scrollLeft = scrollWrapper.value.scrollWidth // 瞬间滑到最新的一天
  }
})
```

### 4.3 智能色阶与暗色适配

这片草地在亮色模式下是温暖的橘黄色（秋天草地），而在暗色模式下会自动切换成清冷的蓝色（赛博霓虹）。这一切仅仅依靠 `.dark-theme` 类的 CSS 覆盖就实现了。

---

## 5. 待办的艺术：PlanBoard 计划板

在热力图旁边，是充满生活气息的 `PlanBoard.vue`。  
它通过 `activityStore` 从后端拉取近期的计划，并根据 `status` 渲染不同的状态：

- `done` (已完成)：打上绿钩，并划上删除线。
- `doing` (在进行)：橘色的箭头，表示正在努力。
- `todo` (待办中)：图钉图标。

虽然页面上只是简单的列表展示，但配合 `transition` 和呼吸灯动画，整个板块显得非常灵动。  
而且（剧透警告awa），在后台管理系统中，小风酱甚至为它写了一个支持**拖拽排序 (Drag & Drop)** 的超级看板！

---

## 下集预告

主页的框架搭建完毕，各项数据已经开始流转。但是，在这个无缝衔接的单页应用 (SPA) 中，页面的切换怎么能是干巴巴的刷新呢？

下一篇 **Vol.3 路由的魔法：无缝跃迁与加载的艺术**，我们将深入风风博客的中枢神经—— `vue-router`。看看小风酱是如何利用路由守卫实现拦截，又是怎么设计出那个“跃迁成功”吐司弹窗的！
别走开，我们要准备超光速跃迁了！(>w<)

---

> 看着热力图越来越满就极其满足的小风酱 著  
> 本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
