# Vol.8 视觉盛宴：画廊 LazyImage 懒加载与友链留言板

> **摘要**：当一个博客塞满了高清画作、友链头像和投喂列表时，如何保证它既有“赛博拟态”的惊艳，又不会卡成 PPT？  
> 小风酱祭出了 `IntersectionObserver` 懒加载神器，并用一段绝妙的洗牌算法结合 CSS Grid 黑魔法，打造了一个错落有致的便当盒瀑布流！🍱✨

---

## 1. 性能与美感的博弈：LazyImage 懒加载

在构建画廊（Gallery）页面时，小风酱遇到了所有前端都会头疼的问题： **满屏的高清大图，如果不做优化，不仅会瞬间榨干用户的带宽，还会让页面渲染卡到怀疑人生。** OAO

为了解决这个问题， `<LazyImage>` 组件闪亮登场！它没有使用任何第三方沉重的库，而是直接调用了浏览器原生的 API 霸主—— `IntersectionObserver`。

### 1.1 视野交汇的魔法

传统监听 `scroll` 事件的做法既耗性能又容易卡顿。而 `IntersectionObserver` 就像是一个默默站在视口边缘的哨兵：

```typescript
// LazyImage.vue 核心逻辑
const setupIntersectionObserver = () => {
  observer = new IntersectionObserver(
    (entries) => {
      // 只要图片进入了距离视口 100px 的范围内...
      if (entries[0].isIntersecting) {
        const img = new Image()
        img.onload = () => {
          currentSrc.value = props.src
        } // 悄悄替换真实链接
        img.onerror = onError
        img.src = props.src

        // 加载完了就调用 disconnect() 彻底解雇哨兵，绝不浪费一丝性能！
        observer?.disconnect()
      }
    },
    { rootMargin: '100px' },
  ) // 提前 100px 预加载，极致丝滑

  observer.observe(containerRef.value)
}
```

### 1.2 永不言弃的重试机制与降级 UI

网络波动导致图片裂开（变成丑陋的碎图图标）是绝对不能容忍的！  
小风酱在组件里加入了一个贴心的“重试机制”：如果加载失败，它会等待一两秒，然后在 URL 后面加上 `?retry=n` 再次尝试，最多重试 3 次！

而在图片还没加载出来，或者彻底加载失败时，它会展示一个可爱的占位符：

```html
<!-- 优雅的降级 UI 喵~ -->
<div v-if="hasError" class="error-placeholder">
  <i class="fas fa-image"></i>
  <span>加载中喵</span>
</div>
```

---

## 2. 赛博画廊：极简与交互的碰撞

有了 `LazyImage` 打底，画廊页面的渲染就变得肆无忌惮了。  
在 `GalleryView.vue` 中，我们依然沿用了 Vol.5 中无敌的 `useSearchAndSort` Hook，搭配 `FilterBar` 和 `PaginationControls`，兵不血刃地拿下了搜索和分页逻辑。

而在视觉交互上，小风酱为每一张画作卡片注入了灵魂：  
卡片平时安静地待在网格里，当你的鼠标悬浮上去时， **图片会微微放大（** `scale(1.05)`**），而隐藏在底部的标题和日期信息，会配合缓动动画平滑地向上滑出**。

```css
/* 隐藏在底部的秘密 */
.artwork-info {
  position: absolute;
  bottom: -100%; /* 平时藏在下面 */
  transition: all 0.4s var(--aero-animation);
}

/* 悬浮时的惊艳滑出 */
.artwork-card:hover .artwork-info {
  bottom: 0;
  transform: translateY(0);
}
```

---

## 3. 沉浸式鉴赏：画廊预览弹窗 (GalleryPreviewModal)

当用户在画廊中看到心仪的画作，点击卡片时，如果只是简单粗暴地跳转到一个新标签页，那绝对是对 Aero 美学的亵渎。

小风酱为此专门打造了一个极其优雅的沉浸式预览组件—— `GalleryPreviewModal`。这也是整个博客中最具代表性的“承上启下”之作。它不仅复用了前面提到的 `LazyImage`，还引出了我们下一章的核心架构： **全局弹窗状态管理**。

### 3.1 经典的 Flex 三段式布局

为了保证在大屏和小屏下都能完美展现画作，模态框采用了非常经典的 `Flex column` 三段式布局：

1. **Header（固定高度）** ：展示标题，并巧妙地为右上角的全局关闭按钮留出 `60px` 的空间。
2. **Middle（自适应拉伸）** ：使用 `flex: 1` 占据所有剩余空间。这里再次召唤了我们的老朋友 `<LazyImage>`，并将 `object-fit` 设置为 `contain`，确保无论原图比例多么离谱，都能完整且居中地显示在屏幕上，还自带一层淡淡的阴影（ `drop-shadow`）。
3. **Footer（自适应内容）** ：展示日期与描述。如果艺术家的碎碎念太长，还可以自动开启内部滚动。

### 3.2 隐形的交互结界：隐形导航条

在图片预览中，“上一张 / 下一张”的切换体验至关重要。  
小风酱没有在图片下方放两个傻乎乎的按钮，而是在图片的左右两侧，铺设了两条宽达 `80px` 的隐形触发带（ `.nav-strip`）：

```css
/* 隐形的触发带，覆盖在图片两边 */
.nav-strip {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 80px;
  background: transparent;
  z-index: 20;
}

/* PC 端的高级感：Hover 时泛起主题色的微光，图标放大 */
@media (hover: hover) {
  .nav-strip:hover {
    background: #0077ff6f;
  }
  .nav-strip:hover .nav-icon-bg {
    color: white;
    transform: scale(1.1);
  }
}
```

