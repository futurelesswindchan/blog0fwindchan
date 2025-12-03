# 风风博客博客开发心得（五）：数据管理与状态同步

> 本文说明基于仓库实际实现的状态管理与数据加载策略，参考文件：`src/views/stores/articleStore.ts`、`src/views/stores/artworkStore.ts`、`src/views/stores/friendStore.ts`、`src/views/stores/useSettingsStore.ts` 以及 `src/composables/useSearchAndSort.ts`、`src/components/common/LazyImage.vue` 等。

## 1. 为什么选 Pinia

项目使用 Vue 3 + TypeScript，Pinia 与组合式 API 的风格天然契合：轻量、类型友好、易于测试与按需加载。项目采用 setup-style 的 `defineStore`（composition API）来组织业务 state 与 side effects。

## 2. 项目中的主要 Store 与数据形态

源码中并没有单个“storyStore/characterStore/techStore”这样的命名空间；实际按资源划分为几个主要 store：

- `articleStore`（`src/views/stores/articleStore.ts`）

  - 负责管理技术文章、专题与小说索引（仓库当前实现通过后端 API 提供索引与文章内容），包含 article list、currentArticle、isLoading、error 等字段。
  - 提供按分类加载（如 `frontend`、`topics`、`novels`）与按 id 获取全文的函数，实际实现通过 `fetchArticleIndex()` 与 `fetchArticle(category, id)` 与后端交互。

- `artworkStore`（`src/views/stores/artworkStore.ts`）

  - 管理画廊数据（图片元信息、分页/懒加载状态、加载/错误标识）。

- `friendStore`（`src/views/stores/friendStore.ts`）

  - 管理友链列表与相关元数据，通常为轻量 JSON 列表。

- `useSettingsStore`（`src/views/stores/useSettingsStore.ts`）
  - 保存主题、壁纸偏好等 UI 设置（例如 `isDarkTheme`），并负责持久化到 `localStorage`。

这些 store 均使用 `ref` / `computed` 暴露响应式状态，并以 `async` 函数封装远程加载逻辑。

示例：`articleStore`（与仓库实现一致的概要）

```ts
// src/views/stores/articleStore.ts（概要，基于后端 API）
export const useArticleStore = defineStore('article', {
  state: () => ({
    articles: { frontend: [], topics: [], novels: [] },
    currentArticle: null,
    isLoading: false,
    error: null,
  }),
  actions: {
    // 从后端 API 获取分类索引（/api/articles/index）
    async fetchArticleIndex() {
      if (this.articles.frontend?.length) return
      this.isLoading = true
      try {
        const res = await fetch('/api/articles/index')
        const data = await res.json()
        this.articles = { ...this.articles, ...data }
      } catch (e) {
        this.error = String(e)
      } finally {
        this.isLoading = false
      }
    },

    // 通过后端 API 获取单篇文章详情（/api/article/<category>/<id>）
    async fetchArticle(category: string, id: string) {
      if (this.currentArticle && this.currentArticle.id === id) return
      this.isLoading = true
      this.currentArticle = null
      try {
        const res = await fetch(`/api/article/${category}/${id}`)
        this.currentArticle = await res.json()
      } catch (e) {
        this.error = String(e)
      } finally {
        this.isLoading = false
      }
    },
  },
})
```

## 3. 异步加载与错误处理

核心做法保持一致：所有网络操作都通过 `async/await` + `try/catch` 包裹，使用 `isLoading` 和 `error` 字段暴露给视图层。关键实践：

- 在发起请求前检查本地缓存（例如 `articles.value[category]`）以避免重复请求。
- 对关键异步动作设置超时或降级策略（例如加载失败时保留旧数据并向用户显示短消息）。

示例（加载防抖 / 防重复）：

```ts
if (articles.value[category] && articles.value[category].length) return
await fetchIndex(category)
```

## 4. 路由守卫中的预加载（与源码一致）

仓库的 `src/router/index.ts` 在路由守卫里对部分页面做了条件预加载，例如在进入 Friends / Gallery 页面时触发对应 store 的加载：

```ts
router.beforeEach(async (to, from, next) => {
  document.documentElement.classList.add('page-transitioning')
  try {
    if (to.name === 'Friends') {
      const f = useFriendStore()
      if (!f.friends.length) await f.fetchFriends()
    }
    if (to.name === 'Gallery') {
      const a = useArtworkStore()
      // 注意：store 中字段名为 `artworks`，方法名为 `fetchArtworks()`
      if (!a.artworks.length) await a.fetchArtworks()
    }
  } catch (e) {
    // 捕获后仍允许导航，页面内显示错误
  }
  next()
})
```

这种做法保证关键页面打开时尽可能完成必要的数据加载，从而避免空白占位或二次加载闪烁。

## 5. 页面级监听与按需加载

在详情页（例如文章详情、角色详情）常见的模式是：在 `watch` 或 `onMounted` 中根据 `route.params` 发起按需加载：

```ts
watch(
  () => route.params.id,
  async (id) => {
    if (!id) return
    // 实际实现通过后端 API 获取文章；在 ArticleDetailView 中使用 fetchArticle(category, id)
    await articleStore.fetchArticle('frontend', String(id))
  },
  { immediate: true },
)
```

## 6. 性能优化要点

-- 避免重复请求（缓存 + loading/loaded 检查）。
-- 图片采用 `LazyImage` 组件，支持占位与失败重试，减少首次加载压力。

示例：在画廊页面使用 `LazyImage` 与分页/按需加载：

```html
<template>
  <div class="gallery">
    <LazyImage v-for="img in items" :key="img.id" :src="img.url" />
  </div>
</template>
```

## 7. 类型与可维护性

- 项目在 store、composable 与组件层尽量使用 TypeScript 接口约束，示例中 `Article`、`Artwork`、`Friend` 等类型在对应文件中声明。
- 统一的数据接口便于在多个视图间复用组件（如列表、详情、分页控件）并降低回归风险。

## 8. 小结

实际仓库按资源划分 store（`articleStore`、`artworkStore`、`friendStore`、`useSettingsStore`），结合路由守卫与按需加载策略，实现了集中管理、按需拉取、错误隔离与性能优化。通过类型约束与组合式 API，代码在可维护性和可扩展性上保持良好平衡。

---

> 没有未来的小风酱 著
> 2025-12-02 (已与全栈架构同步)
