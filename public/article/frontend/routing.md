# 风风博客博客开发心得（三）：路由与页面导航实现

> 本文基于仓库内实际实现（`src/router/index.ts`、`src/components/layout/*` 等）整理路由结构、页面导航与路由守卫等细节，便于开发者直接在代码中定位实现。

## 1 路由系统设计（实际实现）

项目使用 Vue Router 4，路由主配置位于 `src/router/index.ts`，整体采用 `MainLayout.vue` 作为根布局，路由要点如下：

- 根页面实际为 `/home`，且 `/` 会重定向到 `/home`（保持 `MainLayout`）。
- 文章相关集中在 `/articles` 下，包含 `frontend`、`topics`、`novels` 等子路由；每篇文章使用 `:id` 参数并复用 `ArticleDetailView.vue` 来渲染内容。
- 其他主要路由：`/gallery`、`/friends`、`/settings` 等。未匹配路由会被重定向到 `/home`（而非单独的 404 组件）。

示例（节选自 `src/router/index.ts`）：

```ts
{
  path: '/',
  component: MainLayout,
  children: [
    { path: 'home', name: 'Home', component: () => import('@/views/HomeView.vue'), meta: { title: '正在首页~' } },
    { path: '', redirect: { name: 'Home' } },
    { path: 'articles', children: [ /* frontend, topics, novels, ... */ ] },
    { path: 'gallery', name: 'Gallery', component: () => import('@/views/GalleryView.vue') },
    { path: 'friends', name: 'Friends', component: () => import('@/views/FriendsView.vue') },
    { path: 'settings', name: 'Settings', component: () => import('@/views/SettingsView.vue') },
  ]
},
{ path: '/:pathMatch(.*)*', redirect: '/home' },
```

### 1.1 Meta 信息

路由中普遍使用 `meta.title` 来表示“当前位置”文本（MainLayout 会读取并通过打字机 `TypeWriter` 显示）。这也方便将来用于动态设置 `<title>` 或 SEO 相关的逻辑。

## 2 路由行为与导航细节

### 2.1 滚动行为（scrollBehavior）

路由实例里配置了自定义的 `scrollBehavior`：所有页面切换都会立即滚动到顶部，项目中使用：

```ts
scrollBehavior() {
  return { top: 0, left: 0, behavior: 'instant' }
}
```

这保证了路由切换时不会保留上一个页面的滚动位置，适合以阅读为主的站点体验。

### 2.2 路由守卫与页面过渡控制

实际代码在 `router.beforeEach` 中：

- 会在导航开始时向 `document.documentElement` 添加 `page-transitioning` 类，用于触发页面过渡（CSS 中会监听并应用模糊/遮罩等效果）。
- 根据目标路由名称做按需预加载：目前实现会在跳转到 `Friends` 时调用 `useFriendStore().fetchFriends()`，在跳转到 `Gallery` 时调用 `useArtworkStore().fetchArtworks()`。如果数据已存在则跳过请求。
- 在 `beforeEach` 中捕获异常并保证执行 `next()`，避免因为预加载失败导致导航阻塞。

示例（节选）：

```ts
router.beforeEach(async (to, from, next) => {
  document.documentElement.classList.add('page-transitioning')
  try {
    if (to.name === 'Friends') {
      await useFriendStore().fetchFriends()
    } else if (to.name === 'Gallery') {
      await useArtworkStore().fetchArtworks()
    }
    next()
  } catch (err) {
    console.error(err)
    next()
  }
})

router.afterEach(() => {
  setTimeout(() => document.documentElement.classList.remove('page-transitioning'), 400)
})
```

TRANSITION_DURATION 在路由文件中设置为 400ms，与 CSS 过渡保持一致以保证视觉连贯。

## 3 页面导航组件（桌面与移动）

导航实现分成桌面端 `NavPanel.vue`（固定侧边栏）和移动端 `MobileNavPanel.vue`（抽屉式）。两者在实现上保持一致的路由项定义（`navItems`），并在样式与交互上作差异化处理。

