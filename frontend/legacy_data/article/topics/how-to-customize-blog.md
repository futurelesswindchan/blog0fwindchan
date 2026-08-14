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

## 一、修改"门面"：全局基础信息

这些是访客无论在哪个页面都能看到的东西。

### 1. 网站标题与 Logo

- **找到文件**：`src/components/layout/MainLayout.vue`
- **修改站名**：
  在 `<template>` 区域（大约第 26 行）：
  ```html
  <div class="left-group">
    <img :src="logo" class="logo" />
    <h1>风风博客</h1>
    <!-- 把这里改成你的博客名字 -->
  </div>
  ```
- **修改 Logo**：
  在 `<script setup>` 区域（大约第 150 行）：
  ```ts
  const logo = '/favicon.png' // 默认使用 favicon 作为 logo
  ```
  如果想使用其他图片，将图片放到 `public/assets/images/` 下，修改此处路径即可。

### 2. 浏览器标签页图标（Favicon）

- **找到文件**：`public/favicon.png`
- **操作**：准备一张正方形图片（推荐 PNG 格式），重命名为 `favicon.png`，直接替换该文件。

---

## 二、定制首页：你的个人名片

首页对应文件 `src/views/HomeView.vue`。

### 1. 头像与二维码

找到 `<script setup>` 区域（大约第 165 行）：

```ts
const avatarUrl = '/assets/images/logo.webp'   // 头像图片路径
const qrCodeUrl = '/assets/images/qrcode.svg'  // 翻转后的二维码路径
```

将你的头像和二维码图片放到 `public/assets/images/` 目录下替换原有文件。

### 2. 个性化标语

在 `<script setup>` 区域（大约第 175 行）修改打字机文字：

```ts
const sloganText = '唔...这都被你发现啦？(*/ω＼*)'
```

在 `<template>` 区域（大约第 44 行）修改副标题：

```html
<p class="slogan-sub">
  欢迎来到风风的赛博小屋 ~\(≧▽≦)/~<br />
  这里记录着代码、故事和...忘了还有什么了！QAQ
</p>
```

### 3. 社交链接

在 `<script setup>` 里（大约第 228 行）找到 `socialLinks` 数组：

```ts
const socialLinks = [
  {
    name: 'GitHub',
    icon: 'fab fa-github',
    link: 'https://github.com/<你的用户名>',
    color: '#24292e',
  },
  // B 站和邮箱同理
]
```

### 4. 首页传送门卡片

紧接 `socialLinks` 的下方找到 `features` 数组：

```ts
const features = [
  {
    icon: 'fa-laptop-code',
    title: '技术手札',
    desc: '代码与Bug的爱恨情仇',
    route: '/articles/frontend', // 跳转路径，通常不需要改
  },
  // 其他卡片同理
]
```

---

## 三、定制壁纸与主题色

### 1. 更换背景壁纸

找到 `src/components/layout/MainLayout.vue` 的 `<script setup>` 区域（大约第 151 行）：

```ts
const lightWallpaper = '/assets/images/wallpaper.webp'           // 亮色模式壁纸
const darkWallpaper = '/assets/images/dark-theme-wallpaper.webp' // 暗色模式壁纸
```

准备两张壁纸（推荐 `.webp` 格式，体积小、加载快），放到 `public/assets/images/` 目录下替换原有文件。

### 2. 修改主题色

找到 `src/styles/theme.css`，修改以下变量：

```css
:root {
  /* 主题色，影响高亮、按钮和光效 */
  --accent-color: #0077ff;
}
```

---

## 四、定制页面标题（Router Meta）

切换页面时，浏览器标签页标题和顶部打字机文字会随之变化。找到 `src/router/index.ts` 中的 `routes` 数组，每个 `meta: { title: '...' }` 对应一个页面的标题文字：

```ts
// 首页
meta: { title: '欢迎回家 ~\(≧▽≦)/~ 正在首页发呆中...' }

// 文章列表页
meta: { title: '这里是全部的文章哦 ( •̀ ω •́ )✧' }

// 分类页
meta: { title: '正在翻阅网站开发笔记... 努力学习中！' }
```

---

## 五、修改文章分类卡片文案

在"文章总览"页面，有三个分类卡片。找到 `src/views/ArticleView.vue` 的 `<template>` 区域，直接修改卡片的标题和描述文字即可。

---

## 六、保存修改并推送到你的仓库

本地修改完成后，将代码推送到你的 Fork 仓库：

```bash
git add .
git commit -m "Customize my blog"
git push origin main
```

推送成功后，代码已保存到你的 GitHub 仓库。接下来可以进行生产部署了。

**下一步：[部署到云服务器](./how-to-deploy-on-vps.md)**

---

> 没有未来的小风酱 敬上
