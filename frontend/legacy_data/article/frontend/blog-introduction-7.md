# Vol.7 拒绝重复劳动：封装复用的哲学 & 一次离谱的白屏 BUG！

> **摘要**：程序员的三大美德之一是“懒惰”！为了不在后台管理系统里连写五遍一模一样的搜索分页逻辑，小风酱祭出了泛型封装的大招。  
> 但在这条追求极致复用的路上，一个关于“响应式丢失”的幽灵 Bug，曾让整个博客陷入惨烈的白屏风暴…… 🐛

---

## 1. 起源：人类的本质是复印机？

在开发博客的过程中，小风酱看着眼前的需求陷入了沉思 OAO：  
文章要搜索+分页；  
友链要搜索+分页；  
画廊要搜索+分页；  
友链&投喂……还要搜索+分页！

如果按照传统写法，光是声明 `searchText`、 `currentPage`、 `filteredItems`、 `watch` 监听器，就要**Ctrl+C / Ctrl+V 整整五次**！  
代码行数瞬间爆炸，以后要是想加个“每页显示数量”的设置，改起来简直是火葬场 QAQ。

真正的~~懒癌~~极客，怎么能容忍这种体力活qwq？  
于是， **万能核心 Hook** `useSearchAndSort` 迎来了它的史诗级重构。

---

## 2. 万能 Hook 的终极形态

这个 Composable 的野心很大： **给我任何数据源，告诉我你想搜什么字段，我直接把处理好的列表、分页控制器和排序按钮全套还给你！** 0v0

### 2.1 泛型与动态配置的魔法

为了让它能同时处理 `Article`、 `Friend` 甚至 `Sponsor` 对象，小风酱使用了 TypeScript 的泛型 `<T>`，并引入了极高自由度的配置项：

```typescript
// useSearchAndSort.ts
export function useSearchAndSort<T>(options: {
  items: T[] | Ref<T[]> | ComputedRef<T[]> // 接收任何形式的数据源（~—v—）~
  searchFields: (item: T) => string[] // 指哪搜哪！
  sortType: SortType
  sortBy: (a: T, b: T) => number
  itemsPerPage?: number | Ref<number> // 连每页数量都支持动态响应！
}) {
  // ... 内部逻辑
}
```

### 2.2 自动化的“兜底”逻辑

开发分页最容易踩的坑是什么？  
**“越界虚空”！** 试想一下，用户翻到了第 10 页，然后突然在搜索框输入了一个冷门词，结果只剩下 1 页数据。如果页码还停留在 10，页面就会一片空白。

为了偷懒不写重置逻辑，小风酱在 Hook 内部直接布下了天网：

```typescript
// 当搜索词或排序变化时，自动跳回第一页，拒绝越界！
watch([searchText, sortOrder], () => {
  currentPage.value = 1
})

// 哪怕是用户在系统设置里修改了“每页显示数量”，也乖乖重置！
watch(pageSize, () => {
  currentPage.value = 1
})
```

---

## 3. 视觉与逻辑的完美闭环：FilterBar & PaginationControls

逻辑封装好了，UI 怎么能拖后腿？小风酱顺手抽出了两个黄金搭档组件： `<FilterBar>` 和 `<PaginationControls>`。

特别是这个分页控制器，它的设计简直把偷懒发挥到了极致： **它直接接收 Hook 返回的整个** `pagination` **对象！** 根本不需要你手动去绑定 `currentPage` 或者监听 `@next` 事件。

```typescript
// 只需要定义一个接口，直接把 Hook 吐出来的对象整个吞进去！
interface Pagination {
  currentPage: number
  totalPages: number
  prevPage: () => void
  nextPage: () => void
}

defineProps<{
  pagination: Pagination
}>()
```

**那么终极调用形态是怎样的呢？**
以下一篇文章会提到的画廊为例，原本上百行的冗余代码，现在被暴减成了极其清爽的“三段式”：

```html
<!-- 1. 头部搜索排序 -->
<FilterBar
  v-model:searchText="gallerySearchText"
  placeholder="搜索画作..."
  :sortButton="galleryPagination.sortButton"
/>

<!-- 2. 中间渲染列表 -->
<div class="gallery-grid">
  <GalleryCard v-for="item in paginatedGallery" :key="item.id" :item="item" />
</div>

<!-- 3. 底部无脑接入分页 -->
<PaginationControls :pagination="galleryPagination" />
```

