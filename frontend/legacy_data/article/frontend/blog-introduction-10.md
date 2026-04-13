# Vol.10 生产力解放：CMS 控制台 Dashboard 与魔法编辑器

> **摘要**：如果是纯前端网页，最痛苦的莫过于每次发文章还要去改代码或者手写 JSON。在这一篇中，我们将正式跨过绝对领域的登录防线，进入风风博客的心脏地带——CMS 后台管理系统。  
> 看看小风酱是如何用一个极其科幻的 Dashboard 统管全站数据，并手搓出一个自带“魔法”的所见即所得 Markdown 编辑器的！

---

## 1. 欢迎来到指挥中心：DashboardView

穿过中二感爆棚的 `LoginModal`，映入眼帘的便是整个博客的神经中枢—— `DashboardView.vue`。

在这里，小风酱抛弃了传统后台那种“左侧长条菜单、右侧内容区”的古板设计，而是采用了极具风格的 **顶部悬浮 Tab 切换栏**。  
这不仅让界面看起来更像是一个赛博朋克的仪表盘，还把宝贵的屏幕空间全都留给了数据表格。

### 1.1 会“读心”的动态操作按钮

在 Tab 栏的下方，有一个非常抓人眼球的悬浮操作按钮。  
它不仅仅是一个呆板的“新建”按钮，还会根据你当前所在的 Tab 动态切换自己的形态和文案！

```typescript
// DashboardView.vue：根据当前 Tab 智能切换按钮文案和图标
const createButtonText = computed(() => {
  switch (currentTab.value) {
    case 'friends':
      return '有新朋友'
    case 'gallery':
      return '传新作品'
    case 'plans':
      return '定新计划'
    case 'sponsors':
      return '感谢投喂'
    default:
      return '写新文章'
  }
})
```

配合 CSS 的 `transform: translateX(3px)` 悬浮小动画，每次点击它，都会极其丝滑地唤起我们在 **Vol.7** 中布下的 `GlobalModalStore` 全局弹窗体系（比如 `modalStore.openFriendModal()`）。  
这种无缝衔接的体验，简直让人上瘾！awa

### 1.2 终极复用：收割 `useSearchAndSort` 的胜利果实

还记得 **Vol.7** 里我们为了“偷懒”而封装的那个万能 Hook `useSearchAndSort` 吗？  
在 Dashboard 里，它终于展现出了毁天灭地的统治力！

在这个页面中，我们同时管理着 **文章、画廊、友链、投喂、计划** 整整五个模块。如果按传统写法，光是声明搜索变量和分页逻辑，代码就能轻松突破上百行。但现在呢？

```typescript
// 只需要像点菜一样，呼叫五次 Hook！
// --- 1. 文章搜索与分页 ---
const { filteredItems: paginatedArticles, pagination: articlePagination } = useSearchAndSort({...})

// --- 2. 友链搜索与分页 ---
const { filteredItems: paginatedFriends, pagination: friendPagination } = useSearchAndSort({...})

// --- 3. 计划搜索与分页 ---
const { filteredItems: paginatedPlans, pagination: planPagination } = useSearchAndSort({...})

// ... (画廊和投喂同理)
```

**五大模块，统一的灵魂！** 底层的排序、搜索、越界重置全被 Hook 默默扛下。  
在模板中，只需要无脑接入 `<FilterBar>` 和 `<PaginationControls>`，一个功能完备的后台表格就诞生了。这，就是架构设计的极致浪漫！✨

---

## 2. 驯服 Markdown：沉浸式魔法编辑器

在 Dashboard 里点击“写新文章”，我们就会跃迁到 `EditorView.vue`。  
市面上有很多现成的富文本编辑器（如 WangEditor、TinyMCE），但它们生成的 HTML 往往臃肿不堪。作为纯粹的 Markdown 原教旨主义者，小风酱决定： **自己手搓一个带有极客魔法的编辑器！**

### 2.1 双轨模式：编辑与预览的瞬间切换

整个编辑器被极简地分成了两层：  
通过右下角的悬浮按钮（ `floating-actions`），你可以一键在 **编辑模式** 和 **预览模式** 之间切换。

最绝的是，这里的预览模式，直接复用了我们在 **Vol.6** 中打造的核武器—— `ContentTypeWriter.vue` 打字机引擎！  
也就是说，你在后台看到的预览效果，和用户在前台看到的最终渲染效果， **是 100% 像素级一致的！**

### 2.2 细节狂魔：光标记忆系统

手搓编辑器最大的痛点是什么？  
**“当你点击加粗按钮时，文本框失去了焦点，光标瞬间飞到了九霄云外！”** QAQ

为了解决这个极其破坏心流的问题，小风酱在底层写了一个极其严谨的**光标记忆拔锚系统**：

