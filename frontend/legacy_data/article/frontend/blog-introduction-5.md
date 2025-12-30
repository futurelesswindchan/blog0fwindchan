# Vol.5 拒绝重复劳动：封装复用的哲学 & 一次离谱的白屏BUG！

> **摘要**：程序员的三大美德之一是懒惰！为了不再手动写好几遍同一逻辑，小风酱祭出了泛型封装的大招。但在这条复用之路上，一个关于响应式丢失的 Bug 曾让整个博客陷入白屏风暴……

---

## 1. 起源：人类的本质是复印机？

在开发博客的过程中，小风酱发现文章列表、友链页面、画廊页面，它们的核心逻辑惊人地相似：

1.  拿一堆数据。
2.  根据关键词过滤一下。
3.  根据时间或名称排个序。
4.  切成一页一页展示。

如果在三个页面里分别写三遍 `computed` 和 `watch`，那不仅代码丑陋，维护起来更是火葬场，改一个 Bug 要改好几个地方 OAO。

于是，**万能 Hook** `useSearchAndSort` 诞生了。

---

## 2. 万能 Hook：useSearchAndSort

这个 Composable 的目标是：**给我任何数据，我能还给一个处理好的、带分页的列表，外加控制它的所有按钮。**

### 2.1 泛型的魔法

为了让它能同时处理 `Article`、`Friend` 和 `Artwork` 对象，所以使用了 TypeScript 的泛型 `<T>`。

```typescript
// useSearchAndSort.ts
export function useSearchAndSort<T>(options: {
  items: T[] | Ref<T[]> | ComputedRef<T[]> // 接收任何形式的数据源（~—v—）~
  searchFields: (item: T) => string[] // 告诉咱去搜哪个字段0v0！
  sortType: SortType
  // ...
}) {
  // ... 内部逻辑
}
```

### 2.2 自动化的分页逻辑

这个 Hook 内部最贴心的一个设计是 `watch` 监听。

有没有遇到过这种 Bug：用户翻到了第 10 页，然后突然输入搜索词，列表变短了只有 2 页，结果页码还停留在第 10 页，导致页面一片空白！？

在这里，代码自动处理了这个逻辑：

```typescript
// 当搜索词或排序方式变化时，自动跳回第一页
watch([searchText, sortOrder], () => {
  currentPage.value = 1
})
```

### 2.3 极简的调用

在组件里使用它，简直是一种享受。以画廊页面为例：

```typescript
// GalleryView.vue
const { searchText, filteredItems, sortButton, pagination } = useSearchAndSort({
  items: artworks, // 注意：这里传的是 Ref，后面会讲为什么！
  searchFields: (artwork) => [artwork.title],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
})
```

只需要这一段代码，搜索栏、排序按钮、分页器的所有数据和逻辑就全有了。`filteredItems` 直接拿去 `v-for`，`pagination` 直接传给分页组件。

---

## 3. 番外：一只搜索栏引发的离谱大冒险

在博客开发的初期，小风酱曾遭遇过一个诡异的 **白屏悬案**。

### 案发现场

当给页面加上 `<transition>` 动画后，只要从其他页面切回画廊，内容区就会变成一片空白。控制台**没有任何报错**，DOM 树里只剩下一个孤零零的注释节点。

### 嫌疑人排查

一开始以为是 Transition 动画的锅，或者是 Vue Router 的异步加载问题。动画被删了，路由守卫被拆了，甚至一度怀疑是浏览器闹鬼。

直到盯着 `useSearchAndSort` 的调用代码看了一下午……

### 真相大白：断裂的响应式链条

来看看当时的凶手代码：

```typescript
// ❌ 错误示范
const artworks = computed(() => artworkStore.artworks)

const { filteredItems } = useSearchAndSort({
  items: artworks.value, // <--- 凶手就在这里！！！
  // ...
})
```

**破案逻辑：**

1.  **初始化时**：页面刚加载，Store 里的 `artworks` 还是空的（数据正在请求中）。
2.  **传递参数**：小风酱手贱加了 `.value`，这意味着传给 Hook 的不是响应式对象本身，而是此时此刻的值（也就是一个空数组 `[]`）。
3.  **链条断裂**：Hook 拿到的是一个普通的死数组。
4.  **数据到达**：几百毫秒后，Store 数据更新了，`artworks` 变了。
5.  **无动于衷**：因为 Hook 根本没持有 `artworks` 的引用，它不知道外面变天了。它依然守着那个空数组，返回空的 `filteredItems`。

### 制度优化：unref 的智慧

为了防止以后再犯这种低级错误，也为了让 Hook 更健壮（鲁棒性），小风酱在 Hook 内部引入了 `unref`（或者 Vue 3.3+ 的 `toValue`）进行归一化处理。

现在，无论传 `ref`、`computed` 还是普通数组，Hook 都能照单全收：

```typescript
// useSearchAndSort.ts (升级版)
const sortedAndSearchedItems = computed(() => {
  // ✨ 魔法在这里：不管传进来是什么，都能正确解包
  // 如果是 Ref，computed 会自动追踪它的依赖
  const items = unref(options.items)

  if (!items?.length) return []
  // ...
})
```

这个改动，彻底终结了白屏 Bug。

---

## 4. 可爱的全局通知：Toast 系统

除了逻辑复用，UI 组件的复用也是重头戏。市面上的 Toast 插件很多，但为了配合博客的 Aero 风格和颜文字，小风酱决定手撸一个。

### 架构设计

这是一个典型的 **状态 - 管理器 - UI** 分层架构：

1.  **State (`useToast.ts`)**：
    - 维护一个响应式的 `toasts` 数组。
    - 提供 `addToast` 方法，负责生成 ID、推入数组，并设置定时器自动销毁。
2.  **Manager (`ToastManager.vue`)**：

    - 它是一个幽灵组件，挂载在 `App.vue` 下，平时不可见。
    - 它负责遍历 `toasts` 数组，渲染一个个 `CuteToast`。
    - **关键算法**：它根据 index 动态计算 `offset`，让弹出的 Toast 能够整齐地从下往上堆叠，而不是重叠在一起。

    ```html
    <!-- ToastManager.vue -->
    <CuteToast v-for="(t, i) in toasts" :offset="baseOffset + i * gap" />
    ```

3.  **UI (`CuteToast.vue`)**：
    - 负责长得可爱 (￣▽￣)／。
    - 包含一个 CSS 动画驱动的进度条，让用户直观地看到它还有多久消失。
    - 使用了 `backdrop-filter: blur` 玻璃特效，完美融入 Aero 主题。

### 进度条动画的小巧思

为了让进度条平滑缩减，这里使用了 CSS Keyframes：

```css
.progress {
  transform-origin: left; /* 从左边开始缩放 */
  animation: shrink linear forwards; /* 线性缩放 */
}

@keyframes shrink {
  from {
    transform: scaleX(1);
  }
  to {
    transform: scaleX(0);
  }
}
```

而在 JS 中，则只需要把 `animation-duration` 设置为 Toast 的持续时间即可。

---

## 下集预告

现在前端的面子工程和复用逻辑都讲完了，是时候深入**后台管理**的里子了。

难道发文章还要手写 JSON 往数据库里插？不可能的！
下一篇 **Vol.6 后台管理（上）：为了偷懒，小风酱写了个 CMS**，将构建一个完善的后台系统，讲解如何在一个 Dashboard 里掌控全局。

---

> 差点被 Bug 逼疯的小风酱 著