共同点：

- 都使用 `<router-link>` 渲染导航项，并根据 `item.exact` 与 `item.matchPrefix` 来控制激活样式与前缀匹配（例如 `/articles/frontend/...` 会匹配 `/articles` 前缀）。
- 都在导航列表末尾放置“主题切换”按钮，父组件通过 `@toggle-theme` 响应切换逻辑。

桌面端 `NavPanel.vue` 的特点：

- 支持收起/展开（`isExpanded`），收起时仅显示图标，展开时显示标签。收起/展开通过向父组件抛出 `toggle` 事件控制。
- 使用 `router-link` 的 `exact` / `active` 类并额外通过 `item.matchPrefix && $route.path.startsWith(item.path)` 来实现“前缀高亮”。

移动端 `MobileNavPanel.vue` 的特点：

- 采用滑入滑出动画（`slideIn` / `slideOut`），关闭时通过设置 `isClosing` 触发退出动画，动画结束后通过 `@animationend` 发出 `close` 事件给父组件。
- 在点击导航项时会调用 `handleClose()` 来优雅关闭抽屉（避免瞬间关闭引起样式抖动）。

示例（navItems 的结构）：

```js
const navItems = [
  { path: '/home', iconType: ['fas', 'home'], label: '这是首页', exact: true, matchPrefix: true },
  { path: '/articles', iconType: ['fas', 'book-open'], label: '文章导航', matchPrefix: true },
  { path: '/gallery', iconType: ['fas', 'images'], label: '绘画长廊', matchPrefix: true },
  { path: '/friends', iconType: ['fas', 'paw'], label: '友情链接', matchPrefix: true },
]
```

## 4 路由与数据联动（实用细节）

- 通过路由守卫延迟预加载可以避免页面进入时的数据闪烁，但也会在导航前增加网络延迟；当前实现只在必要路由预加载并做了存在性检查以避免重复请求。
- 页面级组件通常监听 `route.params` 来加载对应资源（例如 `ArticleDetailView` 根据 `:id` 加载文章内容），这保证了刷新和直接访问链接时仍能正常渲染。

## 5 TODO

- 如果希望页面切换更流畅，可在 `index.html` 或根组件做首次主题/壁纸的同步（减少首屏闪烁）。
- 对于更复杂的预加载策略，可以引入路由级的 `meta.preload` 标记，并在 `beforeEach` 根据该标记统一处理，而不是在代码中显式判断路由名。
- 若需支持 SEO 更友好的 title/head 管理，建议在 `afterEach` 中根据 `to.meta.title` 更新 `document.title` 或集成 `vue-meta`。

## 补充说明

- 关于 `scrollBehavior` 中的 `behavior: 'instant'`：

  - 说明：`'instant'` 不是浏览器 `ScrollToOptions` 的标准字符串（标准为 `'auto' | 'smooth'`），这是项目约定而非浏览器 API 标准；如果希望更严格兼容浏览器，可以使用 `'auto'` 或在需要平滑滚动时使用 `'smooth'`。

- 路由守卫中 `await` 的可见性与性能影响：

  - 说明：`beforeEach` 中 `await` store 请求会阻塞导航直到请求完成。当前实现通过 `loaded` 检查与内部的 `fetchPromise` 并发锁已做了良好保护，但若后端响应不稳定或请求较慢，用户会感到导航延迟：
    - 若不希望阻塞导航，可在 `afterEach` 或组件内触发加载并显示 loading 占位；
    - 或者仅对极少数关键路由（必须先有数据才能渲染）保留 `await`，其余使用非阻塞加载策略。

## 6 小结

本项目的路由实现以 `MainLayout` 为基线，采用嵌套路由把内容按功能区分，结合路由守卫做按需预加载与页面过渡控制；导航组件在桌面与移动端做了交互适配（展开/收起、抽屉动画、主题切换入口），整体以用户阅读体验为出发点。

---

> 没有未来的小风酱 著（本文已与代码同步）
> 2025-12-02
