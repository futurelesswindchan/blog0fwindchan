# 如何在风风博客博客投稿时自定义字体颜色与背景色

> 本文是为**完全没有编程经验**的朋友准备的，  
> 手把手教你如何在 Markdown 文章中给文字加上**颜色**和**背景色**，  
> 让你的内容更有表现力，而且在浅色和深色主题下都能自动适配。

---

## 1. 为什么要给文字加颜色？

有时候，我们希望让文章里的某些内容**更醒目**，比如：

- 用红色提醒大家注意重要信息
- 给一段话加上淡蓝色背景，像便签一样突出
- 让不同角色的对话用不同颜色，故事更有氛围

在风风博客博客，你可以很简单地实现这些效果，不需要懂编程！

---

## 2. 风风博客的“魔法词语”是什么？

Markdown 本身不支持直接设置颜色，但风风博客博客为大家准备了一套“魔法词语”  
——只要把你想变色的内容用这些魔法词语包裹起来，博客就会自动帮你变色！

这些魔法词语其实就是一些特殊的写法（专业名词叫“标签”和“class类名称”），  
但你可以把它们当作咒语来用。

---

## 3. 如何施展颜色魔法？（最简单的用法）

### 3.1 让一段文字变成粉色

只需要这样写：

```html
<span class="text-pink">这是粉色的文字</span>
```

发布后就会看到：  
<span class="text-pink">这是粉色的文字</span>

### 3.2 给一段内容加上淡紫色背景

只需要这样写：

```html
<span class="bg-purple">这是带有淡紫色背景的内容</span>
```

发布后就会看到：

<span class="bg-purple">这是带有淡紫色背景的内容</span>

### 3.3 让角色对话有不同颜色

比如：

```html
<span class="text-blue">「我是主角，这句话是主角说的！」</span>
<span class="text-orange">「我是配角，这句话是配角说的！」</span>
```

发布后就会看到：  
<span class="text-blue">「我是主角，这句话是主角说的！」</span>  
<span class="text-orange">「我是配角，这句话是配角说的！」</span>

---

## 4. 为什么要用“魔法词语”而不是直接写颜色？

风风博客博客有浅色和深色两种主题，会根据大家的设置自动切换。  
如果你直接写颜色代码（比如 `style="color:red"`），有可能在某些主题下看不清楚。

**只要你用推荐的魔法词语（class 名称），博客就会自动帮你适配所有主题。**  
你不用担心颜色在不同主题下会出问题。

---

## 5. 所有可用的颜色魔法词语一览

你可以在 `<span>` 这个魔法词语里加上下面的 class 名称（魔法属性），让文字或背景变色。

### 5.1 所有可用的文字颜色魔法

| 效果                                         | 魔法写法                                       |
| -------------------------------------------- | ---------------------------------------------- |
| <span class="text-red">红色</span>           | `<span class="text-red">红色</span>`           |
| <span class="text-pink">粉色</span>          | `<span class="text-pink">粉色</span>`          |
| <span class="text-purple">紫色</span>        | `<span class="text-purple">紫色</span>`        |
| <span class="text-deep-purple">深紫色</span> | `<span class="text-deep-purple">深紫色</span>` |
| <span class="text-indigo">靛蓝色</span>      | `<span class="text-indigo">靛蓝色</span>`      |
| <span class="text-blue">蓝色</span>          | `<span class="text-blue">蓝色</span>`          |
| <span class="text-light-blue">浅蓝色</span>  | `<span class="text-light-blue">浅蓝色</span>`  |
| <span class="text-cyan">青色</span>          | `<span class="text-cyan">青色</span>`          |
| <span class="text-teal">蓝绿色</span>        | `<span class="text-teal">蓝绿色</span>`        |
| <span class="text-green">绿色</span>         | `<span class="text-green">绿色</span>`         |
| <span class="text-light-green">浅绿色</span> | `<span class="text-light-green">浅绿色</span>` |
| <span class="text-lime">柠檬色</span>        | `<span class="text-lime">柠檬色</span>`        |
| <span class="text-yellow">黄色</span>        | `<span class="text-yellow">黄色</span>`        |
| <span class="text-amber">琥珀色</span>       | `<span class="text-amber">琥珀色</span>`       |
| <span class="text-orange">橙色</span>        | `<span class="text-orange">橙色</span>`        |
| <span class="text-deep-orange">深橙色</span> | `<span class="text-deep-orange">深橙色</span>` |
| <span class="text-brown">棕色</span>         | `<span class="text-brown">棕色</span>`         |
| <span class="text-gray">灰色</span>          | `<span class="text-gray">灰色</span>`          |
| <span class="text-blue-gray">蓝灰色</span>   | `<span class="text-blue-gray">蓝灰色</span>`   |
| <span class="text-black">黑色</span>         | `<span class="text-black">黑色</span>`         |