```typescript
// EditorView.vue：保存当前光标位置
const saveCursorPosition = () => {
  const textarea = textareaRef.value
  if (!textarea) return { start: 0, end: 0 }
  return {
    start: textarea.selectionStart,
    end: textarea.selectionEnd,
  }
}

// 核心武器：通用格式应用函数
const applyFormat = (prefix: string, suffix: string) => {
  const cursorPos = saveCursorPosition() // 1. 记住光标位置
  const start = cursorPos.start
  const end = cursorPos.end

  // 2. 提取选中的文本，如果没有选中，就默认塞个“文本”进去
  const selectedText = form.content.substring(start, end)
  const textToInsert = selectedText || '文本'

  // 3. 拼接字符串：前半段 + 前缀 + 文本 + 后缀 + 后半段
  form.content =
    form.content.substring(0, start) + prefix + textToInsert + suffix + form.content.substring(end)

  // 4. 精准计算新光标的位置，并强制重新聚焦！
  const newCursorPos = selectedText
    ? start + prefix.length
    : start + prefix.length + textToInsert.length
  restoreCursorPosition({ start: newCursorPos, end: newCursorPos })
}
```

有了这套系统，无论你是按快捷键 `Ctrl+B`，还是点击工具栏，插入 `**加粗**` 或 `~~删除线~~` 后，光标都会极其乖巧地停留在字体的正中间，等待你继续输入。这种丝滑，只有真正写过文章的人才懂！0w0

---

## 3. 独创的风风魔法：Magic 菜单

标准的 Markdown 语法只有黑白的文字。如果想给某句话加上彩色的背景，或者换个花体字怎么办？  
小风酱在工具栏里藏了一个名为 `Magic` 的魔法阵！

点击带有 `fa-wand-magic-sparkles` 图标的魔法按钮，会弹出一个包含了 **文字色、背景色、字体** 的调色盘（ `magic-dropdown`）。

当你选中一段文字，并点击 `bg-wind` 时：

```typescript
const applyMagic = (className: string) => {
  applyFormat(`<span class="${className}">`, `</span>`)
}
```

它会在你的 Markdown 里悄悄注入带有特定 CSS 类名的 HTML 标签。配合前台的全局 CSS，这段文字瞬间就会染上赛博风的渐变彩光！在 Markdown 里写 CSS，这是属于前端开发者的终极特权！(￣▽￣)／

---

## 4. 梦幻联动：图片排版与全局素材库

文章怎么能没有图片？但在普通的 Markdown 里，图片只能孤零零地占据一行，想要实现“文字环绕”或者“满宽大图”简直是做梦。

小风酱的解决方案是： **素材库回调 + 布局选择器！**

当你点击工具栏的“插入图片”时：

1. **呼叫支援**：立刻调用全局弹窗 `modalStore.openAssetLibrary(handleInsertImage)`，打开精美的素材库选图。
2. **布局拦截**：选好图片后，不直接插入，而是触发 `layoutStore.openModal`，再次弹出一个 UI 界面，让你选择排版方式（自适应、全宽、文字内联、左浮动、右浮动）以及拖拽调整尺寸。
3. **精准注入**：最后，带着布局信息，生成专属的 HTML 标签，并利用我们刚才的“光标记忆系统”，完美插回文章中！

```typescript
// 根据排版选择注入专属的 CSS 魔法类！
const handleImageLayoutConfirm = (layoutId: string, size: number) => {
  // ... 前略
  switch (layoutId) {
    case 'left':
      imageMarkup = `\n<img class="img-left" src="${url}" style="max-width: ${size}rem;" />\n`
      break
    // ... 其他排版
  }
  // 注入并恢复光标！
}
```

从素材库选图，到自定义视觉排版，最后回到编辑器，整个流程行云流水，没有任何页面刷新和割裂感。

---

## 下集预告

现在，我们有了一个极其强大的 CMS 控制台，也有了一个写起来让人上瘾的魔法编辑器。前端的武备库已经全部装填完毕，甚至连调用后端的接口都已经准备就绪。

但是！有一个极其致命的安全隐患一直悬在我们的头顶：  
**如果没有良好的鉴权机制，黑客岂不是可以随便拿着伪造的请求，把我们的文章删个精光？！** 😱

而且，如果我们的 Token 只有 2 小时有效期，难道要让小风酱在写长篇大论写到一半的时候，被系统一脚踢出去重新登录吗？！这绝对不行！

下一篇 **【Vol.11 绝对防御：JWT 双 Token 机制与 Axios 拦截器无感刷新】** ，我们将揭开项目源码里 `api/index.ts` 的神秘面纱。看看小风酱是如何利用 Access Token 和 Refresh Token 打造出一套坚不可摧，且对用户极其温柔的“无感刷新”防御阵线的！

别走开，硬核的网络安全魔法即将上演！(>w<)

---

> 沉迷给文字加彩虹特效的小风酱 著 🌈  
> 本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
