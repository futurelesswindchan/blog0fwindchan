# 1. 个性化你的博客：打造属于你的赛博小屋

> **目标读者**：已经成功在本地运行起博客，并希望把它改成自己专属样子的朋友们~  
> **前置要求**：你的博客能在本地 `localhost` 正常跑起来。

---

## 零、前言：“我的地盘，我做主！”

太棒了！你的博客已经成功运行起来了！(๑•̀ㅂ•́)و✧

但现在，它可能还挂着“风风博客”的招牌，说着各种颜文字。这怎么行呢！你的赛博小屋，当然要有你自己的风格。

这篇教程是你的**深度装修指南**，我们将深入代码，修改标题、标语、头像、背景，甚至每一个页面的欢迎语，把它变成独一无二的个人空间。

**⚠️ 重要提示**：装修完别忘了看最后一节，教你如何把装修成果保存到云端仓库！

---

## 一、修改“门面”：全局基础信息

这些是访客无论在哪个页面都能看到的东西。

### 1. 网站标题与 Logo

- **找到文件**：`src/components/layout/MainLayout.vue`
- **修改站名**：
  在 `<template>` 区域（大约第 26 行）：
  ```html
  <div class="left-group">
    <img :src="logo" class="logo" />
    <h1>风风博客</h1>
    <!-- 👉 把这里改成你的博客名字！ -->
  </div>
  ```
- **修改 Logo**：
  在 `<script setup>` 区域（大约第 150 行）：
  ```ts
  const logo = '/favicon.png' // 默认使用 favicon 作为 logo
  ```
  如果你想用别的图片，把图片放到 `public/assets/images/` 下，然后修改这里的路径。

### 2. 浏览器标签页图标 (Favicon)

- **找到文件**：`public/favicon.png`
- **操作**：找一个你喜欢的正方形图片（推荐 PNG 格式），重命名为 `favicon.png`，直接替换掉这个文件。

---

## 二、定制首页：你的个人名片 (HomeView)

首页是你展示个性的核心区域，对应文件 `src/views/HomeView.vue`。

### 1. 头像与二维码 (Hero Section)

- **修改代码**：找到 `<script setup>` 区域（大约第 165 行）：
  ```ts
  // --- 资源路径 ---
  const avatarUrl = '/assets/images/logo.webp' // 👉 头像图片路径
  const qrCodeUrl = '/assets/images/qrcode.svg' // 👉 翻转后的二维码路径
  ```
- **操作**：把你的头像和二维码图片放到 `public/assets/images/` 文件夹里替换掉这些文件。

### 2. 个性化标语 (Slogan)

- **修改代码**：在 `<script setup>` 区域（大约第 175 行）：
  ```ts
  const sloganText = '唔...这都被你发现啦？(*/ω＼*)' // 👉 打字机效果的文字
  ```
- **修改副标题**：在 `<template>` 区域（大约第 44 行）：
  ```html
  <p class="slogan-sub">
    欢迎来到风风的赛博小屋 ~\(≧▽≦)/~<br />
    <!-- 👉 改成你的欢迎语 -->
    这里记录着代码、故事和...忘了还有什么了！QAQ
  </p>
  ```

### 3. 社交链接 (Social Links)

- **修改代码**：在 `<script setup>` 里（大约第 228 行），找到 `socialLinks` 数组：
  ```ts
  const socialLinks = [
    {
      name: 'GitHub',
      icon: 'fab fa-github', // FontAwesome 图标代码
      link: 'https://github.com/你的用户名', // 👉 换成你的链接
      color: '#24292e',
    },
    // ... B站和邮箱同理
  ]
  ```

### 4. 传送门卡片 (Portals)

首页底部的“技术手札”、“奇怪杂谈”等入口。

- **修改代码**：就在上一小节的下面！找到 `features` 数组：
  ```ts
  const features = [
    {
      icon: 'fa-laptop-code',
      title: '技术手札', // 👉 卡片标题
      desc: '代码与Bug的爱恨情仇', // 👉 卡片描述
      route: '/articles/frontend', // 跳转路径（一般不用改）
    },
    // ... 其他卡片
  ]
  ```

