# Vol.0 起源：为什么 2025 年了还在手撸博客？

> **摘要**：在这个博客框架满天飞的时代，小风酱却决定重复造轮子。本文将浏览这个全栈项目的架构设计，并解释为什么作为一个懒癌的作者，会选择 TypeScript 这条弯路。

---

## 1. 动机...已经不知道动机是什么了！

老实说，社区上成熟的博客系统多如牛毛，`Wordpress`、`Hexo`、`Halo`……随便拎一个出来都能打。

但作为一个爱折腾的爱好者，总觉得别人的轮子虽然圆，但不够顺手（其实就是想自己瞎搞一搞）。

于是，这个项目诞生了。起初它只是一个想~~在群友面前装逼awa~~把 CSS 写出花来的纯前端页面，后来为了能在网页上直接写文章，又硬着头皮写了后端。

目标很明确：

1.  **颜值第一**：必须要有毛玻璃、反光等精致的设计。
2.  **交互有趣**：点击要有反馈，动画要可爱。
3.  **技术硬核**：底层必须是正经的全栈架构。

---

## 2. 技术选型怎么舒服怎么来

作为一个全栈~~干啥啥不行、摸鱼第一名~~的开发者，小风酱在选型时的原则只有两个：**开发要爽**，**维护要省**。

### 🎨 前端：Vue 3 + Vite + TypeScript

为什么选 Vue 3？对小风酱来说，Composition API 写起来和吃薯片一样爽（对比 React 的 Hooks 依赖数组地狱）。

**但为什么要上 TypeScript？**

因为......**编写JS一时爽，维护重构火葬场。**

JavaScript 就像是在裸奔的疯狂原始人，没有人知道传进来的 `user` 到底是个什么玩意：是一个函数，或者干脆是个字符串？当写下 `user.name` 的时候，内心必然是忐忑的；而当用 TypeScript 时，VS Code 会温柔地说：“放心，`user` 一定有 `name` 属性，而且它是个 string。”

看看 `tsconfig.json`，这才是安全感的来源！

```json
// frontend/tsconfig.json
{
  "compilerOptions": {
    "strict": true, // 开启严格模式，拒绝 any 战士
    "forceConsistentCasingInFileNames": true, // 专治文件名大小写不敏感
    "types": ["vite/client", "node"] // 类型提示拉满
  }
}
```

在 `package.json` 里，还特意加了类型检查的钩子：

```json
"scripts": {
  "build": "run-p type-check \"build-only {@}\" --",
  "type-check": "vue-tsc --build" // 编译前先过一遍类型检查，报错就不许上线！
}
```

这不仅是为了装逼，更是为了在半年后回头看代码时，不会指着屏幕骂：“这坨 `data` 到底是个啥？！”

### 🐍 后端采用了Flask + SQLAlchemy！

为什么不用 Java/Spring Boot？太重了，启动一次够喝杯冰红茶-3-。
为什么不用 Node/Express？因为没学！OAO。
为什么不用 Go？呃...才不是还没学会的啦owO。

**Python + Flask** 对小风酱来说是完美的平衡。启动快，代码少，装饰器路由写起来极其优雅。  
（因为小风酱只会这个！）

看看 `backend/requirements.txt`，东西不多，但个个都是宝：

```text
Flask
Flask-Cors          # 解决跨域烦恼
Flask-SQLAlchemy    # ORM，不写原生 SQL 是最后的倔强
Flask-JWT-Extended  # 登录鉴权全靠它
python-dotenv       # 环境变量管理
```

### 💾 数据库是...SQLite？！

“什么？2025 年了还用文件数据库？”

是的。对于一个个人博客来说，**SQLite 就是神**。

1.  **无需配置**：不需要装 MySQL 服务，不需要管端口，不需要创建用户。
2.  **备份方便**：直接复制 `blog.db` 文件，备份完成。
3.  **性能足够**：除非博客日活过万（做梦），否则 SQLite 的性能完全溢出。

---

## 3. 于是来到了架构总览(\*^▽^\*)

项目结构采用了标准的前后端分离模式，但为了方便管理（其实是小风酱懒得开两个仓库），并把它们放在了一起：

```text
Blog0fwindchan/
├── frontend/           # 前端领地 (Vue 3)
│   ├── src/
│   │   ├── api/        # 统一管理 Axios 请求
│   │   ├── components/ # 组件库 (Admin, Common...)
│   │   ├── views/      # 页面视图
│   │   ├── stores/     # Pinia 状态仓库
│   │   └── styles/     # CSS 魔法发源地
│   ├── vite.config.ts  # 构建配置
│   └── package.json
│
├── backend/            # 后端领地 (Flask)
│   ├── app.py          # 启动入口 & 模型定义
│   ├── init_db.py      # 数据迁移脚本 (从 JSON 到 DB)
│   ├── instance/       # 数据库文件 blog.db 藏在这里
│   └── static/         # 图片资源仓库
│
└── .github/            # 存放一些预览图
```

### 🔗 跨域与代理，Vite 的魔法！

开发时，前端跑在 `localhost:5173`，后端跑在 `localhost:5000`。为了让前端能顺畅地呼叫后端，于是在 `vite.config.ts` 里做了一点小小的配置：

```typescript
// frontend/vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:5000', // 偷偷转发给 Flask
      changeOrigin: true,
    },
    '/static': {
      target: 'http://127.0.0.1:5000', // 图片资源也转发
      changeOrigin: true,
    }
  }
}
```

这样，在前端代码里只需要写 `/api/articles`，Vite 就会自动把请求护送到后端，既解决了跨域问题，又让代码看起来很清爽。

---

## 4. 数据迁移之时——

在某次重构之前，博客其实是一个纯静态网站，文章和数据都存在某个目录下的 JSON 文件里。

为了迁移到数据库，小风酱编写了一个 `backend/init_db.py` 脚本。它做的事情非常简单粗暴：

1.  **读取 JSON**：把以前手写的 `index.json` 读进来。
2.  **清洗路径**：把以前乱七八糟的图片路径统一改成 `/static/...`。
3.  **写入 SQLite**：利用 SQLAlchemy 的 ORM 批量插入数据。

```python
# backend/init_db.py 片段
def migrate_articles():
    # ...读取 JSON ...
    for item in articles_list:
        article = Article(
            title=item.get("title"),
            content=md_content, # 甚至直接读取了 Markdown 文件内容存入 DB
            # ...
        )
        db.session.add(article)
    db.session.commit()
```

这个脚本是对过去手写 JSON 时代的告别，也是风风博客迈向自动化 CMS 时代的第一步~（—v—）

---

## 下集预告

架构搭好了，接下来就是最激动人心的环节——**搞装修**！

下一篇 **Vol.1 颜值即正义**，将带各位深入 CSS 的微观世界，看看是如何用代码搓出 **Aero 玻璃质感**、**动态流光背景** 以及那个让无数人（其实就小风酱一个qwq）着迷的 **反光图层**。

---

> 没有未来的小风酱 著
