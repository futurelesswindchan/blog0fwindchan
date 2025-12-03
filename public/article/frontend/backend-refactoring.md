# 风风博客开发心得（九）：后端重构与数据迁移实战

> 本文记录了项目从纯前端静态架构（JSON驱动）向前后端分离架构（Flask + SQLite）迁移的完整过程。  
> 参考目录：`backend/app.py`、`backend/init_db.py`、`src/stores/`。

## 1. 架构演进与技术选型

为了解决纯静态博客在内容管理上的局限性（如无法动态增删改、发布流程繁琐），项目引入了 Python 后端。  
技术栈选择了轻量级且生态成熟的组合：

- **Web 框架**：Flask — 极简、灵活，适合个人项目快速迭代。
- **数据库**：SQLite — 无需配置服务的嵌入式数据库，单文件存储，备份极其方便。
- **ORM**：Flask-SQLAlchemy (v3.x) — 采用 SQLAlchemy 2.0 的现代风格 (`Mapped`, `mapped_column`) 进行强类型声明。

## 2. 数据库模型设计

在 `backend/app.py` 中，我们设计了四张核心表，分别对应原有的 JSON 数据结构，但加入了关系约束。

### 核心模型约定

- **Category (分类表)**：定义文章的大类（技术手记、幻想物语等）。
- **Article (文章表)**：存储核心内容。**关键决策**是直接在表中增加 `content` (Text) 字段存储 Markdown 源码，不再依赖外部 `.md` 文件。
- **Friend/Artwork**：利用 SQLite 对 JSON 的支持，将 `tags` 等数组字段直接存为 JSON 类型，简化了关联表的复杂度。

## 3. API 设计策略：适配器模式

为了最小化前端重构成本，后端 API 的设计遵循了“向下兼容”的原则。  
例如 `GET /api/articles/index` 接口，并没有简单返回数据库行，而是由后端在内存中重组数据，输出与原 `index.json` 完全一致的嵌套结构：

```json
{
  "frontend": [ { "id": "...", "title": "..." }, ... ],
  "topics": [ ... ]
}
```

这种策略使得前端 `ArticleView.vue` 等组件几乎无需修改逻辑即可无缝接入新后端。

## 4. 数据迁移自动化

从文件系统迁移到数据库是本次重构的难点。我们编写了 `backend/init_db.py` 脚本实现自动化迁移：

1.  **清洗**：执行前清空现有表，防止数据重复。
2.  **映射**：建立 `JSON Key` -> `Category Name` 的映射字典。
3.  **读取与入库**：
    - 遍历 `public/` 下的 JSON 读取元信息。
    - 自动读取对应的 `.md` 文件内容作为字符串存入数据库。
    - 使用 SQLAlchemy 的 `session` 批量提交，确保数据完整性。

## 5. 前端 Store 的重构与代理配置

### Store 层改造

前端移除了所有读取静态 JSON 和 Markdown 文件的逻辑。  
以 `src/stores/articleStore.ts` 为例，`fetchArticleIndex` 和 `fetchArticle` 被改造为异步 API 请求。

### 解决 CORS/CSP 问题

开发环境下，利用 Vite 的反向代理解决跨域与安全策略限制。  
在 `vite.config.ts` 中配置：

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:5000', // 转发给本地 Flask
      changeOrigin: true
    }
  }
}
```

这使得前端只需请求 `/api/...`，既规避了浏览器的 CSP 限制，又模拟了生产环境 Nginx 的转发行为。

## 6. 典型代码片段

### 6.1 SQLAlchemy 2.0 模型定义

```python
# backend/app.py
class Article(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    title: Mapped[str] = mapped_column(String(200))
    # 直接存储 Markdown 文本，不再依赖文件系统
    content: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    category_id: Mapped[int] = mapped_column(ForeignKey('category.id'))
```

### 6.2 数据迁移脚本核心逻辑

```python
# backend/init_db.py (片段)
with open(md_fs_path, 'r', encoding='utf-8') as md_file:
    md_content = md_file.read()

article = Article(
    slug=article_slug,
    title=article_title,
    content=md_content, # 将文件内容读入内存并存库
    category=category
)
db.session.add(article)
```

## 7. 小结

本次重构成功实现了数据层与表现层的物理分离。

- **前端**：更加纯粹，只负责数据渲染与交互，不再关心数据存储位置。
- **后端**：成为了单一事实来源，为未来开发「后台管理系统」和「在线编辑器」打下了坚实基础。

---

> 没有未来的小风酱 著  
> 2025-12-02
