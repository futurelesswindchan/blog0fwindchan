# 🍃 风风博客 (Wind Chan's Blog)

![Vue.js](https://img.shields.io/badge/vuejs-%2335495e.svg?style=flat&logo=vuedotjs&logoColor=%234FC08D)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=flat&logo=typescript&logoColor=white)
![Flask](https://img.shields.io/badge/flask-%23000.svg?style=flat&logo=flask&logoColor=white)
![Python](https://img.shields.io/badge/python-3670A0?style=flat&logo=python&logoColor=ffdd54)
![License](https://img.shields.io/badge/license-CC%20BY--NC--SA%204.0-lightgrey)

> 欢迎来到风酱的赛博次元！这里是一个基于 Vue 3 + TypeScript + Flask 打造的高颜值全栈个人博客系统 ✨
>
> A highly customizable, aesthetic full-stack personal blog built with Vue 3, TypeScript & Flask.

<br/>

<table>
  <tr>
    <td><img width="445" alt="preview_light" src=".github/images/blog_preview1.png" /></td>
    <td><img width="445" alt="preview_dark" src=".github/images/blog_preview2.png" /></td>
  </tr>
  <tr>
    <td align="center">☀️ 充满元气的浅色模式</td>
    <td align="center">🌙 静谧优雅的深色模式</td>
  </tr>
</table>

---

## 📖 赛博小屋导览 (项目简介)

这可是一座兼具绝赞美术风格与丝滑交互的个人创作工坊哦！~~风酱你怎么敢好意思这么吹嘘自己的啦OAO！~~\
从 UI 设计到全栈开发，全由风酱一人精心打造。项目采用了前后端分离架构，还自带一个功能完整的“舰桥后台”(CMS)，让你只需在浏览器里点点点，就能轻松创作和管理文章啦！

**🌟 博客の超能力（吹牛时刻awa）：**

- **🔮 赛博玻璃拟态美学**：深度定制 UI，实现类 Windows Aero 的柔和磨砂玻璃质感，有~~迫真~~漂亮光影反射哦！并且支持一键切换亮/暗主题~
- **✨ 所见即所得编辑器**：边写边看，编辑/预览无缝切换，再也不用盲猜渲染效果啦。
- **🛡️ 企业级 JWT 守护结界**：Access Token + Refresh Token 双令牌机制，配合前端 Axios 拦截器，实现登录状态“无痛续杯”！
- **🎁 开箱即用的新手礼包**：内置数据迁移法阵，一键即可将示例文章和图片资源导入，再也不用担心 Clone 下来后不能直接看效果啦！>w<

---

## 🛠️ 技术栈

<details>
<summary><b>✨ 点击展开并看看博客的“核心驱动齿轮”(也就是技术栈列表啦) awa~</b></summary>

### 🎨 前端魔法阵 (Frontend)

| 技术                           | 描述                                           |
| :----------------------------- | :--------------------------------------------- |
| `Vue 3`                        | 核心框架，全面使用超好用的 Composition API owo |
| `TypeScript`                   | 满级类型安全感，将 Bug 扼杀在摇篮里！          |
| `Vite`                         | 极速构建与开发服务器 (快到飞起 🚀)             |
| `Pinia`                        | 全局状态的贴心大管家                           |
| `Vue Router 4`                 | 页面穿梭机与后台权限结界守护                   |
| `Axios`                        | HTTP 快递员，自带 JWT 无感刷新小饼干拦截器     |
| `Sass (SCSS)`                  | 给 CSS 穿上漂亮的小裙子 (预处理)               |
| `markdown-it` + `highlight.js` | 让 Markdown 和代码块闪闪发光的渲染引擎         |

### ⚙️ 后端蒸汽机 (Backend)

| 技术                 | 描述                                       |
| :------------------- | :----------------------------------------- |
| `Python 3.10+`       | 后端驱动核心语言                           |
| `Flask`              | 轻量又强大的 Web 框架                      |
| `SQLite`             | 乖巧轻量的嵌入式数据库                     |
| `SQLAlchemy 2.0`     | ORM 魔法，优雅定义数据模型                 |
| `Flask-JWT-Extended` | 颁发和管理双重身份牌 (Token) 的门卫        |
| `Flask-Limiter`      | 阻挡疯狂点击的防洪大坝 (全局限流)          |
| `Marshmallow`        | 请求数据的安检员与打包员 (序列化)          |
| `python-dotenv`      | 环境变量小夹万                             |
| `Werkzeug ProxyFix`  | 能够看破反向代理，抓住用户真实 IP 的透视镜 |

**同时，后端模块采用超整洁的模块化蓝图结构哦：**

```plain
backend/
├── app.py          # 应用工厂 create_app() + 魔法咒语(CLI命令)注册
├── extensions.py   # db / jwt / limiter 等扩展法器的存放处
├── models.py       # SQLAlchemy 模型图纸
├── schemas.py      # Marshmallow 校验规则
└── routes/
    ├── __init__.py # register_routes() 蓝图集结地
    ├── public.py   # 所有人都能看的公开卷轴 (只读接口)
    ├── auth.py     # 身份验证与 Token 刷新处
    ├── admin.py    # 仅限管理员进入的后台密室
    └── assets.py   # 图片等宝物上传通道
```

</details>

---

## 🚀 启动！本地开发小冒险

> 💡 **风酱小贴士：** 本节是教大家如何在自己的小电脑上，把博客以本地开发模式跑起来哦！\
> 如果你想把博客部署到广阔的公网服务器上，请直接搭乘电梯前往 [教程引流](#-藏书阁进阶修炼秘籍) 区域寻找相应的魔法卷轴~

### 🎒 出发前的行囊准备 (前置依赖)

- `Node.js` v18.0+
- `Python` 3.10+
- `Git`

### Step 1：唤醒后端大主子

```bash
# 克隆项目到本地
git clone https://github.com/futurelesswindchan/blog0fwindchan.git
cd blog0fwindchan/backend

# 打造一个专属的魔法结界（虚拟环境）
python3 -m venv venv

# 激活结界 (Windows 玩家走这里)
.\venv\Scripts\activate
# 激活结界 (Linux / macOS 玩家走这里)
source venv/bin/activate

# 召唤所有需要的法宝（安装依赖）
pip install -r requirements.txt
```

在 `backend/` 目录下新建一个隐秘的 `.env` 文件，写下这几行配置：

```properties
FLASK_DEBUG=True
JWT_SECRET_KEY=<这里填一串至少32字符的随机乱码，可以用下面的咒语生成哦>
CORS_ORIGINS=http://localhost:5173
```

> **🔑 生成安全密钥的咒语：**
>
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

初始化数据库并创建最高权限的魔法师（管理员）账号：

```bash
# 建表 + 写入默认分类
flask db init

# 创建管理员账号（请根据终端提示，乖乖输入用户名和密码哦）
flask admin create
```

（🎁 选做）拆开新手礼包，导入示例文章和数据：

```bash
python init_db.py
```

> ⚠️ **小心哦！ `init_db.py` 是在清空 Article、Category、Friend、Artwork 表后重新导入数据的！**\
> 它只适合第一次搬家时做示例演示使用——如果是已经在线上运行，或存有个人数据的博客，千万别碰它呀 QAQ！

最后，点火启动后端引擎：

```bash
python app.py
# 如果看到 Running on http://127.0.0.1:5000，就说明成功啦！(撒花🎉)
```

### Step 2：点亮前端展示橱窗

请保持后端的终端窗口开着，另外再开一个新的终端窗口：

```bash
cd frontend
npm install
npm run dev
# 到这一步，前端橱窗已经在 http://localhost:5173 亮起啦，快去浏览器里看看吧！
```

---

## 📚 藏书阁：进阶修炼秘籍

想把博客彻底染上自己的色彩？或者想把它挂到公网服务器上让全世界看到？\
没问题！风酱已经在仓库里为你准备好了全套的保姆级教程！

导入示例数据（`python init_db.py`）后，可以在博客的“奇怪杂谈”分类中直接阅读；\
也可以在此仓库的 `frontend/legacy_data/article/topics/` 目录下翻阅原味 Markdown 卷轴哦。

| 魔法卷轴                                                                            | 卷轴内容                                                     |
| :---------------------------------------------------------------------------------- | :----------------------------------------------------------- |
| [个性化你的博客](frontend/legacy_data/article/topics/how-to-customize-blog.md)      | Fork 仓库、换昵称、换头像、换壁纸、调主题色...打造专属小窝！ |
| [部署到云服务器](frontend/legacy_data/article/topics/how-to-deploy-on-vps.md)       | Nginx + Gunicorn 生产部署，附赠超强安全防御结界指南          |
| [日常更新与维护](frontend/legacy_data/article/topics/how-to-update-and-maintain.md) | 代码更新流程、打理博客的常用咒语(CLI)、遇到 Bug 怎么办       |

---

## 📄 冒险者公会条约 (使用许可)

本项目**代码部分**采用 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh) 协议进行许可。\
非常欢迎大家来学习、分享和二次改装，但请一定要**注明出处**，并且**绝对不可以**用于商业赚钱哦！

⚠️ **风酱的严肃提醒：关于美术资产的版权**

仓库里包含的所有美术资产（包括可爱的角色立绘、网站 Logo/Icon 等）都是有版权严格保护的，**不适用**开源协议！

你可以 Clone 下来在自己的电脑上跑着玩、学习和测试。\
但是，**如果你要把博客部署到公网上作为自己的公开站点，请必须、一定、绝对要把这些美术资源替换成你自己的图片哦！** 拜托拜托啦！(双手合十 qwq)

---

> **Copyright © 2026 没有未来的小风酱 (futurelesswindchan)**

Made with ♡ and lots of —⊂ZZZ⊃.
