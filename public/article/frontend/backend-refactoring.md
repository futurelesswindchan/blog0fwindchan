# 风风博客开发心得（九）：后端重构与数据迁移

> 本文记录了项目从纯前端静态架构（JSON驱动）向前后端分离架构（Flask + SQLite）迁移的完整过程。
> **相关代码**：`backend/app.py`、`backend/init_db.py`、`src/stores/articleStore.ts`、`vite.config.ts`。

## 1. 架构演进与技术选型

为了解决纯静态博客在内容管理上的局限性，项目引入了 Python 后端，实现了真正的前后端分离。
技术栈选择了轻量级且生态成熟的组合：

- **Web 框架**: Flask — 极简、灵活，适合个人项目快速迭代。
- **数据库**: SQLite — 无需配置的嵌入式数据库，单文件存储，备份极其方便。
- **ORM**: Flask-SQLAlchemy (v3.x) — 采用 SQLAlchemy 2.0 的现代风格 (`Mapped`, `mapped_column`) 进行强类型声明。

## 2. 数据库模型设计 (Schema Design)

在 `backend/app.py` 中，我们设计了五张核心表（新增了 `User` 表），用于替代原有的 JSON 数据结构，并加入了关系约束。

### 核心模型约定

- **User (用户表)**: 用于存储管理员的用户名和**哈希后**的密码，是JWT认证的基础。
- **Article (文章表)**: **关键决策**是直接在表中增加 `content` 字段存储 Markdown 源码，不再依赖外部 `.md` 文件。
- **Friend/Artwork**: 利用 SQLite 对 JSON 的支持，将 `tags` 等数组字段直接存为 JSON 类型。

## 3. API 设计策略：适配器模式

为了最小化前端重构成本，后端的**只读（GET） API** 的设计遵循了“向下兼容”的原则。
例如 `GET /api/articles/index` 接口，并没有简单返回数据库行，而是由后端在内存中重组数据，输出与原 `index.json` 完全一致的嵌套结构：

```json
{
  "frontend": [ { "id": "...", "title": "..." }, ... ],
  "topics": [ ... ]
}
```

这种策略使得前端展示页面几乎无需修改即可接入新后端。

## 4. 数据迁移自动化 (Data Seeding)

我们编写了 `backend/init_db.py` 脚本实现自动化数据迁移（或称为“数据播种”），它负责：

1.  **清洗**: 执行前清空现有表，防止数据重复。
2.  **映射**: 建立 `JSON Key` -> `Category Name` 的映射关系。
3.  **读取与入库**: 遍历 `public/` 下的 JSON 和 Markdown 文件，将其内容批量写入数据库。

这保证了任何开发者在 `clone` 项目后，都能通过一条命令快速生成一个内容完整的本地演示环境。

## 5. 前端 Store 的重构与代理

### Store 层改造

前端彻底移除了所有读取静态文件的逻辑。以 `src/stores/articleStore.ts` 为例，`fetchArticleIndex` 和 `fetchArticle` 被改造为请求后端 API。同时，新增 `src/stores/adminStore.ts` 用于管理认证状态。

### 解决 CORS/CSP 问题

开发环境下，利用 Vite 的反向代理解决跨域与安全策略限制。在 `vite.config.ts` 中配置代理，将 `/api` 请求转发给本地 Flask 服务。这既规避了浏览器的安全限制，又模拟了生产环境 Nginx 的行为。

## 6. 典型代码片段

### 6.1 SQLAlchemy 2.0 模型定义

```python
# backend/app.py
class Article(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    title: Mapped[str] = mapped_column(String(200))
    # 直接存储 Markdown 文本
    content: Mapped[Optional[str]] = mapped_column(Text)
    category_id: Mapped[int] = mapped_column(ForeignKey('category.id'))
```

## 7. 小结

本次重构成功实现了数据层与表现层的物理分离。

- **前端**: 更加纯粹，只负责数据渲染与交互。
- **后端**: 成为了单一事实来源 (Single Source of Truth)，为后续开发 CMS 和 JWT 认证打下了坚实基础。

---

> 没有未来的小风酱 著
> 2025-12-03 (已与全栈架构同步)
