# Vol.6 后台管理（上）：为了偷懒，于是写了个 CMS (´･ω･`)?

> **摘要**：人类进化的核心驱动力依然是那个字——**懒**。小风酱实在受够了每次发文章、加友链都要打开 VS Code，手写 JSON，然后 Git Push 的日子了。

## 1. 痛苦的起源：JSON 地狱

在很久很久以前，风风博客的数据是这样维护的：

1.  打开 `.../articles/index.json`。
2.  复制粘贴一段 JSON 对象。
3.  小心翼翼地修改 `title`、`date`、`slug`。
4.  如果不小心少写了一个逗号……BOOM！整个博客白屏。

**“这太蠢了！”** 小风酱摔键盘，**“我要一个后台！我要一个能上传图片、能写 Markdown、能点一下就保存的后台！”**

于是，后端服务 `app.py` 应运而生。

---

## 2. 后端架构：Flask + SQLAlchemy

为了快速开发（偷懒），后端选用了 Python 的 Flask 框架，搭配 SQLAlchemy 进行 ORM 建模。

### 2.1 重新定义世界（数据库模型）

原本散落在 JSON 里的数据，变成了数据库里的表。

**文章模型 (`Article`)**：
这是博客的核心。注意 `content` 字段，它将存储 Markdown 源码。

```python
# backend/app.py

class Article(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    # URL 里的唯一标识，比如 'my-first-blog'
    slug: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[str] = mapped_column(String(20), nullable=False)
    # 这里存 Markdown 纯文本
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # 外键关联分类
    category_id: Mapped[int] = mapped_column(ForeignKey("category.id"), nullable=False)
```

**友链模型 (`Friend`)**：
友链的数据结构比较简单，但为了灵活，要用 `JSON` 类型来存储 `tags`（标签），这样以后想加什么标签都行。

```python
class Friend(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    url: Mapped[str] = mapped_column(String(200), nullable=True)
    avatar: Mapped[str] = mapped_column(String(200), nullable=True)
    # 比如 ['大佬', '技术宅', '猫奴']
    tags: Mapped[Optional[List[str]]] = mapped_column(JSON, nullable=True)
```

### 2.2 历史的搬运工：数据迁移脚本

有了数据库，旧的 JSON 数据怎么办？扔了吗？当然不行！
小风酱写了一个 `init_db.py`，专门负责把旧世界的遗产搬运到新世界。

这个脚本最骚的操作在于**静态资源的迁移**。它不仅读取 JSON 插入数据库，还会把 `frontend/legacy_data` 里的图片自动复制到 `backend/static` 目录下，并修正数据库里的图片路径。

```python
# backend/init_db.py

def migrate_friends():
    # 读取旧 JSON
    with open(json_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    for item in data.get("friends", []):
        avatar = item.get("avatar", "")
        # 路径修正：把前端相对路径改为后端静态资源路径
        if avatar and not avatar.startswith("/static"):
            avatar = f"/static/{avatar.lstrip('/')}"

        friend = Friend(
            name=item.get("name"),
            # ... 其他字段
        )
        db.session.add(friend)

    db.session.commit()
    print("✅ 友链迁移完成，图片路径已修正。")
```

---

## 3. 前端控制台：DashboardView

后端准备好了，前端的 **Dashboard（控制台）** 就是小风酱的指挥中心。

还记得 **Vol.5** 里那个万能的 `useSearchAndSort` 吗？在这里，它再次封神。

### 3.1 极简的列表管理

在后台需要管理文章、友链、画廊三个板块。通过 Tab 切换，就可以复用大量的逻辑。

看看这清爽的代码，因为有了封装，小风酱只需要关注业务本身：

```typescript
// src/views/admin/DashboardView.vue

// 1. 文章分页逻辑
const { filteredItems: paginatedArticles, pagination: articlePagination } = useSearchAndSort({
  items: allArticles,
  searchFields: (item) => [item.title, item.category],
  // ...
})

// 2. 友链分页逻辑
const { filteredItems: paginatedFriends, pagination: friendPagination } = useSearchAndSort({
  items: friendStore.friends,
  searchFields: (item) => [item.name, item.url],
  // ...
})
```

