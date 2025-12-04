# 🍃 风风博客 (Wind Chan's Blog)

> 一个基于 Vue 3 + TypeScript + Flask 打造的高颜值全栈个人博客系统 ✨
>
> A highly customizable, aesthetic full-stack personal blog built with Vue 3, TypeScript & Flask.

![示例图片](https://github.com/futurelesswindchan/blog0fwindchan/blob/main/.github/images/blog_preview.pngg)

---

## 📖 项目简介 (Introduction)

你好——！👋 欢迎来到「风风博客」的世界！

这不仅仅是一个简单的个人博客。我希望把它打造成一个兼具 **美术风格** 与 **流畅交互** 的个人内容创作平台。
整个项目从 UI 设计到全栈开发，都是我亲手一个像素、一行代码构建起来的。 ヽ( ^ω^ ゞ )

项目采用了现代化的 **前后端分离** 架构，并且已经实现了一个功能完整的 **在线后台管理系统 (CMS)**，让你可以在浏览器里优雅地创作和管理你的所有文章！

- **前端 [Frontend]**: 基于 Vue 3 全家桶，负责所有赏心悦目的视觉效果与用户交互。
- **后端 [Backend]**: 基于 Python Flask，提供安全、稳定的数据 API 服务。

## 💖 核心亮点 (Core Features)

- **🎨 赛博玻璃拟态美学 (Aero Glassmorphism)**
  项目 UI 深度定制，实现了类似 Windows Aero 的磨砂玻璃质感~~ 也许吧OAO... ~~ 。
  支持动态光影反射 (`ReflectionLayer`)、亮/暗主题一键切换，带来沉浸式的视觉享受！ヾ(_´∀ ˋ_)ﾉ

- **✍️ 所见即所得的创作体验 (In-place Editing)**
  后台编辑器摒弃了传统的左右分栏预览。
  你可以在一个界面里无缝切换“编辑模式”与“预览模式”，在提交前就能看到文章最终的渲染效果，就像在直接修改网页一样！

- **🔐 企业级 JWT 认证**
  后台所有敏感操作均由 `Flask-JWT-Extended` 保护。
  通过 Access Token + Refresh Token 机制，以及 Axios 拦截器实现的**无感刷新**，在保证安全的同时提供了流畅的登录体验。

- **🔌 开箱即用的演示环境**
  别担心 `clone` 下来是个空架子！Σ(°Д°;
  项目内置了数**据迁移脚本** (`init_db.py`)，可以一键将 `public/` 目录下的示例文章和资源导入数据库，让你瞬间拥有一个内容完整的本地站点。

---

## 🚀 风风博客，启动！新手村大冒险 (Getting Started)

> **想立刻体验？或者自己动手部署？**
>
> 我们把最详细的教程、开发心得都写成了博客里的**预制文章**！
> 你只需要在本地把博客跑起来，再运行刚刚说的**数据迁移脚本**，就能在文章列表里找到它们啦！这样学习起来是不是更有趣？(o゜▽゜)o☆
>
> 下面是让你跑起项目的“快速通道”~

### 1. 本地部署 vs 线上部署？有什么不同？

- **本地部署 (你现在要做的！)**：在你的电脑上运行。优点是简单、快速，可以随心所欲地修改代码和测试其效果，是开发和体验的最佳方式。
- **线上部署 (下一步的目标！)**：把项目放到有公网 IP 的服务器上。优点是全世界都能访问你的网站，但流程更复杂，一般需要配置 Nginx、Gunicorn 和域名等。

**我们先从本地部署开始吧！**

### 2. 在你的电脑上启动博客 (本地部署指南)

#### 准备工作 (Prerequisites)

- `Node.js` (v16.0 或更高版本)
- `Python` (v3.10 或更高版本)
- `Git`

#### Step 1: 后端先行！(Backend First!)

我们需要先让数据“心脏”跳动起来~ (`・ω・´)

```bash
# 1. 把项目抱回家
git clone https://github.com/futurelesswindchan/blog0fwindchan.git
cd blog0fwindchan

# 2. 进入后端的秘密基地
cd backend

# 3. 创建一个干净的“小房间”（Python虚拟环境）
python -m venv venv

# 4. 激活这个小房间
#    Windows:
.\venv\Scripts\activate
#    Linux/Mac:
source venv/bin/activate

# 5. 安装所有魔法咒语（依赖）
pip install -r requirements.txt

# 6. 【超重要】创建你的专属管理员账号！
#    按照提示输入用户名和密码
flask create-admin

# 7. 【推荐】一键让博客内容满满当当！
#    这个脚本会把所有教程和示例文章都导入数据库
python init_db.py

# 8. 启动后端服务！
python app.py
```

当你看到终端显示 `Running on http://127.0.0.1:5000` 时，说明后端已经成功启动啦！🎉

#### Step 2: 前端点火！(Frontend Power On!)

只有心脏当然是...不行的OAO！**请打开一个新的终端窗口**！

```bash
# 1. 确保你在项目【根目录】下（不是 backend/，是 blog0fwindchan/）
#    (如果你的上一个终端还在 backend/ 目录，需要先 `cd ..`)

# 2. 安装前端依赖
npm install

# 3. 启动！
npm run dev
```

前端开发服务器会启动在 `http://localhost:5173`。它会自动和 `5000` 端口的后端“秘密通信”，你什么都不用担心~

### 3. 开始你的教程之旅！

现在，在浏览器里打开 `http://localhost:5173`。

- 如果你想学习网站开发经验，去 **“技术手记”** 分类，你会找到关于 **此博客开发** 的详细心得文章。
- 如果你只想开箱即用，把项目修改为属于自己的博客并部署到公网，去 **“奇思妙想”** 分类，你会找到你想要的！。

---

## 🛠️ 技术细节与未来 (For Geeks)

### 技术栈全家桶

<details>
<summary>点击展开  nerdy 的技术细节 (´・ω・`)</summary>

#### Frontend

| 技术         | 描述                               |
| :----------- | :--------------------------------- |
| `Vue 3`      | 核心框架，全面拥抱 Composition API |
| `TypeScript` | 全程类型支持，代码更健壮!(ﾟд⊙)     |
| `Vite`       | 闪电般⚡的构建与开发体验           |
| `Pinia`      | 新一代状态管理，轻量且符合直觉     |

- **HTTP**: `Axios` (配置了拦截器，用于自动化 JWT 处理)
- **Router**: `Vue Router 4` (包含路由守卫，实现后台权限控制)
- **Styling**: `Sass (SCSS)`
- **UI/UX**: `FontAwesome`, `markdown-it` + `highlight.js`

#### Backend

| 技术                 | 描述                                        |
| :------------------- | :------------------------------------------ |
| `Python 3.10+`       | 后端开发语言                                |
| `Flask`              | 轻量级 Web 框架，灵活易扩展                 |
| `SQLite`             | 无需配置的嵌入式数据库，方便又快捷(/´∀`)~♥ |
| `SQLAlchemy`         | ORM 库，使用 2.0 风格进行模型定义           |
| `Flask-JWT-Extended` | 提供标准的 JWT 认证与 Token 管理            |
| `python-dotenv`      | 安全地管理环境变量（如密钥）                |

</details>

### 未来旅程 (Roadmap)

- [√] **Phase 1**: 纯前端架构与 UI 设计
- [√] **Phase 2**: 后端架构搭建 (Flask + SQLite)
- [√] **Phase 3**: 前后端联调与数据迁移脚本
- [√] **Phase 4**: 开发 CMS 及 JWT 安全认证
- [🤔] **未来构想**:
  - [ ] 画廊与友链的在线管理功能
  - [ ] 文章评论系统
  - [ ] ... 更多好玩的！

## 📄 使用许可 (License)

本项目采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh) 协议进行许可。
简单来说：欢迎学习、分享和修改，但请**注明出处**，并且**不要用于商业用途**哦 awa。

---

> **Copyright © 2025 没有未来的小风酱 (futurelesswindchan)**
>
> Made with ♡ and lots of —⊂ZZZ⊃.
