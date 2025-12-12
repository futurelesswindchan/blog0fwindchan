# 风风博客开发心得（七）：后端重构与全栈安全

> 本文是系列的终章。我们将视线从前端移开，深入后端世界，记录博客如何从纯静态架构进化为基于 Flask + SQLite 的全栈应用，并实现基于 JWT 的安全认证体系。  
> **相关代码**：`backend/app.py`、`backend/init_db.py`、`src/api/index.ts`。

## 1. 架构演进：为什么要上后端？

在项目初期，我们使用 JSON 文件驱动内容。虽然简单，但痛点也很明显：

1.  **修改麻烦**：改个错别字都要重新部署。
2.  **功能受限**：无法实现在线编辑等功能。
3.  **安全隐患**：没有鉴权机制，后台管理无从谈起。

因此，我们引入了 Python 后端，实现了真正的前后端分离。

- **Web 框架**: Flask — 极简、灵活，适合个人项目。
- **数据库**: SQLite — 单文件存储，无需配置，备份只需复制文件。
- **ORM**: Flask-SQLAlchemy (v3.x) — 使用 SQLAlchemy 2.0 的现代风格。

## 2. 数据库模型设计

在 `backend/app.py` 中，我们定义了核心数据模型。

### 2.1 核心模型 (SQLAlchemy 2.0 风格)

最关键的决策是：**直接将 Markdown 源码存入数据库**。

```python
class Article(db.Model):
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True)
    title: Mapped[str] = mapped_column(String(200))
    category_id: Mapped[int] = mapped_column(ForeignKey('category.id'))
    date: Mapped[str] = mapped_column(String(20))
    # ✨ 核心：Markdown 源码直接入库
    content: Mapped[Optional[str]] = mapped_column(Text)
```

此外，我们新增了 `User` 表用于存储管理员信息（密码经过哈希处理），以及 `Friend` 和 `Artwork` 表。对于 `tags` 这种数组字段，利用 SQLite 对 JSON 的支持直接存储。

### 2.2 数据迁移 (init_db.py)

为了平滑过渡，我们编写了 `backend/init_db.py` 脚本。

它会自动读取旧版 `public/` 目录下的 JSON 和 `.md` 文件，清洗后批量写入 SQLite 数据库。这保证了任何开发者 clone 项目后，运行脚本即可获得一个填充好数据的环境。

## 3. 安全基石：JWT 双 Token 认证

为了保护后台接口（如文章增删改），我们引入了 `Flask-JWT-Extended`。

### 3.1 后端实现

我们采用了 **Access Token (短效)** + **Refresh Token (长效)** 的双 Token 机制：

1.  **登录**: 验证密码哈希，签发双 Token。
2.  **鉴权**: 敏感接口加上 `@jwt_required()` 装饰器。
3.  **刷新**: 当 Access Token 过期时，使用 Refresh Token 换取新的 Access Token。

```python
# backend/app.py 登录接口示例
@app.route('/api/admin/login', methods=['POST'])
def login():
    username = request.json.get('username')
    password = request.json.get('password')
    user = db.session.execute(db.select(User).filter_by(username=username)).scalar_one_or_none()

    # 验证哈希密码
    if user and check_password_hash(user.password_hash, password):
        access_token = create_access_token(identity=username)
        refresh_token = create_refresh_token(identity=username)
        return jsonify(access_token=access_token, refresh_token=refresh_token)

    return jsonify({"msg": "Bad username or password"}), 401
```

### 3.2 前端拦截器 (src/api/index.ts)

前端通过 Axios 拦截器实现了**无感刷新**。

当请求返回 `401 Unauthorized` 时，拦截器会：

1.  暂停当前请求。
2.  取出 `refresh_token` 请求 `/api/admin/refresh`。
3.  获取新 Token 并更新 `localStorage`。
4.  修改原请求的 Header 并重发。
5.  如果刷新也失败，则强制登出。

```ts
// src/api/index.ts 响应拦截器简化版
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    // 如果是 401 且不是重试过的请求
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = localStorage.getItem('refresh_token')
        // 调用刷新接口
        const { data } = await axios.post(
          '/api/admin/refresh',
          {},
          {
            headers: { Authorization: `Bearer ${refreshToken}` },
          },
        )
        // 更新 Token 并重试
        localStorage.setItem('access_token', data.access_token)
        originalRequest.headers.Authorization = `Bearer ${data.access_token}`
        return api(originalRequest)
      } catch (refreshError) {
        // 刷新失败，跳转登录
        router.push({ name: 'AdminLogin' })
      }
    }
    return Promise.reject(error)
  },
)
```

## 4. 开发与部署配置

### 4.1 开发环境代理 (Vite Proxy)

为了解决开发时的跨域问题，我们在 `vite.config.ts` 中配置了反向代理：

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:5000', // 转发给 Flask
      changeOrigin: true,
    },
    '/uploads': {
      target: 'http://127.0.0.1:5000', // 转发图片请求
      changeOrigin: true,
    }
  }
}
```

### 4.2 生产环境

在生产环境（如 Nginx），我们将前端构建出的静态文件 (`dist/`) 作为根目录服务，同时将 `/api` 和 `/uploads` 路径反向代理到后台的 Gunicorn/uWSGI 服务，实现动静分离。

## 5. 全剧终

至此，风风博客的开发故事就讲完了。

从第一篇的架构设计，到中间的 UI 实现、路由管理、Markdown 渲染，再到最后的后台系统与全栈重构。我们见证了一个简单的静态页面如何一步步进化为一个功能完备、设计优雅的全栈博客系统。

这个项目不仅是一个记录生活的地方，更是我技术成长的试验田。希望这一系列文章能给同样热爱折腾博客的你带来一点点灵感。

感谢阅读！

---

> 没有未来的小风酱 著  
> 2025-12-12重写 （全系列完结，感谢陪伴）