### 3.2 弹窗式编辑 (Modal)

为了体验丝滑，在管理友链和画廊时，并没有采用跳转新页面的方式，而是使用了 **Modal（模态框）**。

点击编辑按钮，`GlobalModalStore` 会把当前选中的数据塞进去，然后弹出一个 `FriendModal.vue`。

```html
<!-- DashboardView.vue -->
<button @click="modalStore.openFriendModal(friend)" class="icon-btn edit">
  <i class="fas fa-pen"></i>
</button>

<!-- FriendModal.vue -->
<script setup>
  // 监听 store 里的数据变化，自动回填表单
  watch(
    () => modalStore.editingFriend,
    (newVal) => {
      if (newVal) {
        form.name = newVal.name
        form.url = newVal.url
        // ...
      }
    },
  )
</script>
```

---

## 4. 核心功能：所见即所得编辑器

这是小风酱最自豪的部分——**EditorView**。
它不是简单的 `<textarea>`，而是一个集成了 **Markdown 实时预览**、**自定义魔法样式**、**素材库** 的超级编辑器。

### 4.1 魔法菜单 (Magic Menu)

普通的 Markdown 编辑器只能加粗、斜体。但风风博客需要五彩斑斓的文字！
于是，小风酱在工具栏里加了一个魔法棒按钮。

```typescript
// EditorView.vue

// 魔法配置：颜色、背景、字体
const magicTabs = [
  { key: 'color', name: '文字色' },
  { key: 'bg', name: '背景色' },
  { key: 'font', name: '字体' },
]

// 应用魔法的原理：插入 HTML 标签
const applyMagic = (className: string) => {
  // 在选中的文字外层包裹 span
  applyFormat(`<span class="${className}">`, `</span>`)
}
```

点击红色时，编辑器会自动在选中文本周围插入 `<span class="text-red">...</span>`。配合前端的 CSS，文章瞬间生动起来！

### 4.2 素材库与图片上传

写文章最麻烦的是什么？**插图**。
以前要手动把图片扔进文件夹，改名，然后写路径。
现在，有了 **AssetLibraryModal（素材库）**。

**流程如下：**

1.  点击工具栏的图片按钮，弹出素材库。
2.  点击上传新素材，选择本地图片。
3.  **ImageUploader 组件** 将图片通过 `FormData` 发送给后端 `/api/upload` 接口。
4.  后端保存图片到 `static/uploads/article/`，返回 URL。
5.  素材库刷新，显示新图片。
6.  点击图片，自动将 `![描述](/static/uploads/...)` 插入到文章光标处。

```typescript
// ImageUploader.vue
const handleFileChange = async (event) => {
  const formData = new FormData()
  formData.append('file', file)

  // 调用后端上传接口
  const response = await api.post('/upload', formData)

  // 抛出事件，告诉父组件图片 URL
  emit('update:modelValue', response.data.url)
}
```

---

## 5. 总结

至此，小风酱已经拥有了一个功能完备的 CMS：

- ✅ **数据库**：结构化存储所有数据。
- ✅ **迁移脚本**：平滑过渡旧数据。
- ✅ **控制台**：高效管理列表，复用搜索排序逻辑。
- ✅ **编辑器**：支持 Markdown、自定义样式和便捷的图片上传。

但是……细心的人可能发现，**好像还没讲怎么登录？**
现在的后台接口虽然写了 `@jwt_required`，但前端是怎么把 Token 带过去的？如果 Token 过期了怎么办？

下一篇 **Vol.7 后台管理（下）：JWT 鉴权与安全防线**，将补上这块拼图，打造一个固若金汤（大概）的安全系统！

---

> 终于可以躺在床上用 iPad 写博客的小风酱 著
