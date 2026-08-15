# 1. 个性化你的博客：打造属于你的赛博小屋

> **目标读者**：想把这个博客改造成自己专属站点的开发者。
>
> **前置要求**：已在本地成功运行博客（参见 README 的本地开发启动部分）。

---

## 零、第一步：Fork 这个仓库

直接 Clone 原始仓库是**错误的起点**。你需要先将项目 Fork 到自己的 GitHub 账号下，然后基于自己的 Fork 进行修改和部署。这样，你的修改与原仓库互不干扰，也方便后续将代码推送到自己的服务器。

**操作步骤：**

1. 打开 [原始仓库页面](https://github.com/futurelesswindchan/blog0fwindchan)，点击右上角的 **Fork** 按钮。
2. 选择你自己的 GitHub 账号作为目标，点击 **Create fork**。
3. Fork 完成后，Clone **你自己的 Fork 仓库**（注意 URL 中是你的用户名）：

```bash
git clone https://github.com/<你的GitHub用户名>/<你的Fork仓库名>.git
cd <项目文件夹名>
```

4. 按照 README 的本地开发启动步骤，在本地把博客跑起来。

现在你拥有了一份完全属于自己的代码库，可以放心地进行任何修改了。

---

## 一、定位代码的好帮手：Vue DevTools

在进行任何修改之前，先认识一个重要工具。

用 `npm run dev` 启动前端后，浏览器页面右下角（或底部）会出现一个 Vue 的小图标——这是 **Vue DevTools**。点击它，可以进入组件树视图，直接在页面上点选任意 UI 元素，工具会自动定位到对应的 `.vue` 文件并在 VSCode 中打开。

如果你不确定某个文字或样式对应哪个文件，用这个工具点一下比翻目录快得多。

---

## 二、核心个性化：站点配置文件

**绝大多数个性化内容都集中在一个文件里：**

```
frontend/src/site.config.ts
```

打开这个文件，你会看到以下几个配置块，逐一修改即可。

### 2.1 站点标题

```ts
export const siteConfig = {
  title: '风风博客',  // 改成你的博客名
}
```

### 2.2 首页展示信息

```ts
export const homeInfo = {
  pageTitle: 'Blog Of Windchan',          // 首页大标题
  nickname: '没有未来的小风酱',            // 你的昵称
  statusText: '正在摸鱼中awa...',          // 状态栏文字
  sloganText: '唔...这都被你发现啦？',      // 打字机动效文字
  sloganSub1: '欢迎来到风风的赛博小屋...',  // 副标题第一行
  sloganSub2: '⬆️联系方式⬆️ 欢迎交流',     // 副标题第二行
}
```

### 2.3 社交链接

```ts
export const socialLinks: SocialLink[] = [
  {
    name: 'GitHub',
    icon: 'fab fa-github',
    link: 'https://github.com/<你的用户名>',  // 换成你的链接
    color: '#24292e',
  },
  // Bilibili 和 Email 同理
]
```

图标使用 [FontAwesome](https://fontawesome.com/icons) 的类名，可以在官网搜索替换。

### 2.4 首页传送门卡片

```ts
export const portalItems: PortalItem[] = [
  {
    icon: 'fa-laptop-code',
    title: '技术手札',           // 卡片标题
    desc: '代码与Bug的爱恨情仇',  // 卡片描述
    route: '/articles/frontend', // 跳转路径，通常不需要改
  },
  // 其他卡片同理
]
```

### 2.5 文章分类名称与描述

```ts
export const ARTICLE_CATEGORIES: ArticleCategory[] = [
  {
    id: 'frontend',
    title: '技术手札',
    desc: '这里是咱的开发笔记与心得...',
    // ...
  },
  // 其他分类同理
]
```

> **注意**：`id` 和 `routeName` 字段与数据库分类的 `slug` 对应，修改时需同步更新数据库中的分类数据，否则文章列表会读不到内容。如果只是改显示文字，只需修改 `title` 和 `desc`。

---

## 三、更换头像、壁纸与 Favicon

这些资源文件放在 `frontend/public/assets/images/` 目录下，直接替换对应文件即可，**文件名保持不变**：

| 文件名 | 用途 |
| :--- | :--- |
| `logo.webp` | 首页头像 + 导航栏 Logo |
| `wallpaper.webp` | 亮色模式背景壁纸 |
| `dark-theme-wallpaper.webp` | 暗色模式背景壁纸 |
| `favicon.png`（位于 `public/`） | 浏览器标签页图标 |

推荐使用 `.webp` 格式的壁纸，体积小、加载快。壁纸建议分辨率不低于 1920×1080。

> **版权提示**：仓库中预置的两张壁纸未包含在版本控制中，你需要自行准备。将图片以上述文件名放入对应目录即可。

---

## 四、修改主题色

主题色控制全站的高亮、按钮、光效等视觉元素，只需修改一个文件：

```
frontend/src/styles/theme/theme.css
```

找到文件顶部 `:root` 块中的以下变量：

```css
/* 💙 核心主题色 */
--accent-color: #0077ff;          /* 亮色模式主题色 */
--accent-color-rgb: 0, 119, 255;  /* 对应的 RGB 值，保持与上方一致 */
--dark-accent-color: #1a85ff;     /* 暗色模式主题色 */
--dark-accent-color-rgb: 26, 133, 255;
```

修改这四个变量即可全局替换主题色。`-rgb` 变量用于其他地方的半透明写法（如 `rgba(var(--accent-color-rgb), 0.5)`），需要与十六进制值保持一致。

---

## 五、修改导航栏与页面标题

### 导航菜单

导航项也在 `site.config.ts` 中，找到 `navItems` 数组，修改 `label` 字段即可更改显示文字：

```ts
export const navItems: NavItem[] = [
  { path: '/home', label: '这是首页', ... },
  { path: '/articles', label: '文章导航', ... },
  // ...
]
```

### 页面打字机标题

切换页面时，浏览器标签页标题和顶部打字机文字会随之变化。这些文字在路由配置中：

```
frontend/src/router/index.ts
```

找到 `routes` 数组，修改每个路由的 `meta.title` 字段：

```ts
{ path: 'home', meta: { title: '欢迎回家...' } }
{ path: 'articles', meta: { title: '这里是全部的文章哦' } }
```

---

## 六、保存修改并推送到你的仓库

本地修改完成后，将代码推送到你的 Fork 仓库：

```bash
git add .
git commit -m "Customize my blog"
git push origin main
```

推送成功后，代码已保存到你的 GitHub 仓库，可以进行生产部署了。

**下一步：[部署到云服务器](./how-to-deploy-on-vps.md)**

---

> 没有未来的小风酱 敬上