---

## 三、定制“窗外风景”：壁纸与主题

### 1. 更换背景壁纸

- **找到文件**：`src/components/layout/MainLayout.vue`
- **修改代码**：在 `<script setup>` 区域（大约第 151 行）：
  ```ts
  const lightWallpaper = '/assets/images/wallpaper.webp' // 👉 亮色模式壁纸
  const darkWallpaper = '/assets/images/dark-theme-wallpaper.webp' // 👉 暗色模式壁纸
  ```
- **操作**：准备两张你喜欢的壁纸（推荐 .webp 格式，体积小加载快），放到 `public/assets/images/` 目录下替换掉这些文件。

### 2. 修改主题色 (Theme Color)

想不想要一个“猛男粉”或者“极客绿”的主题色？

- **找到文件**：`src/styles/theme.css`
- **修改变量**：
  ```css
  :root {
    /* 主题色，影响各种高亮、按钮和光效！改这个就够了！ */
    --accent-color: #0077ff;
  }
  ```

---

## 四、进阶定制：有趣的动态标题 (Router Meta)

你有没有发现，当你切换页面时，浏览器标签页的标题和顶部的打字机文字会变？这非常酷！让我们来定制它。

- **找到文件**：`src/router/index.ts`
- **修改代码**：找到 `routes` 数组配置。每一个 `meta: { title: '...' }` 对应一个页面的欢迎语。

  **例子 1：修改首页欢迎语**

  ```ts
  {
    path: 'home',
    name: 'Home',
    component: () => import('@/views/HomeView.vue'),
    // 👇 修改下面这句话，它会显示在浏览器标签和页面顶部打字机里
    meta: { title: '欢迎回家 ~\(≧▽≦)/~ 正在首页发呆中...' },
  },
  ```

  **例子 2：修改文章列表页欢迎语**

  ```ts
  {
    path: 'articles',
    // ...
    meta: {
      title: '这里是全部的文章哦 ( •̀ ω •́ )✧', // 👉 改成你喜欢的骚话
    },
  },
  ```

  **例子 3：修改分类页欢迎语**

  ```ts
  {
    path: 'frontend',
    name: 'FrontEnd',
    // ...
    meta: { title: '正在翻阅网站开发笔记... 努力学习中！' }, // 👉 改！
  },
  ```

---

## 五、修改文章分类页面的文案 (ArticleView)

在“文章总览”页面，有三个巨大的分类卡片。

- **找到文件**：`src/views/ArticleView.vue`
- **修改代码**：在 `<template>` 区域，你可以直接修改卡片的标题和描述。

  ```html
  <!-- 例如修改“技术手札”卡片 -->
  <div class="card-content">
    <h3>技术手札</h3>
    <!-- 👉 标题 -->
    <p class="description">
      网站开发笔记与心得（前后端技术栈等等等等~0vo）
      <!-- 👉 描述 -->
    </p>
    <!-- ... -->
  </div>
  ```

---

## 六、关键一步：保存装修成果！

你在本地修改得再漂亮，如果不保存到云端仓库，服务器是拿不到这些修改的！

我们需要使用 **Git** 将代码提交到你的 GitHub 仓库。

> **如果你还不会用 Git**：  
> 请务必先花 10 分钟看这个视频，学会最基础的 add, commit, push 操作：  
> 👉 [【B站】Git 零基础入门教程](https://www.bilibili.com/video/BV1Hkr7YYEh8/)

**操作步骤**：

1.  打开终端，确保在项目根目录下。
2.  执行以下命令：

```bash
# 1. 把所有修改添加到暂存区
git add .

# 2. 提交修改，并写个备注（比如“装修了首页”）
git commit -m "Customize my blog style"

# 3. 推送到你的 GitHub 仓库
git push origin main
```

**当你看到 `Pushed` 成功的提示，恭喜你！你的装修成果已经安全地保存在云端了。**

接下来，让我们去服务器上把它们部署出来吧！👉 **请看下一篇《进阶之路：如何将你的博客部署到云服务器》**

---

> 没有未来的小风酱 敬上
