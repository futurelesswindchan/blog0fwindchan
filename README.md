# 🍃 风风博客 (Wind Chan's Blog)

> 一个基于 Vue 3 + TypeScript + Flask 的高颜值全栈个人博客系统。  
> A highly customizable, aesthetic full-stack personal blog built with Vue 3 & Flask.

## 📖 项目简介

风风博客是一个注重阅读体验和视觉交互的个人站点。项目采用 **Aero 玻璃拟态风格**，支持动态反光、打字机特效以及丝滑的移动端适配。

系统采用 **前后端分离架构**，现已具备完整的 **CMS (内容管理系统)** 功能，让你可以在线创作和发布文章。

- **前端 [Frontend]**: Vue 3 + TypeScript 提供极致交互体验。
- **后端 [Backend]**: Python Flask + SQLite 提供安全、稳定的数据 API。

## ✨ 核心特性

- **🎨 极致视觉**：Aero 玻璃拟态 UI，支持亮/暗主题切换，动态壁纸与反光。
- **✍️ 在线创作**：内置所见即所得的 Markdown 编辑器，支持“编辑/预览”模式无缝切换。
- **🔐 安全认证**：基于 **JWT (JSON Web Token)** 的安全认证体系，保障后台操作安全。
- **📱 全端适配**：响应式布局，桌面端与移动端均有流畅的浏览和管理体验。
- **🔌 快速启动**: 内置数据迁移脚本，可一键填充示例文章，快速搭建一个功能完备的演示站点。

## 🛠 技术栈

**前端 Frontend:**

- **Core**: Vue 3 (Composition API) + TypeScript + Vite
- **State**: Pinia
- **HTTP**: Axios (with Interceptors for JWT)
- **Router**: Vue Router 4
- **Styling**: Sass (SCSS)

**后端 Backend:**

- **Framework**: Python 3.10+ (Flask)
- **Authentication**: Flask-JWT-Extended
- **Database**: SQLite3
- **ORM**: SQLAlchemy (2.0 style)
- **Deploy**: Gunicorn + Nginx (Planned)

## 🚀 快速开始 (Quick Start)

本项目包含前后端两个部分，需分别启动。

### 1. 获取代码

```bash
git clone https://github.com/futurelesswindchan/blog0fwindchan.git
cd blog0fwindchan
```

### 2. 启动后端 (Backend)

确保已安装 Python 3.10 或以上版本。

```bash
# 1. 进入后端目录
cd backend

# 2. (可选) 创建并编辑 .env 文件，修改 JWT_SECRET_KEY
# cp .env.example .env

# 3. 创建并激活虚拟环境
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# 4. 安装依赖
pip install -r requirements.txt
# (或者手动安装: pip install Flask Flask-SQLAlchemy Flask-JWT-Extended python-dotenv)

# 5. 【关键】创建管理员账户，运行这一步以后才能正常登录网站后台修改内容！
# 请务必设置复杂的用户名和密码，以保障安全（如果忘记了的话只能自己去看数据库咧）
flask create-admin

# 6. (可选) 初始化演示数据
# 如果想让网站内容不为空，请运行此脚本填充示例文章
python init_db.py

# 7. 启动 Flask 服务 (默认运行在 http://127.0.0.1:5000)
python app.py
```

### 3. 启动前端 (Frontend)

在另一个终端窗口中：

```bash
# 1. 回到项目根目录
cd ..

# 2. 安装依赖
npm install

# 3. 启动开发服务器 (默认运行在 http://localhost:5173)
npm run dev
```

访问 `http://localhost:5173`。现在你可以通过侧边栏的“写文章”入口登录并开始创作了！

## 📂 目录结构

```
blog0fwindchan/
├── backend/             # [后端] Python Flask 代码
│   ├── app.py           # 主程序、API路由、数据模型
│   ├── init_db.py       # 数据迁移脚本 (Seeds)
│   └── .env             # 环境变量 (JWT密钥等, 不提交到Git)
├── public/              # [资源] 静态图片与种子数据
├── src/                 # [前端] Vue 3 源码
│   ├── api/             # Axios 实例与拦截器
│   ├── stores/          # Pinia (包含 adminStore)
│   └── views/
│       └── admin/       # 后台管理页面 (Login, Editor)
└── vite.config.ts       # Vite 配置 (含反向代理)
```

## 📅 开发路线图 (Roadmap)

- [√] **Phase 1**: 完成纯前端架构与 UI 设计
- [√] **Phase 2**: 后端架构搭建 (Flask + SQLite) 与 API 开发
- [√] **Phase 3**: 前后端联调与数据迁移脚本
- [√] **Phase 4**: 开发后台管理系统 (CMS) 及 JWT 安全认证
- [ ] **Phase 5**: ⚠️ **即将进行**: 服务器部署 (Linux + Nginx + Gunicorn)

## 📄 License

本项目采用 CC BY-NC-SA 4.0 协议进行许可。  
非商业转载请注明出处，禁止商业使用。

Copyright (c) 2025 没有未来的小风酱 (futurelesswindchan)
