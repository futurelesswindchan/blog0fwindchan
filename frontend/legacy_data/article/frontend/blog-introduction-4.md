# Vol.4 画廊与模态框：从能用就行到全局管理

> **摘要**：曾经...代码里到处都是 `<Dialog :visible="show">`，Props 传得满天飞。为了解决这场混乱，小风酱引入了 Pinia 全局状态管理。同时，本文将深入画廊组件，讲解它是如何处理大量图片的加载与预览的。

---

## 1. 告别 Props 地狱：全局模态框体系

在早期的 Vue 开发中，小风酱习惯把弹窗组件写在父组件里。但当登录框需要在首页、文章页、甚至 404 页面都能唤起时，就会发现自己陷入了 Props 和 Emit 的泥潭QAQ。

**革命性的架构：**

1.  **中央集权**：所有弹窗的开关状态、传入数据，全部由 `globalModalStore` 管理。
2.  **全局挂载**：所有弹窗组件直接挂载在 `App.vue` 的根节点下。它们永远存在，只是通过 Store 控制显示与否。

### 指挥部：globalModalStore.ts

这个 Store 是整个系统的核心。它不仅管理简单的 `true/false`，还管理弹窗的**上下文数据**。

以画廊预览为例，不仅要打开预览框，还要告诉它：“当前看的是哪张图？这张图属于哪个列表？”

```typescript
// globalModalStore.ts
const openGalleryPreview = (artwork: Artwork, list: Artwork[] = []) => {
  previewArtwork.value = artwork
  // 关键：把当前筛选后的列表也传进去，这样预览框才知道上一张和下一张是谁
  previewList.value = list.length > 0 ? list : [artwork]
  showGalleryPreview.value = true
}
```

### 通用外壳：BaseModal.vue

为了保持 UI 的一致性，小风酱封装了一个 `BaseModal`。它负责处理所有弹窗共有的逻辑：

- **背景模糊**：`backdrop-filter: blur(8px)`，让弹窗下的内容若隐若现。
- **滚动锁定**：当弹窗打开时，`document.body.style.overflow = 'hidden'`，防止背景页面滚动。
- **进出动画**：统一的 `modal-fade` 过渡效果。
- **关闭机制**：点击背景或按 `×` 键关闭弹窗。

```typescript
// BaseModal.vue
watch(
  () => props.show,
  (val) => {
    // 弹窗打开时，禁止背景滚动；关闭时恢复
    document.body.style.overflow = val ? 'hidden' : ''
  },
)
```

---

## 2. 视觉盛宴：响应式画廊

在 `GalleryView.vue` 中，并没有使用复杂的瀑布流插件，而是利用 CSS Grid 的强大能力实现了一个自适应网格。

```css
.gallery-container {
  display: grid;
  /* 魔法代码：自动填充，最小宽度 250px，剩余空间平分 */
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 2rem;
}
```

### 性能救星：LazyImage.vue

如果画廊里有 100 张高清大图，一次性加载会让浏览器直接卡死。`LazyImage` 组件利用 `IntersectionObserver` 实现了懒加载：

1.  **占位**：默认显示一个转圈圈的 `loading-spinner`。
2.  **监听**：当图片进入视口（viewport）时，才把真实的 URL 赋给 `img.src`。
3.  **容错**：如果加载失败（比如图床挂了），会自动重试 3 次，如果还不行，就显示一个可爱的`加载中喵`。

~~喵喵喵喵喵ฅ(＞ω＜ )ฅ ~~

```typescript
// LazyImage.vue
observer = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    // 只有看到了，才开始加载
    const img = new Image()
    img.src = props.src // 预加载
    img.onload = () => {
      currentSrc.value = props.src
    } // 替换显示
    observer.disconnect() // 任务完成，撤退
  }
})
```

---

## 3. 沉浸体验：GalleryPreviewModal

这是整个画廊最复杂的部分。它不仅要展示大图，还要处理导航逻辑。

得益于 `globalModalStore` 传入了 `previewList`，在模态框内部就可以直接计算出上一张和下一张的索引，而不需要父组件介入。

```typescript
// globalModalStore.ts 中的导航逻辑
const navigateGallery = (direction: 1 | -1) => {
  const newIndex = currentPreviewIndex.value + direction
  if (newIndex >= 0 && newIndex < previewList.value.length) {
    // 直接修改 store 里的当前图片，界面自动更新
    previewArtwork.value = previewList.value[newIndex]
  }
}
```

在 UI 上，`GalleryPreviewModal` 采用了经典的三段式布局：

- **Header**：显示标题，半透明背景。
- **Middle**：图片主体，包含左右两个巨大的透明导航按钮（`.nav-strip`）。为了防止遮挡图片，这两个按钮平时是透明的，只有鼠标悬停时才会显示图标。
- **Footer**：显示描述和日期。

这种设计最大化了图片的展示面积，同时保留了必要的信息展示。

---

## 4. 细节微调

为了让体验更上一层楼，小风酱还做了一些微小的优化：

- **点击穿透处理**：在 `GalleryView` 中，点击卡片调用 `openPreview` 时，传入的是 `filteredItems`（过滤后的列表）。这意味着如果有人搜索了游戏，在预览时点击下一张，它只会切换到下一张游戏相关的图，而不会跳到其他分类去。
- **移动端适配**：在手机上，预览框的 Header 和 Footer 会自动缩小，导航按钮也会变窄，把宝贵的屏幕空间留给图片。

---

## 下集预告

画廊和弹窗都搞定了，现在博客已经非常漂亮了。但是，作为一个追求效率的博主，小风酱可不想每次发文章都要手动改数据库。

下一篇 **Vol.5 拒绝重复劳动：封装复用的哲学**，将深入探讨 `useSearchAndSort` 这个万能 Hook，看它是如何用一套代码搞定文章、友链、画廊三种数据的搜索、排序和分页的。

偷懒，才是第一生产力！(ov0)b

---

> 没有未来的小风酱 著