```typescript
// --- 画廊搜索&分页的背后逻辑只需这一小段 Hook 调用 ---
const {
  searchText: gallerySearchText,
  filteredItems: paginatedGallery,
  pagination: galleryPagination,
} = useSearchAndSort({
  items: computed(() => artworkStore.artworks),
  searchFields: (work) => [work.title || '', work.description || ''],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime(),
  itemsPerPage: computed(() => settingsStore.pagination.adminGallery),
})
```

**“把复杂留给底层，把优雅留给视图。”** 这就是前端工程师的极致浪漫！✨

---

## 4. 惊魂一刻：一只 `.value` 引发的白屏血案

然而，在重构的初期，小风酱曾遭遇过一个诡异的 **白屏悬案**。

当给页面加上 `<transition>` 动画后，只要页面一刷新，列表区就会变成一片空白。控制台**没有任何报错**，DOM 树里只剩下一个孤零零的注释节点。

排查了一下午，差点把电脑砸掉后，真凶终于浮出水面—— **响应式链条断裂了**！

来看看当时的“罪魁祸首”代码：

```typescript
// ❌ 灾难示范
const artworks = computed(() => artworkStore.artworks)

const { filteredItems } = useSearchAndSort({
  items: artworks.value, // <--- 凶手就在这里！！！手贱加了 .value！
})
```

**破案逻辑：**

1. **初始化时**：页面刚加载，Store 里的数据还在路上（网络请求中），此时 `artworks.value` 是个空数组 `[]`。
2. **死水一潭**：因为传进去的是 `.value`，Hook 拿到的是一个普通数组， **完全失去了响应式**。
3. **数据到达**：几百毫秒后，API 数据回来了，Store 更新了。
4. **无动于衷**：Hook 根本不知道外面变天了，它依然死死抱着那个空数组，返回空的 `filteredItems`。白屏诞生！

### 终极解法：unref

为了防止以后再犯这种低级错误，让 Hook 变得刀枪不入，小风酱在内部引入了 Vue 的神器 `unref` 进行归一化解包：

```typescript
// ✨ 魔法在这里：不管传进来是 Ref、Computed 还是普通数组，统统照单全收！
const sortedAndSearchedItems = computed(() => {
  const items = unref(options.items) // 如果是 Ref/Computed，这里会自动追踪依赖！
  if (!items?.length) return []
  // ...
})
```

现在，不管外部怎么瞎传参数，Hook 都能稳如泰山地保持响应，彻底终结了白屏 Bug！( •̀ ω •́ )y

---

## 5. 番外篇：文章导航的优雅解法

既然提到了封装复用，那就不得不提博客里另一个让人头疼的场景： **上一篇 / 下一篇文章的跳转导航**。

如果每次切换文章都要去遍历整个列表找索引，那简直太蠢了。于是 `useArticleNavigation` 诞生了！

它巧妙地依赖了 `articleStore` 提供的数据流，只需要传入“文章总列表”和“当前文章 ID”，它就能自动算出前后相邻的文章：

```typescript
// useArticleNavigation.ts
export function useArticleNavigation<T extends NavigableArticle>(options: {
  articles: ComputedRef<T[]>
  currentId: ComputedRef<string>
}) {
  const { articles, currentId } = options

  // 动态锁定当前索引
  const currentIndex = computed(() =>
    articles.value.findIndex((article) => article.id === currentId.value),
  )

  // 优雅地推导上一篇（小心吃到数组越界报错的啦awa）
  const prevArticle = computed(() => {
    if (currentIndex.value <= 0) return null
    const prev = articles.value[currentIndex.value - 1]
    return prev ? { id: prev.id, title: prev.title } : null
  })

  // ... nextArticle 同理
}
```

配合后端的 `/api/articles/index` 接口返回的分类树，前端只需要用 `flatMap` 展平数组，丢进这个 Hook 里，一个丝滑的底部阅读导航就搞定啦！awa

---

## 6. 下集预告

现在，我们的逻辑武装已经到了牙齿，复用组件也堆满了武器库。  
是时候去搞点视觉上的大场面了！

下一篇 **【Vol.8 视觉盛宴：画廊 LazyImage 懒加载与友链留言板】** ，我们来看看如何用极少的性能开销，渲染出满屏的高清大图，并给友链页面加上灵魂交互吧！敬请期待！

---

> 成功消灭了 500 行重复代码、正在喝奶茶庆祝的小风酱 著 🧋  
> 本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
