# 风风博客开发心得（五）：数据管理与状态同步

> 本文深入解析本站的数据流管理。内容基于 `src/views/stores/*.ts` 及相关 Composable 整理，已与 2025/12/12 版本代码对齐。

## 1. 状态管理：Pinia 的实战应用

我们使用 Pinia 来管理全局状态，但在实现上根据业务场景分成了两类策略：**只读展示**与**交互管理**。

### 1.1 “双轨制”的数据请求

你可能会发现代码里有两种请求方式：

1.  **原生 Fetch (`articleStore.ts`)**:

    - **场景**: 博客文章内容的读取。
    - **特点**: 使用原生 `fetch`，轻量、无依赖。因为文章读取是纯公开接口，不需要复杂的拦截器或 Token 处理。
    - **缓存**: 简单的内存缓存策略 —— `if (this.articles.frontend.length > 0) return`，避免切页面时重复请求。

2.  **Axios 封装 (`adminStore`, `friendStore`, `artworkStore`)**:
    - **场景**: 友链、画廊的管理以及后台登录。
    - **特点**: 引入了封装好的 `api` 实例（基于 Axios）。这让我们能方便地处理 CRUD 操作（增删改查），并在请求头中自动携带 `Authorization: Bearer token`，处理 401 刷新 Token 等逻辑。

### 1.2 核心 Store 解析

- **AdminStore**: 负责鉴权。它将 `access_token` 和 `refresh_token` 存在 `localStorage` 里，提供了 `login`、`logout` 和 `refreshToken` 方法。这是后台管理的守门员。
- **ArticleStore**: 负责内容。它维护了一个大的 `articles` 对象映射表（`frontend`, `topics` 等），以及 `currentArticle` 用于存储当前阅读的文章详情。
- **Artwork/FriendStore**: 负责资源。它们不仅有 `fetch`，还有 `add`、`update`、`delete` Action，配合后台管理界面使用。

## 2. 性能优化：LazyImage 组件

在画廊页面，图片加载体验至关重要。`src/components/common/LazyImage.vue` 不仅仅是一个懒加载组件，它还有两个小心机( º﹃º )

1.  **IntersectionObserver**: 利用原生 API 监听元素是否进入视口。只有当图片快要出现在屏幕上时，才创建 `Image` 对象并赋值 `src`。
2.  **自动重试机制**:
    如果图片加载失败（比如网络波动），组件不会立刻显示裂图，而是会尝试重试：
    ```ts
    const onError = () => {
      if (retryCount < MAX_RETRIES) {
        retryCount++
        //以此触发浏览器重新请求
        currentSrc.value = props.src + '?retry=' + retryCount
      }
    }
    ```
    这个简单的 `?retry=N` 参数往往能挽救一次加载失败。

## 3. 列表逻辑复用：useSearchAndSort

博客里有好几个页面（友链、画廊、后台列表）都需要：**搜索 + 排序 + 分页**。

如果每个页面都写一遍 `computed`，代码会非常冗余。

我们封装了 `src/composables/useSearchAndSort.ts`，它是一个功能强大的组合式函数：

- **输入**: 原始列表数据、搜索字段定义、排序规则。
- **输出**:
  - `filteredItems`: 经过搜索、排序、**并分页后**的当前页数据。
  - `searchText`: 搜索框绑定的响应式变量。
  - `sortButton`: 包含当前排序图标和切换方法的对象。
  - `pagination`: 包含 `currentPage`, `totalPages`, `nextPage` 等分页控制方法的对象。

这样，在视图组件里，我们只需要几行代码就能实现一个功能完备的列表页：

```html
<!-- 视图组件示例 -->
<FilterBar v-model:searchText="searchText" :sort-button="sortButton" />

<div class="list">
  <ItemCard v-for="item in filteredItems" :key="item.id" :data="item" />
</div>

<PaginationControls :pagination="pagination" />
```

## 4. 小结

- **数据层**: 根据场景选择 `fetch` 或 `axios`，动静分离。
- **组件层**: `LazyImage` 通过重试机制提升了图片加载的鲁棒性。
- **逻辑层**: `useSearchAndSort` 完美地解耦了列表逻辑与 UI 展示。

下一篇，我们将探讨**后台管理系统的实现**，看看如何把这些 CRUD 接口串联成一个完整的管理面板。

---

> 没有未来的小风酱 著  
> 2025-12-12重写 （已与源码核对，useSearchAndSort 的搜索排序分页集成可是亮点哦ov0）
