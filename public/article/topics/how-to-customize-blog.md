# 个性化你的博客：打造属于你的赛博小屋

> 目标读者：已经成功在本地或线上部署了博客，并希望把它改成自己专属样子的朋友们~

---

## 零、前言：“我的地盘，我做主！”

太棒了！你的博客已经成功运行起来了！(๑•̀ㅂ•́)...

但现在，它可能还挂着“风风博客”的标题和风酱的壁纸。这怎么行呢！你的赛博小屋，当然要有你自己的风格。

这篇教程就是你的“装修指南”，手把手教你如何修改博客的标题、图标、背景、颜色和链接，把它变成独一无二的个人空间。

---

## 一、修改“门面”：基础信息

这些是访客第一眼就能看到的东西，我们先来搞定它！

### 1. 网站标题（浏览器标签页上那个）

- **找到文件**：项目根目录下的 `index.html`。
- **修改这里**：
  ```html
  <title>风风博客</title>
  ```
  把 `风风博客` 换成你想要的名字，比如 `小明的幻想乡`。

### 2. 网站图标 (Favicon)

那个在浏览器标签页标题左边的小图标，就是 Favicon。

- **找到文件**：`public/favicon.png`。
- **操作**：用一个你自己的、最好是正方形的 `.png` 图片，直接替换掉这个文件。文件名保持 `favicon.png` 就不用改代码啦！

### 3. 主页页头标题和 Logo

- **找到文件**：`src/components/layout/MainLayout.vue`。
- **修改这里**：
  ```vue
  <div class="left-group">
    <img :src="logo" class="logo" />
    <h1>风风博客</h1>
  </div>
  ```
  - 把 `<h1>风风博客</h1>` 里的文字换成你的博客名。
  - 默认的 Logo 图片在 `public/assets/images/logo.webp`，你也可以把它换掉。

### 4. 首页

下面是关于首页（Home）的详细定制指南，包含哪些文件负责显示、如何修改明信片（vcard）、特性卡片（feature cards）、联系方式和如何预览你的修改。

4.1 主要文件

- `src/views/HomeView.vue`：首页的主要布局与内容（明信片、特性卡片、联系方式等）。
- `src/components/layout/MainLayout.vue`：全局头部/Logo/站名，首页头部文字通常在这里或 `HomeView.vue` 中控制。
- `src/styles/theme.css`：主题色等 CSS 变量，影响整体配色（见上文如何修改 `--accent-color`）。
- `public/assets/images/`：放置首页用到的静态图片（背景、卡片封面、二维码等）。

  4.2 修改明信片（vcard）内容

- 在 `src/views/HomeView.vue` 的 `<template>` 部分找到 `.vcard`、`.mobile-vcard` 或 `.tablet-vcard` 的内容，直接修改文本（例如 `vcard-title`、`vcard-contact`、`vcard-desc`）以替换显示文案。
- 在该文件的 `<script setup>` 区段，二维码、卡片背景等通常以变量形式声明，例如：

```ts
// 示例片段，位于 `src/views/HomeView.vue` 的 script 区
const qrCode = '/assets/images/qrcode.svg' // 替换为你的二维码路径
const cardBg1 = '/assets/images/card-bg1.jpg'
// features 数组中也可以放置 bgImage
```

修改这些路径可以让页面使用 `public/assets/images` 下的自定义图片。

4.3 修改特性卡片（Feature Cards）

- `HomeView.vue` 中有一个 `features` 数组，类似：

```ts
const features = [
  {
    icon: 'fa-laptop-code',
    title: '技术手札',
    desc: '网站开发笔记与心得',
    bgImage: '/assets/images/card-bg4.jpg',
    route: '/articles/frontend',
  },
  // ...
]
```

你可以：

- 修改 `title` / `desc` / `route` 来改变展示和跳转；
- 将 `bgImage` 改为你放在 `public/assets/images/` 的图片；
- 若新增卡片，按相同对象格式 push 到数组即可（注意 route 必须是已注册的路由）。

  4.4 修改联系方式（Contacts）

- 在 `HomeView.vue` 的 `contacts` 数组中修改或新增联系方式：

```ts
const contacts = [
  {
    name: 'GitHub',
    icon: 'fab fa-github',
    link: 'https://github.com/你的账号',
    color: 'rgba(36,41,46,0.2)',
  },
  // ...
]
```

修改 `link`、`name` 即可，同时可以调整 `color` 来改变卡片背景色。

---

## 二、定制你的“窗外风景”：背景与主题色

### 1. 更换背景壁纸

博客的壁纸是不是很酷？你也可以换成自己喜欢的风景！

- **找到文件夹**：`public/assets/images/`。
- **操作**：
  - `wallpaper.webp`：这是**亮色主题**下的背景图。
  - `dark-theme-wallpaper.webp`：这是**暗色主题**下的背景图。
- 准备两张你喜欢的图片，替换掉这两个文件就行啦！建议使用 `.webp` 格式，因为它体积小、加载快。

### 2. 修改主题色（进阶玩法 🎨）

想不想要一个“猛男粉”或者“原谅绿”主题的博客？没问题！

- **找到文件**：`src/styles/theme.css`。
- **修改核心变量**：

  ```css
  :root {
    /* 主题色，影响各种高亮和按钮！改这个就够了！*/
    --accent-color: #0077ff;

    /* 这是玻璃反光的颜色，可以试着改成你喜欢的色系~ */
    --reflection-1: rgba(255, 120, 120, 0.17); /* 红 */
    --reflection-2: rgba(255, 180, 120, 0.2); /* 橙 */
    /* ...等等，下面还有好几个 */
  }
  ```

- 只需要修改 `--accent-color` 的色值，就能改变整个网站的主色调。是不是超简单！

---

## 三、装修你的“朋友圈”和“画廊”

> **友情提示**：目前这两个模块的后台管理功能还在开发中。所以暂时需要我们手动修改文件来更新内容哦！

### 1. 修改友情链接

- **找到文件**：`public/friends/index.json`。
- **编辑它**：打开后你会看到这样的结构：
  ```json
  {
    "friends": [
      {
        "id": "gugu",
        "name": "咕咕",
        "desc": "一只鸽子",
        "url": "https://gugu.org/",
        "avatar": "/friends/gugu.webp",
        "tags": ["技术大佬"]
      }
    ]
  }
  ```
- 照着这个格式，添加或修改成你朋友的信息就行啦。
- **头像图片**：记得把对应的头像图片文件（比如 `gugu.webp`）放到 `public/friends/` 文件夹下。

### 2. 更新画廊作品

- **找到文件**：`public/artwork/index.json`。
- **编辑它**：结构和友链类似，包含 `title`, `thumbnail` (缩略图路径), `fullsize` (原图路径) 等字段。
- **图片文件**：把你的画作（缩略图和原图）都放到 `public/artwork/` 文件夹下。

---

## 四、最后一步：让修改生效！

修改完上面的文件后，如果你是在本地开发：

- 前端会自动刷新，你马上就能看到效果！

如果你想同步更新到**线上服务器**：

- 你需要按照另一篇教程——《日常维护：如何更新与照顾你线上的博客》——的步骤，重新构建并部署你的网站。

祝你“装修”愉快！( ´ ▽ ` )ﾉ

> 没有未来的小风酱 敬上
