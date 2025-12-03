# 风风博客开发心得（一）：项目总览与实现对照

> 本文为系列第一篇，概述项目目标、技术选型与源码对应位置。内容已与仓库源码逐文件校对（例如 `src/main.ts`、`src/App.vue`、`public/article` 目录）。

## 项目目标

风风博客是面向技术分享与轻量创作的个人站点，目标重点为：

- 支持多种内容形态（技术文章、原创故事、插画画廊）；
- 稳定的 Markdown 渲染与代码高亮，保证阅读体验；
- 在桌面与移动端都提供一致且流畅的阅读交互；
- 代码可维护、类型安全，并便于在 CI/CD 中构建与测试。

## 技术栈与实现要点（与代码文件对应）

- **框架与工具**：Vue 3（Composition API）、TypeScript、Vite。对应入口：`src/main.ts`、`src/App.vue`。
- **状态管理**：Pinia（stores 在 `src/views/stores` 与 `src/stores` 下）。
- **路由**：Vue Router 4，路由配置在 `src/router/index.ts`。
- **内容渲染**：项目通过 `markdown-it` 渲染 Markdown，渲染相关逻辑位于 `src/composables/useArticleContent.ts`。
- **代码高亮**：使用 `highlight.js`，封装在 `src/composables/useCodeHighlight.ts`，并在文章渲染流程中调用。
- **组件与样式**：通用组件位于 `src/components/common`，布局相关在 `src/components/layout`（例如 `ReflectionLayer.vue`、`NavPanel.vue` 等）。样式在 `src/styles/` 目录。
- **自定义指令**：例如打字机效果在 `src/directives/typeWriterDirective.ts`。

## 后端与数据迁移

- 后端为 Flask + SQLite（见 `backend/app.py`），使用 SQLAlchemy 管理模型。
- 项目提供数据初始化脚本 `backend/init_db.py`，会读取 `public/` 下的示例数据（Markdown / JSON / 图片）并生成数据库（`backend/instance` 下的 SQLite 文件）。

## 仓库结构（关键片段）

```
public/                     # 静态内容：文章 Markdown、插画与索引 JSON
src/                        # 前端源码（Vue 3 + TS）
	├─ components/            # 通用与布局组件
	├─ composables/           # 组合式函数（useArticleContent, useCodeHighlight 等）
	├─ directives/            # 自定义指令（typeWriterDirective）
	├─ router/                # 路由配置
	├─ styles/                # 全局样式
	└─ views/                 # 页面视图与文章相关子视图
backend/                    # Flask 后端（API + 数据迁移脚本）
```

## 主要页面与代码对应

- **首页（`HomeView`）**：聚合最新文章与导航入口，位于 `src/views/HomeView.vue`。
- **技术文章**：由 `useArticleContent` 读取 `public/article` 的 Markdown，`useCodeHighlight` 给代码块上色，组件 `ContentTypeWriter`（`src/components/common/ContentTypeWriter.vue`）负责排版/动画。
- **原创故事 / 章节**：以 JSON 索引 + Markdown 章节文件组织（`public/article/novels`），按需加载并由 store 管理阅读状态。
- **插画画廊**：资源索引在 `public/artwork/index.json`，画廊组件和 `artworkStore` 负责懒加载与占位显示（`src/components/common/LazyImage.vue`）。
- **设置 / 主题**：`useSettingsStore` 管理主题开关与持久化（`localStorage`）。

## 开发与测试（可在仓库直接运行）

- 安装前端依赖并运行开发服务器：

```powershell
npm install
npm run dev
```

- 常用脚本（见 `package.json`）：`dev`、`build`、`type-check`、`test:unit`（Vitest）、`test:e2e`（Playwright）。
- 启动后端（Python 环境）：

```powershell
cd backend; python -m venv .venv; .\.venv\Scripts\activate; pip install -r requirements.txt; python init_db.py; python app.py
```

（注：仓库内 `README.md` 提供更详细的启动与迁移说明。）

## 小结与后续方向

本文与仓库源码逐文件核对，指出了渲染、组件、存储及后端迁移脚本的对应位置。后续文章将深入：主题/样式实现、Markdown 渲染管线、组件交互与性能优化、以及如何把静态示例数据迁移到 SQLite 并对接 API。

---

没有未来的小风酱 著（已与源码对照）
2025-12-02
