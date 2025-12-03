# 风风博客开发心得（一）：项目总览与架构解析

> 本文为系列开篇，旨在概述项目当前的全栈架构、核心技术选型及源码的对应关系。内容已与最新的前后端代码完全对齐。

## 1. 项目目标与现状

风风博客是一个功能完备、设计精良的全栈个人站点。项目初始目标是构建一个支持多种内容形态、阅读体验优秀的前端应用，现已演进为一个包含**在线内容管理系统 (CMS)** 的动态网站。

- **前端**: 一个基于 Vue 3 的高度定制化的单页面应用 (SPA)，负责所有用户交互和内容展示。
- **后端**: 一个基于 Flask 的轻量级 API 服务器，负责数据持久化、业务逻辑和安全认证。

## 2. 技术栈与实现要点

### 2.1 前端 (Frontend) - `src/`

- **核心框架**: Vue 3 (Composition API) + TypeScript + Vite。项目入口为 `src/main.ts`。
- **状态管理**: Pinia。全局状态（如主题）存放于 `src/stores/`，业务状态（如文章、认证）存放于 `src/views/stores/` (例如 `articleStore.ts`, `adminStore.ts`)。
- **HTTP 通信**: Axios。所有与后端 API 的交互都通过一个集成了**拦截器**的 Axios 实例 (`src/api/index.ts`)，自动处理 JWT Token 的发送与刷新。
- **路由**: Vue Router 4。路由配置见 `src/router/index.ts`，包含**路由守卫**以实现后台权限控制。

### 2.2 后端 (Backend) - `backend/`

- **核心框架**: Flask。主程序位于 `backend/app.py`，包含了所有 API 路由定义。
- **数据库与ORM**: SQLite + SQLAlchemy (2.0 风格)。所有数据模型（User, Article 等）均在 `app.py` 中定义。
- **安全认证**: Flask-JWT-Extended。提供标准的 JWT 签发、验证与刷新机制，通过 `@jwt_required()` 装饰器保护后台 API。

## 3. 核心功能与代码对应

- **Markdown 渲染**: 前端使用 `markdown-it` 渲染从 API 获取的 Markdown 字符串。渲染逻辑封装在 `src/composables/useArticleContent.ts`，代码高亮由 `highlight.js` 实现 (`useCodeHighlight.ts`)。
- **内容管理系统 (CMS)**:
  - **视图**: 位于 `src/views/admin/`，包含登录页 (`LoginView`)、管理仪表盘 (`DashboardView`) 和核心的编辑器 (`EditorView`)。
  - **所见即所得**: 编辑器通过“编辑/预览”模式切换，预览时复用前台的 `<ContentTypeWriter>` 组件，保证了后台创作与前台阅读的视觉一致性。
- **数据流 (Data Flow)**:
  1.  **用户操作** 触发组件事件。
  2.  **Pinia Store** 调用 `src/api/index.ts` 中的 `api` 实例。
  3.  **Axios** 发送 HTTP 请求到后端 Flask API。
  4.  **Flask** 处理请求，通过 SQLAlchemy 与 SQLite 数据库交互。

## 4. 数据初始化 (Data Seeding)

为了方便新用户快速搭建一个内容丰富的演示站点，项目采用“数据播种”机制：

- **种子数据**: `public/` 目录下存放了所有示例文章的 Markdown 源文件和图片资源。
- **迁移脚本**: `backend/init_db.py` 脚本负责读取这些种子数据，并将其一次性批量写入 SQLite 数据库。
- **数据库文件**: 最终生成的数据库 `blog.db` 位于 `backend/instance/` 目录，并被 `.gitignore` 忽略。

## 5. 开发与启动

项目需同时运行前后端服务。

### 5.1 启动后端

```bash
# 在 backend/ 目录下
pip install -r requirements.txt  # 安装依赖
flask create-admin               # 创建管理员账户
python init_db.py                # (可选) 填充示例数据
python app.py                    # 启动服务
```

### 5.2 启动前端

```bash
# 在项目根目录下
npm install
npm run dev
```

_注：详细的启动指南请参考根目录的 `README.md`。_

## 6. 小结与后续方向

经过七个月的持续开发，项目已经从一个纯前端应用，成功演进为一个包含安全认证和在线内容管理功能的动态网站。

后续文章将深入探讨：

- **CMS 设计**: 如何实现“编辑/预览”无缝切换的用户体验。
- **JWT 认证**: 前后端如何配合实现 Token 的自动刷新与安全校验。

---

> 没有未来的小风酱 著
> 2025-12-03 (已与全栈架构同步)
