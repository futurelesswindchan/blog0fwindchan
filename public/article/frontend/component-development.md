# 风风博客博客开发心得（八）：组件开发与复用经验

> 本文把通用组件设计与复用实践与仓库中真实的文件路径和实现约定对齐，参考目录：`src/components/common/`、`src/directives/`、`src/composables/`。

## 1. 设计原则与目录约定

项目遵循高内聚、低耦合的组件设计。通用组件放在 `src/components/common/`，布局相关放在 `src/components/layout/`，页面级视图放在 `src/views/`。读者可以直接在这些目录中找到对应实现。

### 常用通用组件（仓库位置示例）

- `TypeWriter` — `src/components/common/TypeWriter.vue`：文字/标题级别的打字机效果。
- `ContentTypeWriter` — `src/components/common/ContentTypeWriter.vue`：封装了 Markdown 渲染与打字机动画，正文的统一入口。
- `LazyImage` — `src/components/common/LazyImage.vue`：图片懒加载、占位与失败重试。
- `ArticleNavigation` — `src/components/ArticleNavigation.vue`：文章底部的上一页/下一页导航。
- `MobileNavPanel` — `src/components/layout/MobileNavPanel.vue`：移动端抽屉导航（会 emit `close` 与 `toggle-theme`）。

## 2. 参数化与事件约定

组件以清晰的 props 和 emit 约定暴露能力。例如 `ContentTypeWriter` 的常见 props：`content`、`markdownOptions`、`isDarkTheme`、`speed`、`initialDelay`、`chunkSize`。移动抽屉 `MobileNavPanel` 会在关闭时 `$emit('close')`，并在主题切换时 `$emit('toggle-theme')`。

事件与插槽是组件复用的核心：父组件通过 `v-on` 捕获子组件事件，插槽用于内容定制化。

## 3. 指令与 Composables（源码文件）

- 指令：`v-type-writer` 的实现位于 `src/directives/typeWriterDirective.ts`，用于在任意元素上添加文字打字效果。
- 组合式函数（Composables）分布在 `src/composables/`：
  - `useArticleContent`（文章加载与 Markdown 配置）
  - `useArticleInfo`（字数统计、文章元信息）
  - `useArticleNavigation`（计算上一篇/下一篇）
  - `useCodeHighlight`（代码高亮封装）
  - `useSearchAndSort`（本地搜索排序）
  - `useThrottledScrollHandler`（节流滚动处理）

这些 composable 将逻辑从组件中抽离，方便测试与复用。

## 4. 组件通信与状态管理

推荐使用 Props/emit 做父子通信，跨页面共享状态使用 Pinia（示例 store 在 `src/views/stores/`）。主题、壁纸偏好、导航折叠状态等由 store 管理并持久化（如 `localStorage`）。

## 5. 响应式适配（实现细节）

样式与交互受 `isMobile` 状态影响（由 `MainLayout` 检测 window 宽度），并通过媒体查询在 CSS 中降级某些特效（例如 `@media (hover: none)` 禁用 backdrop-filter）。组件通过 CSS 变量支持主题切换。

## 6. 性能实践

- 图片与插画使用 `LazyImage` 组件，支持占位与失败重试。
- 打字机、动画与重绘敏感操作使用节流或按需触发，避免频繁重排。
- 列表筛选/排序在内存中使用 `useSearchAndSort`，无需额外网络请求。

## 7. 典型代码片段（与源码相符）

### 7.1 使用 Composable 计算上/下一篇

```ts
// src/composables/useArticleNavigation.ts（概要）
export function useArticleNavigation({ articles, currentId }) {
  const prevArticle = computed(() => {
    // 根据 articles 列表与 currentId 计算
  })
  const nextArticle = computed(() => {
    // 同上
  })
  return { prevArticle, nextArticle }
}
```

### 7.2 懒加载图片组件模板

```vue
<!-- src/components/common/LazyImage.vue（概要） -->
<template>
  <img
    :src="loaded ? src : placeholder"
    :alt="alt"
    @load="onLoad"
    @error="onError"
    :style="containerStyle"
  />
</template>
```

### 7.3 指令用法示例

```html
<h2 v-type-writer="{ speed: 30 }">渐进式标题效果</h2>
```

## 8. 小结

仓库已把通用能力（动画、Markdown 渲染、图片懒加载、导航计算等）通过组件与 composable 做了良好封装。实际开发中优先复用 `src/components/common/*` 与 `src/composables/*` 的实现，避免重复造轮子。

---

> 没有未来的小风酱 著
> 2025-12-1 (已与全栈架构同步)
