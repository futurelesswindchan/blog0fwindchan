# 风风博客开发小记（番外）：一只搜索栏引发的“离谱”大冒险

> 这是一篇轻松又真实的前端调试故事（血泪史QAQ）。  
> 讲述了一个小小的搜索栏，如何像蝴蝶扇动翅膀一样，让整个博客陷入“白屏风暴”——以及我们是如何抓住这只“幽灵蝴蝶”的！

## 1. 案发现场：消失的页面

事情的起因很简单：为了让博客看起来更“高级”，我们给路由切换加上了 Vue 的 `<transition>` 动画。

本来以为只是加个特效，结果画廊和友情链接这两个页面直接就挂了OAO！

**诡异现象记录：**

- **现象一**：首次加载正常，但只要从其他页面切回来，内容区大概率会变成一片空白。
- **现象二**：一旦变白，怎么切都回不来了，仿佛数据被黑洞吞噬。
- **现象三**：控制台**没有任何报错**（这是最恐怖的），DOM 树里只剩下一个孤零零的注释节点：

```html
<div class="content-view glass-container">
  <!---->
  <!-- 寂寞的注释节点 -->
</div>
```

## 2. 嫌疑人排查：谁杀了我的 DOM？

面对这种邪恶的无报错白屏，我们展开了地毯式排查。

### 嫌疑人 A：Transition 动画组件

**理由**：既然是加了动画才挂的，肯定是动画的锅！是不是 `mode="out-in"` 导致组件卸载时机不对？
**审讯结果**：我们把动画钩子全删了，甚至把 `<transition>` 标签都拆了，问题居然还在！**排除。**

### 嫌疑人 B：Vue Router

**理由**：是不是路由守卫 `beforeEach` 里的异步加载逻辑卡住了？
**审讯结果**：打了一堆 `console.log`，发现数据请求都成功返回了 200 OK，Store 里的数据也是满的。**排除。**

### 嫌疑人 C：组件生命周期

**理由**：是不是 `onMounted` 没触发？
**审讯结果**：组件确实挂载了，但渲染出来的列表长度是 0。等等……数据明明在 Store 里，为什么列表是空的？

## 3. 真相大白：断裂的响应式链条

就在我们盯着代码发呆时，终于发现了这对苦命鸳鸯的共同点：
**它们都用到了那个强大的组合式函数——`useSearchAndSort`。**

让我们看看案发代码：

```ts
// src/views/GalleryView.vue（很久很久之前的版本了awa）

const artworkStore = useArtworkStore()
// 这里的 artworks 是一个 computed 属性
const artworks = computed(() => artworkStore.artworks)

const { filteredItems } = useSearchAndSort({
  // 🚨 凶手就在这里！
  items: artworks.value,
  searchFields: (item) => [item.title],
  // ...
})
```

### 3.1 凶手的手法

Vue 3 的响应式系统是基于 Proxy 的，但它有一个原则：**一旦你取了 `.value`，你就得到了一个普通的值（在这里是一个空数组），响应式链条就此断裂。**

1.  **初始化时**：页面加载，Store 里的 `artworks` 还是空的（正在请求中）。
2.  **传递参数**：我们把 `artworks.value`（也就是 `[]`）传给了 `useSearchAndSort`。
3.  **函数内部**：组合式函数拿到的是一个普通的空数组，它尽职尽责地返回了过滤后的结果——依然是空数组。
4.  **数据到达**：几百毫秒后，Store 数据加载完毕，`artworks` 更新了。
5.  **悲剧发生**：因为传进去的是死值，组合式函数**根本不知道数据更新了**！`filteredItems` 永远停留在了空数组的状态。

### 3.2 为什么之前没发现？

因为在没有 `<transition>` 时，页面切换可能不够“平滑”，导致我们没注意到数据加载的时间差。

或者是因为之前运气好，数据在组件挂载前就有了（比如热重载时）。而加上动画后，组件的挂载时机发生了微妙变化，让这个 Bug 必现了。

## 4. 缉拿归案：修复与优化

### 4.1 紧急修复

只需删掉那个该死的 `.value`，把整个 Ref 扔进去：

```ts
const { filteredItems } = useSearchAndSort({
  items: artworks, // ✅ 传 Ref/Computed 进去，保持响应式连接！
  // ...
})
```

### 4.2 制度优化：让 Composable 更健壮

为了防止以后再犯这种低级错误，我们优化了 `useSearchAndSort.ts` 的内部实现，利用 Vue 的 `unref` (或 Vue 3.3+ 的 `toValue`) 来做归一化处理。

这样，无论你传的是 `ref`、`computed` 还是普通数组，它都能照单全收：

```ts
// src/composables/useSearchAndSort.ts（现在的升级版！）

export function useSearchAndSort<T>(options: {
  // 类型定义宽容一点
  items: T[] | Ref<T[]> | ComputedRef<T[]>
  // ...
}) {
  // 内部计算时，总是通过 unref 解包
  // 这样如果 items 是 ref，它会追踪依赖；如果是数组，就是普通值
  const sortedAndSearchedItems = computed(() => {
    const rawItems = unref(options.items) // ✨ 魔法在这里
    if (!rawItems?.length) return []
    // ... 过滤逻辑
  })

  // ...
}
```

## 5. 侦探笔记（总结）

这次离谱的调试经历给我们上了生动的一课：

1.  **警惕 `.value`**：在 setup 顶层传递参数给组合式函数时，千万别手滑加 `.value`，除非你确定只需要一次性的静态数据。
2.  **组合式函数的修养**：编写 Composable 时，参数尽量支持 `MaybeRef` 类型，并用 `unref` 处理，这样对调用者最友好（鲁棒性 MMMax）。
3.  **空白无报错**：如果页面一片白且控制台干净得像张白纸，通常不是代码崩了，而是**数据流断了**。

**前端开发，细节决定命运！** 一个小小的 `.value`，就能让整个博客“消失”。希望这篇故事能帮你在 Vue 3 的响应式大冒险中少踩一个坑！

---

> 被 `.value` 坑哭的风酱 著  
> 2025-12-12重写 （番外篇）