鼠标移上去时，两侧会泛起充满赛博感的微光，点击即可丝滑切换。这才是极客该有的交互体验！

### 3.3 灵魂拷问：状态该由谁管？

如果你仔细看这个组件的 `<script>` 部分，你会发现一个极其“反直觉”的事情： **这个组件里竟然没有定义任何响应式变量！**

```typescript
// GalleryPreviewModal.vue
<script setup lang="ts">
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import LazyImage from '@/components/common/LazyImage.vue'
import BaseModal from '../common/BaseModal.vue'

const modalStore = useGlobalModalStore() // 💥 所有的状态，全部来自这里！
</script>
```

没有 `const show = ref(false)`，也没有 `const currentImage = ref(null)`。  
无论是模态框的显示隐藏（ `modalStore.showGalleryPreview`）、当前图片的详情（ `modalStore.previewArtwork`），  
还是上一张/下一张的切换逻辑（ `modalStore.navigateGallery`）， **全 部 交 给 了 全 局 Store！**

为什么要这么设计？  
因为在大型 Vue 应用中，如果每个组件自己管自己的弹窗状态，最后就会演变成弹窗叠弹窗、关闭事件传不出去的混乱地狱。

所以，不如把所有弹窗的控制权全部上交给统领全局的 Store，让页面组件只负责‘呼叫’，让弹窗容器只负责‘响应’！

## 4. 终极视觉魔法：友链与投喂的 Bento 瀑布流

如果说画廊页面是规规矩矩的极简美学，那 `FriendsView.vue` 绝对是小风酱“丧心病狂”的炫技场！(￣▽￣)／

需求是这样的：我们需要在同一个页面展示 **“友链大佬（带头像和介绍）”** 和 **“投喂感谢（带碎碎念留言）”** 。如果分成上下两块，太平庸了；如果做成同样的列表，又太无聊。

于是， **“混合便当盒（Bento Grid）瀑布流”** 诞生了！

### 4.1 跨界联名：洗牌算法

小风酱写了一段精妙的聚合逻辑，将 `friendStore` 和 `sponsorStore` 的数据揉碎，像发牌一样重新组合：

```typescript
// 每次随机取 1~2 个大卡片，再随机取 1~3 个小碎块
const mixedData = computed<MixedGridItem[]>(() => {
  // ... 前略
  // 随机插入 1~2 个友链大卡片
  const fCount = Math.floor(Math.random() * 2) + 1
  for (let i = 0; i < fCount; i++) {
    result.push({
      type: 'friend',
      data: friends[fIdx],
      isReversed: Math.random() > 0.5, // 连左右布局都要掷骰子决定！
    })
  }
  // 随机插入 1~3 个投喂小碎块
  // ...
  return result
})
```

这让页面每次刷新时，排版都会产生微妙的错落感，永远不会审美疲劳！

.......但其实这里有个大坑OAO！

在 Vue 3 中，`computed` 是基于响应式依赖缓存的。`Math.random()` 不是响应式变量。这意味着：  
如果 `friends` 和 `sponsors` 数组不发生变化，哪怕页面路由切走再切回来（只要组件没被销毁），排版是不会重新洗牌的（因为它被缓存死啦）。  
反过来，如果用户碰巧在这时收到了一条新的投喂（Store 数据变了）， `computed` 会重新触发，由于里面有 `Math.random()` ，整个瀑布流的排版会瞬间全盘大乱洗！用户如果正在看某张卡片，卡片可能“嗖”地一下就飞到屏幕下面去了 QAQ！

可是为什么小风酱还要这样写呐awa？  
如果你运气真的好到，在正确的时机待在正确的页面里...这又会是一个小小的惊喜彩蛋啊！(￣▽￣)／

### 4.2 CSS Grid 的绝对统治力： `dense`

排版错落有致，必然会产生难以填补的“空隙”。这时候，CSS Grid 里的神仙属性 `grid-auto-flow: dense` 就该登场了！

```css
.bento-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  grid-auto-rows: 80px; /* 基础高度是 80px */
  grid-auto-flow: dense; /* ✨ 魔法指令：让小碎块自动去填补大卡片留下的空隙！ */
}

/* 友链大卡片：我要占两行两列！ */
.friend-card {
  grid-column: span 2;
  grid-row: span 2;
}

/* 投喂小碎块：我乖乖占一行一列就好~ */
.sponsor-shard {
  grid-column: span 1;
  grid-row: span 1;
}
```

搭配上随机生成的 `.reverse-layout` 类名（让头像随机出现在左边或右边），整个页面就像一面错落有致的赛博涂鸦墙！  
当鼠标悬浮在大卡片上时，头像还会伴随着 `rotate(2deg)` 的俏皮倾斜，简直让人忍不住想把每一个卡片都摸一遍！0v0

---

## 下集预告

现在，我们的博客已经拥有了极客的主页、酷炫的路由、优雅的复用逻辑，以及满屏视觉享受的文章阅读、画廊与瀑布流。前端的面子工程算是彻底毕业啦！🎉

但是，通过画廊的预览弹窗，我们窥探到了前端状态管理的冰山一角。  
一个小小的画廊弹窗尚且如此，那博客的“登录框”、“全局设置框”加在一起，该如何优雅地统筹规划？  
下一篇 **【Vol.9 从混乱到秩序：GlobalModalStore 全局弹窗体系】** ，将揭开 `useGlobalModalStore` 的神秘面纱，看看小风酱是如何用一个 Pinia Store，将全站所有乱飞的弹窗驯服得服服帖帖的！

---

> 看着瀑布流发呆了一下午的小风酱 著 🎨  
> 本文采用[知识共享署名-非商业性使用 4.0 国际许可协议](https://creativecommons.org/licenses/by-nc/4.0/)进行许可