### 5.2 背景颜色魔法

| 效果                                             | 魔法写法                                           |
| ------------------------------------------------ | -------------------------------------------------- |
| <span class="bg-red">淡红色背景</span>           | `<span class="bg-red">淡红色背景</span>`           |
| <span class="bg-pink">淡粉色背景</span>          | `<span class="bg-pink">淡粉色背景</span>`          |
| <span class="bg-purple">淡紫色背景</span>        | `<span class="bg-purple">淡紫色背景</span>`        |
| <span class="bg-deep-purple">淡深紫色背景</span> | `<span class="bg-deep-purple">淡深紫色背景</span>` |
| <span class="bg-indigo">淡靛蓝色背景</span>      | `<span class="bg-indigo">淡靛蓝色背景</span>`      |
| <span class="bg-blue">淡蓝色背景</span>          | `<span class="bg-blue">淡蓝色背景</span>`          |
| <span class="bg-light-blue">淡浅蓝色背景</span>  | `<span class="bg-light-blue">淡浅蓝色背景</span>`  |
| <span class="bg-cyan">淡青色背景</span>          | `<span class="bg-cyan">淡青色背景</span>`          |
| <span class="bg-teal">淡蓝绿色背景</span>        | `<span class="bg-teal">淡蓝绿色背景</span>`        |
| <span class="bg-green">淡绿色背景</span>         | `<span class="bg-green">淡绿色背景</span>`         |
| <span class="bg-light-green">淡浅绿色背景</span> | `<span class="bg-light-green">淡浅绿色背景</span>` |
| <span class="bg-lime">淡柠檬色背景</span>        | `<span class="bg-lime">淡柠檬色背景</span>`        |
| <span class="bg-yellow">淡黄色背景</span>        | `<span class="bg-yellow">淡黄色背景</span>`        |
| <span class="bg-amber">淡琥珀色背景</span>       | `<span class="bg-amber">淡琥珀色背景</span>`       |
| <span class="bg-orange">淡橙色背景</span>        | `<span class="bg-orange">淡橙色背景</span>`        |
| <span class="bg-deep-orange">淡深橙色背景</span> | `<span class="bg-deep-orange">淡深橙色背景</span>` |
| <span class="bg-brown">淡棕色背景</span>         | `<span class="bg-brown">淡棕色背景</span>`         |
| <span class="bg-gray">淡灰色背景</span>          | `<span class="bg-gray">淡灰色背景</span>`          |
| <span class="bg-blue-gray">淡蓝灰色背景</span>   | `<span class="bg-blue-gray">淡蓝灰色背景</span>`   |
| <span class="bg-black">淡黑色背景</span>         | `<span class="bg-black">淡黑色背景</span>`         |

---

## 6. 实际写作时怎么用？

只需要把你想变色的内容用 `<span class="..."></span>` 包起来，  
把 `...` 换成你想要的颜色魔法词语（class 名称），  
然后把这段内容直接写进你的 Markdown 文章里。

比如：

```html
<span class="text-pink">温馨提示：这里很重要！</span>

<span class="bg-indigo">这是一个带有淡靛蓝色背景的提示框。</span>

<span class="text-green">「我是绿色角色！」</span>
<span class="text-brown">「我是棕色角色！」</span>
```

发布后会显示为：

<span class="text-pink">温馨提示：这里很重要！</span>

<span class="bg-indigo">这是一个带有淡靛蓝色背景的提示框。</span>

<span class="text-green">「我是绿色角色！」</span>  
<span class="text-brown">「我是棕色角色！」</span>

（实际效果以博客页面为准）

---

## 7. 常见疑问解答

### Q1：我完全不会写这些魔法词语怎么办？

没关系！如果你需要粉色的文字，则只要照着上面的例子，  
把 `<span class="text-pink">你要显示的内容</span>` 复制到你的 Markdown 里，  
再把内容部分换成你自己的文字就行了。

### Q2：能不能用别的颜色？

目前博客只支持上面表格里的这些颜色。如果你有特别想要的颜色，可以联系站长帮你添加。

### Q3：能不能同时设置文字颜色和背景色？

当然可以！只要把两个魔法词语写在一起就行，  
比如 `<span class="text-blue bg-yellow">蓝色字+黄色背景</span>`。

效果就是这样哒~  
<span class="text-blue bg-yellow">蓝色字+黄色背景</span>

---

## 9. 总结

- 用风风博客博客的“魔法词语”，你可以轻松让文字变色、加背景。
- 不需要懂代码，也不用担心主题切换时颜色出问题。
- 有任何疑问，欢迎联系站长或在评论区留言。

祝你写作愉快，期待你的精彩投稿！

---
