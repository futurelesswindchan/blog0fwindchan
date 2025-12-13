# 风风博客开发心得（六）：后台管理系统实战

> 本文揭秘博客的“暗面”——只有管理员才能进入的后台系统。基于 `src/views/admin/*` 及 `src/router/index.ts` 源码整理。

## 1. 守门员：登录与路由守卫

后台系统的第一道防线是鉴权。

### 1.1 登录页 (LoginView.vue)

UI 上我们保持了 Aero 风格，但在逻辑上非常严谨。

用户输入用户名密码后，调用 `adminStore.login()` 获取 Token。如果成功，会根据路由参数 `redirect` 跳转回之前的页面，或者默认进入编辑器。

```ts
// 登录成功后的跳转逻辑
const success = await adminStore.login(username.value, password.value)
if (success) {
  const redirect = (route.query.redirect as string) || '/editor'
  router.push(redirect)
}
```

### 1.2 路由守卫 (router/index.ts)

我们在路由配置中为后台页面添加了 `meta: { requiresAuth: true }`。

在 `beforeEach` 钩子中，我们检查这个标记：

```ts
router.beforeEach(async (to, from, next) => {
  const adminStore = useAdminStore()
  // 如果页面需要权限，且用户未认证
  if (to.meta.requiresAuth && !adminStore.isAuthenticated) {
    // 拦截并跳转登录页，同时带上当前想去的路径作为 redirect 参数
    next({ name: 'AdminLogin', query: { redirect: to.fullPath } })
    return
  }
  next()
})
```

这确保了即使有人直接在浏览器输入 `/admin/dashboard`，也会被无情地踢回登录页。

## 2. 指挥中心：DashboardView

`DashboardView.vue` 是内容管理的集散地，它集成了文章、友链和画廊的管理功能。

### 2.1 客户端分页与搜索

由于博客数据量相对较小（几百篇以内），我们将索引数据一次性拉取到前端，利用 Vue 的 `computed` 做**客户端搜索与分页**。这种体验比服务端分页更流畅，搜索是瞬时的。

逻辑链条如下：

1.  **原始数据**: `allArticles` (从 Store 获取)
2.  **过滤**: `filteredArticles` (根据 `searchText` 过滤标题/分类)
3.  **切片**: `paginatedArticles` (根据 `currentPage` 和 `pageSize` 切片)

```ts
// 典型的计算属性分页逻辑
const paginatedArticles = computed(() => {
  const start = (articlePage.value - 1) * pageSize
  const end = start + pageSize
  return filteredArticles.value.slice(start, end)
})
```

### 2.2 弹窗管理

对于“友链”和“画廊”这种轻量级数据，我们没有单独开页面，而是封装了 `FriendModal.vue` 和 `ArtworkModal.vue` 组件，在当前页面直接弹窗编辑。

## 3. 核心：EditorView (文章编辑器)

这是我最满意的部分。它支持**编辑模式**和**预览模式**的一键切换。

### 3.1 双模切换

- **编辑模式**: 显示 `textarea` 和元数据输入框（Slug、分类、日期）。
- **预览模式**: 隐藏输入框，展示渲染后的文章。

### 3.2 复用渲染引擎

为了保证“所见即所得”，预览模式并没有重新写一套样式，而是直接复用了前台的 `ContentTypeWriter.vue` 组件！

```html
<!-- 预览模式 -->
<div v-else class="article-content markdown-content">
  <ContentTypeWriter
    :content="form.content"
    :enabled="false"  <!-- 关键：关闭打字机动画，直接显示 -->
    :markdown-options="markdownOptions"
    :is-dark-theme="isDarkTheme"
  />
</div>
```

通过传入 `:enabled="false"`，我们让打字机组件变成了普通的 Markdown 渲染器。这样，你在后台看到的预览效果，和访客在前台看到的效果是**像素级一致**的。

### 3.3 智能判断

组件挂载时，会根据路由参数 `slug` 判断是“新建”还是“编辑”：

- **新建**: `isNewPost = true`，表单为空，默认进入编辑模式。
- **编辑**: `isNewPost = false`，调用 `fetchArticle` 拉取旧文，填充表单，默认进入预览模式。

## 4. 基础设施：ImageUploader

为了支持图文混排，我们封装了 `ImageUploader.vue`。

它利用 `FormData` 将文件 POST 到 `/upload` 接口。

- **上传前**: 检查文件类型。
- **上传中**: 显示 Loading 转圈。
- **上传后**: 显示图片预览，并提供删除按钮。

这个组件被广泛用于 `ArtworkModal`（上传画作）和 `FriendModal`（上传头像）。

## 5. 小结

后台管理系统虽然不直接面向访客，但它的好用程度直接决定了博主（也就是我、亦或是clone了此项目的你）的更文动力。

- **路由守卫**构筑了安全防线。
- **计算属性**实现了流畅的列表交互。
- **组件复用**（ContentTypeWriter）让预览功能开发事半功倍。

到现在为止，我们的前端部分（前台展示 + 后台管理）已经完全解析完毕。  
但这一切的数据从何而来？Token 是谁签发的？Markdown 存在哪里？

下一篇（也是最后一篇），我们将深入**后端架构**，揭秘 Flask + SQLite 是如何支撑起这一切的。

---

> 没有未来的小风酱 著  
> 2025-12-12重写 （已与源码核对，EditorView 的预览复用真棒对吧？！）
