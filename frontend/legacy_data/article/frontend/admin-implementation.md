# 风风博客开发心得（六）：后台管理系统实战

> 本文揭秘博客的“暗面”——只有管理员才能进入的后台系统。基于 `src/views/admin/*` 及相关组件源码整理，已与 **2025/12/19 版本** 代码对齐。

## 1. 守门员：登录与鉴权

后台系统的第一道防线是鉴权。

### 1.1 登录页 (LoginView.vue)

UI 上我们保持了 Aero 风格，标题虽是“芝麻开门”，~~充满了中二气息QwQ~~但在逻辑上却非常严谨：

用户输入用户名密码后，调用 `adminStore.login()` 获取 Token。如果成功，会根据路由参数 `redirect` 跳转回之前的页面，或者默认进入编辑器。

```ts
// 登录成功后的跳转逻辑
const success = await adminStore.login(username.value, password.value)
if (success) {
  // 如果是被路由守卫拦截过来的，就跳回去；否则默认去仪表盘
  const redirect = (route.query.redirect as string) || '/dashboard'
  router.push(redirect)
}
```

### 1.2 路由守卫

我们在路由配置中为后台页面添加了 `meta: { requiresAuth: true }`。即使有人直接在浏览器输入 `/admin/dashboard`，路由守卫也会检测到 `!adminStore.isAuthenticated`，无情地将其踢回登录页。

## 2. 指挥中心：DashboardView

`DashboardView.vue` 是内容管理的集散地，它通过 Tab 切换集成了**文章**、**友链**和**画廊**三大板块的管理功能。

### 2.1 客户端分页与搜索

由于博客数据量相对较小（几百篇以内），我们将索引数据一次性拉取到前端，利用 Vue 的 `computed` 做**客户端搜索与分页**。

虽然前台列表我们封装了 `useSearchAndSort`，但在 Dashboard 里，为了应对多 Tab 的复杂状态切换，我们选择手动实现这套逻辑，流程如下：

1.  **数据源**: `allArticles` (从 Store 获取并展平分类)。
2.  **过滤**: `filteredArticles` (根据 `searchText` 过滤标题/分类)。
3.  **切片**: `paginatedArticles` (根据 `currentPage` 和 `pageSize` 切片)。

这种“全量拉取 + 前端切片”的模式，让搜索响应速度达到了毫秒级，体验极佳。

### 2.2 弹窗管理

对于“友链”和“画廊”这种轻量级数据，我们没有单独开页面，而是封装了 `FriendModal.vue` 和 `ArtworkModal.vue` 组件。点击编辑时，弹窗直接浮起，背景高斯模糊，操作完成后无缝刷新列表。

## 3. 核心：EditorView (文章编辑器)

这是我最满意的部分。它支持**编辑模式**和**预览模式**的一键切换。

### 3.1 双模切换

- **编辑模式**: 显示标题输入框、元数据配置栏（Slug、分类、日期）以及巨大的 Markdown `textarea`。
- **预览模式**: 隐藏所有输入控件，只保留标题展示，正文区域直接渲染 Markdown。

### 3.2 复用渲染引擎

为了保证“所见即所得”，预览模式并没有重新写一套样式，而是直接复用了前台的 `ContentTypeWriter.vue` 组件！

```html
<!-- 预览模式 -->
<div v-else class="article-content markdown-content">
  <ContentTypeWriter
    :content="form.content"
    :enabled="false"  <!-- 关键：关闭打字机动画，直接显示静态内容 -->
    :markdown-options="markdownOptions"
    :is-dark-theme="isDarkTheme"
  />
</div>
```

通过传入 `:enabled="false"`，我们让打字机组件瞬间变身为一个普通的 Markdown 渲染器。这样，你在后台看到的预览效果，和访客在前台看到的效果是**像素级一致**的。

### 3.3 智能判断

组件挂载时，会根据路由参数 `slug` 判断是“新建”还是“编辑”：

- **新建**: `isNewPost = true`，表单为空，默认进入编辑模式。
- **编辑**: `isNewPost = false`，调用 `fetchArticle` 拉取旧文填充表单，默认进入预览模式。

## 4. 基础设施：ImageUploader

为了支持图文混排，我们封装了 `ImageUploader.vue`。它被广泛用于 `ArtworkModal`（上传画作）和 `FriendModal`（上传头像）。

核心逻辑是利用 `FormData` 将文件 POST 到 `/upload` 接口：

```ts
const handleFileChange = async (event: Event) => {
  const file = target.files?.[0]
  const formData = new FormData()
  formData.append('file', file)

  // 上传并回填 URL
  const response = await api.post('/upload', formData)
  emit('update:modelValue', response.data.url)
}
```

UI 上，它支持拖拽上传（虽然代码里主要写了点击上传awa），上传成功后会显示图片预览，并提供删除按钮，体验非常流畅。

## 5. 小结

后台管理系统虽然不直接面向访客，但它的好用程度直接决定了博主的更文动力。

- **Dashboard** 用客户端计算实现了极速的列表交互。
- **Editor** 通过复用组件实现了完美的所见即所得。
- **ImageUploader** 抹平了文件上传的复杂度。

到现在为止，我们的前端部分（前台展示 + 后台管理）已经完全解析完毕。
但这一切的数据从何而来？Token 是谁签发的？Markdown 存在哪里？

下一篇（也是最后一篇），我们将深入**后端架构**，揭秘 Flask + SQLite 是如何支撑起这一切的。

---

> 没有未来的小风酱 著  
> 2025-12-19 更新 （已与源码核对，EditorView 的预览复用真棒对吧？！）
