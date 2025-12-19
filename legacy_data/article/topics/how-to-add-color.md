# 2.风风博客投稿指南：如何给文字施加“颜色魔法”？

> 本文专为**完全没有编程经验**的朋友准备。  
> 手把手教你如何在文章中给文字加上**颜色**、**背景色**甚至**特殊纹理**，让你的内容在浅色和深色主题下都能完美展示。

---

## 1. 写作基础：认识 Markdown

风风博客使用 **Markdown** 渲染器来展示文章。这是一种轻量级的标记语言，能让你专注于写作，而不是排版。

如果你还不会写 Markdown（比如如何加粗、如何插入链接），强烈建议先花 5 分钟看看这个教程：  
👉 [Markdown 官方入门教程](https://markdown.com.cn/intro.html)

虽然 Markdown 本身不支持直接变色，但它兼容 HTML 标签。利用这一点，配合博客内置的“魔法词语”，我们就能实现丰富的视觉效果！

---

## 2. 什么是“魔法词语”？

在风风博客里，我们预定义了一套样式表（CSS）。你不需要写复杂的代码，只需要用 `<span>` 标签把文字包起来，并告诉它用哪个 `class`（魔法词语），博客就会自动帮你变色。

**为什么要用这些魔法词语，而不是直接写死颜色？**
因为风风博客支持**浅色/深色主题切换**。

- 如果你直接写 `color: black`，在深色模式（黑底）下文字就会隐身。
- 使用我们的魔法词语（如 `text-black`），系统会自动判断：在浅色模式显示黑色，在深色模式显示白色。**自动适配，省心省力！**

---

## 3. 如何施展魔法？（快速上手）

### 3.1 基础变色

想让文字变粉色？用 `text-pink`：

```html
<span class="text-pink">这是粉色的文字</span>
```

效果：<span class="text-pink">这是粉色的文字</span>

### 3.2 添加背景色

想给文字加个淡紫色背景？用 `bg-purple`：

```html
<span class="bg-purple">这是带有淡紫色背景的内容</span>
```

效果：<span class="bg-purple">这是带有淡紫色背景的内容</span>

### 3.3 组合拳（颜色+背景+字体）

你可以同时使用多个魔法词语，用空格隔开。比如：蓝色文字 + 黄色背景 + 特殊字体：

```html
<span class="text-blue bg-yellow Aa偷吃可爱长大的">蓝色字+黄色背景+可爱字体</span>
```

效果：<span class="text-blue bg-yellow Aa偷吃可爱长大的">蓝色字+黄色背景+可爱字体</span>

---

## 4. 魔法词语大全

### 4.1 文字颜色 (Text Colors)

将 `class` 设置为以下名称即可：

| 效果示例                                     | 魔法词语 (`class`) | 备注                   |
| :------------------------------------------- | :----------------- | :--------------------- |
| <span class="text-red">红色</span>           | `text-red`         | 警示、强调             |
| <span class="text-pink">粉色</span>          | `text-pink`        | 温柔、可爱             |
| <span class="text-purple">紫色</span>        | `text-purple`      | 神秘                   |
| <span class="text-deep-purple">深紫色</span> | `text-deep-purple` |                        |
| <span class="text-indigo">靛蓝色</span>      | `text-indigo`      |                        |
| <span class="text-blue">蓝色</span>          | `text-blue`        | 链接感、冷静           |
| <span class="text-light-blue">浅蓝色</span>  | `text-light-blue`  |                        |
| <span class="text-cyan">青色</span>          | `text-cyan`        |                        |
| <span class="text-teal">蓝绿色</span>        | `text-teal`        |                        |
| <span class="text-green">绿色</span>         | `text-green`       | 成功、自然             |
| <span class="text-light-green">浅绿色</span> | `text-light-green` |                        |
| <span class="text-lime">柠檬色</span>        | `text-lime`        |                        |
| <span class="text-yellow">黄色</span>        | `text-yellow`      | 醒目                   |
| <span class="text-amber">琥珀色</span>       | `text-amber`       |                        |
| <span class="text-orange">橙色</span>        | `text-orange`      | 活力                   |
| <span class="text-deep-orange">深橙色</span> | `text-deep-orange` |                        |
| <span class="text-brown">棕色</span>         | `text-brown`       | 复古                   |
| <span class="text-gray">灰色</span>          | `text-gray`        | 低调、注释             |
| <span class="text-blue-gray">蓝灰色</span>   | `text-blue-gray`   |                        |
| <span class="text-black">黑色</span>         | `text-black`       | (深色模式下会自动变白) |

### 4.2 背景颜色 (Background Colors)

背景色通常比较淡，适合做高亮标记。将 `class` 设置为以下名称：

| 效果示例                                | 魔法词语 (`class`) |
| :-------------------------------------- | :----------------- |
| <span class="bg-red">淡红背景</span>    | `bg-red`           |
| <span class="bg-pink">淡粉背景</span>   | `bg-pink`          |
| <span class="bg-blue">淡蓝背景</span>   | `bg-blue`          |
| <span class="bg-green">淡绿背景</span>  | `bg-green`         |
| <span class="bg-yellow">淡黄背景</span> | `bg-yellow`        |
| ...以及上表中所有颜色的对应 `bg-` 版本  | ...                |

### 4.3 特殊纹理背景 (Special Textures)

这是风风博客特有的高级魔法！

| 效果                                     | 魔法词语     | 描述                                           |
| :--------------------------------------- | :----------- | :--------------------------------------------- |
| <span class="bg-wind">风之纹章</span>    | `bg-wind`    | 蓝白条纹，带有叠加混合模式，适合引用或强调。   |
| <span class="bg-griffon">狮鹫之印</span> | `bg-griffon` | 深色底+红色条纹+粉色光晕，非常酷炫的暗黑风格。 |

### 4.4 特殊字体 (Special Fonts)

让你的文字更有个性：

| 效果                                           | 魔法词语      | 描述                               |
| :--------------------------------------------- | :------------ | :--------------------------------- |
| <span class="FleurDeleah">Fleur De Leah</span> | `FleurDeleah` | 优雅的英文手写体，适合标题或签名。 |

---

## 5. 进阶：找不到想要的颜色？

如果你觉得上面的颜色还不够用，或者想要一种“五彩斑斓的黑”，你可以自己动手添加！

1.  找到项目文件中的 `src/styles/customColor.css`。
2.  **自己动手**：参照文件里的格式，添加一个新的类名。
3.  **求助 AI**：如果你不会写 CSS，可以把这个文件发给 AI 助手（比如 ChatGPT、Claude 或 Gemini），然后对它说：
    > “请帮我在这个文件里新增一个名为 `text-gold` 的样式，颜色要金光闪闪的，并且要适配深色模式（深色模式下颜色稍微亮一点）。”
4.  将 AI 生成的代码粘贴到文件中保存，你就可以在文章里使用 `<span class="text-gold">...</span>` 啦！

---

## 6. 总结

1.  使用 **Markdown** 撰写文章骨架。
2.  使用 `<span class="魔法词语">内容</span>` 来美化细节。
3.  推荐使用内置的 `text-xxx` 和 `bg-xxx` 类名，以保证**深色模式适配**。
4.  尝试组合使用背景、颜色和字体，创造出你的专属排版风格！

期待在博客看到你色彩斑斓的投稿！✨

---

> 没有未来的小风酱 敬上
