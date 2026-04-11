<!-- frontend\src\components\common\ContentTypeWriter.vue -->
<template>
  <!--
    打字机根容器：
    1. is-typing: 控制打字期间的特殊样式（如光标闪烁）。
    2. is-ready: 用于控制初始透明度，防止 VueMarkdown 瞬间渲染造成的视觉闪烁。
    3. minHeight: 动态锁定真实高度，彻底杜绝页面回流抖动。
  -->
  <div
    class="content-type-writer"
    ref="containerRef"
    :class="{ 'is-typing': isTyping, 'is-ready': isReady }"
    :style="{ minHeight: lockedHeight ? `${lockedHeight}px` : 'auto' }"
  >
    <div class="content-wrapper" ref="contentRef">
      <!-- 核心理念：始终全量渲染 Markdown，绝不中途截断 HTML 字符串，保证 DOM 节点完整，使其可被原生选中并支持超链接点击 -->
      <VueMarkdown
        :source="content"
        :options="markdownOptions || defaultMarkdownOptions"
        :dark-theme="isDarkTheme"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { VueMarkdown, type MarkdownOptions } from '@/composables/useArticleContent'
import { useReadingProgress } from '@/composables/useReadingProgress'
import { ref, watch, nextTick, onUnmounted } from 'vue'
import { prepare, layout } from '@chenglou/pretext'

/**
 * 组件属性定义 (Props)
 * @property {string} content - 需要渲染和执行打字特效的 Markdown 原始内容。
 * @property {MarkdownOptions} markdownOptions - 传递给底层 markdown-it 解析器的配置选项。
 * @property {boolean} isDarkTheme - 当前是否处于暗黑模式。
 * @property {boolean} enabled - 是否启用打字机动画。若设为 false，则瞬间渲染全量文本。
 * @property {number} speed - 打字机帧间隔时间 (ms)，数值越小速度越快。
 * @property {number} initialDelay - 页面加载后等待多久开始执行打字动画 (ms)。
 * @property {number} chunkSize - 每一帧吐出的字符数量，控制打字颗粒度。
 */
interface Props {
  content: string
  markdownOptions?: MarkdownOptions
  isDarkTheme?: boolean
  enabled?: boolean
  speed?: number
  initialDelay?: number
  chunkSize?: number
}

const defaultMarkdownOptions: MarkdownOptions = {
  linkify: true,
  typographer: true,
  html: true,
}

const props = withDefaults(defineProps<Props>(), {
  enabled: true,
  speed: 30,
  initialDelay: 800,
  chunkSize: 2,
  isDarkTheme: false,
})

/**
 * 自定义事件
 * @event update:lineCount - 当 Pretext 计算出精准排版行数时触发，向外暴露排版规模。
 */
const emit = defineEmits(['update:lineCount'])

// --- DOM 引用 (Refs) ---
const containerRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)

// --- 内部状态管理 (State) ---
const isReady = ref(false) // 控制整体透明度显影
const isTyping = ref(false) // 标识当前是否正在进行打字输出
const lockedHeight = ref<number>(0) // 锁定的容器高度，防止高度坍塌
let currentSessionId = 0 // 打字机会话令牌，专治异步冲突awa

// 引入全局进度条状态池
const { globalProgress, isTypingMode, showProgress, unlockHeading, resetUnlockedHeadings } =
  useReadingProgress()

// --- 动画与 DOM 控制器 ---
let animationFrameId: number | null = null
let timeoutId: number | null = null
let cursorElement: HTMLSpanElement | null = null
let parentElement: HTMLElement | null = null // 用于操控外层玻璃背景板的 clip-path

/**
 * 动作队列条目类型
 * 记录 TreeWalker 收集到的每一个需逐步释放的 DOM 节点。
 * - `reveal`: 块级/元素节点（需通过 CSS 动画移除隐身斗篷）。
 * - `text`: 纯文本节点（需逐字注入内容）。
 */
type ActionItem = { type: 'reveal'; node: HTMLElement } | { type: 'text'; node: Text; text: string }

let actions: ActionItem[] = []
let actionIndex = 0 // 当前执行到的动作索引
let charIndex = 0 // 当前文本节点已输出的字符索引

/**
 * 资源清理函数
 * @description 取消所有挂起的动画帧、定时器，移除动态光标，并重置外层容器的裁剪路径。
 */
const cleanup = () => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (timeoutId) clearTimeout(timeoutId)
  if (cursorElement && cursorElement.parentNode) {
    cursorElement.parentNode.removeChild(cursorElement)
  }
  cursorElement = null

  // 清理外层背景板的裁剪魔法，恢复原状
  if (parentElement) {
    parentElement.style.clipPath = 'none'
    parentElement.style.transition = ''
  }
}

/**
 * 极速纯文本排版预估测算
 * @description
 * 利用 pretext 引擎，脱离 DOM 在后台静默计算文本在当前视口宽度下折叠的精确行数。
 *
 * 1. 用挂载后的原生 `innerText`，完美保留段落(`p`)、标题(`h1-h6`)及代码块(`pre`)的换行符(\n)。
 * 2. 动态提取容器的真实 CSS 字体(font)与行高(line-height)，消除硬编码带来的误差。
 * 3. 向 pretext 引擎传递 `{ whiteSpace: 'pre-wrap' }` 配置，使其遵循换行符进行断行测算。
 */
const estimateLayoutWithPretext = () => {
  // 确保外层容器和内部包裹层已就绪 (通常在 await nextTick 之后调用)
  if (!containerRef.value || !contentRef.value) return

  try {
    // 1. 提取带真实物理换行符的纯文本
    // innerText 会根据 CSS 将块级元素转换为合适的换行符，完美适配 Markdown 渲染后的 DOM 结构
    const plainText = contentRef.value.innerText || ''
    if (!plainText.trim()) return

    // 2. 动态捕捉当前文章环境的排版样式
    const computedStyle = window.getComputedStyle(contentRef.value)
    const fontSize = computedStyle.fontSize || '16px'
    const fontFamily = computedStyle.fontFamily || 'system-ui, sans-serif'
    // 组合为 Canvas 兼容的 font 字符串格式，如 "16px system-ui, sans-serif"
    const fontString = `${fontSize} ${fontFamily}`

    // 提取行高：若浏览器返回 'normal'，则按 1.6 的通用排版比例进行降级估算
    let lineHeight = parseFloat(computedStyle.lineHeight)
    if (isNaN(lineHeight)) {
      lineHeight = parseFloat(fontSize) * 1.6
    }

    const containerWidth = containerRef.value.clientWidth || 800

    // 3. 核心计算魔法
    // 关键参数：{ whiteSpace: 'pre-wrap' } 告知 pretext 引擎尊重 plainText 中的 \n 换行符
    const prepared = prepare(plainText, fontString, { whiteSpace: 'pre-wrap' })
    const result = layout(prepared, containerWidth, lineHeight)

    // 4. 对外抛出精准的排版行数
    emit('update:lineCount', result.lineCount)
  } catch (error) {
    console.warn('Pretext measurement failed:', error)
  }
}

/**
 * 强制结束并全量展示打字内容
 * @description 在用户主动关闭打字机或打字自然结束时调用。瞬间解锁所有未完结的元素与文本。
 */
const finishTyping = () => {
  // 必须先掐断所有正在运行的循环，防止其继续异步执行覆盖 DOM
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
  if (timeoutId) clearTimeout(timeoutId)

  // 延迟退出打字模式（为了让赛博进度条颜色有从容的 CSS 过渡时间）
  setTimeout(() => {
    isTypingMode.value = false
  }, 600)

  globalProgress.value = 100
  lockedHeight.value = 0
  isTyping.value = false

  if (cursorElement && cursorElement.parentNode) {
    cursorElement.parentNode.removeChild(cursorElement)
  }

  // 瞬间解锁剩余所有队列中的元素和文字
  while (actionIndex < actions.length) {
    const action = actions[actionIndex]
    if (action.type === 'reveal') {
      action.node.classList.remove('typing-hidden-block')
      action.node.classList.add('typing-reveal-block')
    } else if (action.type === 'text') {
      action.node.nodeValue = action.text
    }
    actionIndex++
  }

  // 完全展开外层玻璃背景板
  if (parentElement) {
    parentElement.style.clipPath = 'none'
    setTimeout(() => {
      if (parentElement) parentElement.style.transition = ''
    }, 300)
  }
}

/**
 * 启动打字机核心逻辑
 * @description 控制全量渲染 -> 锁定高度 -> TreeWalker 抽空内容 -> 逐帧回填 的完整生命周期。
 */
const startTyping = async () => {
  const sessionId = ++currentSessionId // 生成新的会话令牌，专治异步冲突

  cleanup()
  showProgress.value = true
  isTypingMode.value = true
  globalProgress.value = 0
  isReady.value = false
  isTyping.value = true
  lockedHeight.value = 0

  resetUnlockedHeadings()

  // 重置外部共享状态
  actions = []
  actionIndex = 0
  charIndex = 0

  // 等待 VueMarkdown 将完整的 DOM 树挂载到页面上
  await nextTick()
  await new Promise((resolve) => setTimeout(resolve, 50))

  if (sessionId !== currentSessionId) return // 如果发现号码牌过期了（说明有新的更新覆盖了），直接遗憾立场
  if (!contentRef.value || !containerRef.value) return // 如果 DOM 彻底丢了，也退出

  // 1. 高度防抖：锁定包含图片、代码块等元素的真实总高度，彻底消灭页面抖动
  lockedHeight.value = containerRef.value.clientHeight
  estimateLayoutWithPretext()

  // 2. 背景生长魔法：抓取外层背景板 (.article-content) 并施加 clip-path 初始化裁剪
  parentElement = containerRef.value.closest('.article-content') as HTMLElement
  if (parentElement) {
    parentElement.style.transition = 'clip-path 0.15s ease-out'
    // 初始状态：仅露出顶部一小截背景 (200px)
    parentElement.style.clipPath = `inset(0 0 calc(100% - 200px) 0 round 8px)`
  }

  // 3. 剥离魔法：使用 TreeWalker 收集所有 元素节点(ELEMENT) 和 文本节点(TEXT)
  const walker = document.createTreeWalker(
    contentRef.value,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const el = node as HTMLElement
          // 遇到代码块的头部 UI 控件时，直接拒收其本身及所有子节点
          // 避免了打字机去敲击“Copy”等非正文内容，以及光标钻进绝对定位/溢出隐藏容器引发的“裁剪高度回跳” Bug awa
          if (el.classList.contains('code-header')) {
            return NodeFilter.FILTER_REJECT
          }
        }
        return NodeFilter.FILTER_ACCEPT
      },
    },
  )

  let currentNode = walker.nextNode()
  while (currentNode) {
    if (currentNode.nodeType === Node.ELEMENT_NODE) {
      const el = currentNode as HTMLElement
      // 为元素穿上隐身衣，加入显影队列
      el.classList.add('typing-hidden-block')
      actions.push({ type: 'reveal', node: el })
    } else if (currentNode.nodeType === Node.TEXT_NODE) {
      const text = currentNode.nodeValue || ''
      // 过滤无意义的纯空白节点，将实心文本抽空加入打字队列
      if (text.trim().length > 0) {
        actions.push({ type: 'text', node: currentNode as Text, text })
        currentNode.nodeValue = ''
      }
    }
    currentNode = walker.nextNode()
  }

  // 4. 创建实体光标指示器
  cursorElement = document.createElement('span')
  cursorElement.className = 'typing-cursor'
  cursorElement.textContent = '<<<'

  // 此时 DOM 结构已安全成型且占好坑位，解除全局透明隐藏
  isReady.value = true

  // 若用户禁用了打字机特效，直接全量渲染
  if (!props.enabled) {
    finishTyping()
    return
  }

  let lastTime = performance.now()

  /**
   * 逐帧打字循环 (requestAnimationFrame 驱动)
   * @param {number} time - 高精度时间戳
   */
  const typeLoop = (time: number) => {
    // 帧间限流控制
    if (time - lastTime < props.speed) {
      animationFrameId = requestAnimationFrame(typeLoop)
      return
    }
    lastTime = time

    // 阶段一：瞬间执行所有的 reveal 动作，直到碰到文本节点（实现代码块、引用块等背景平滑浮现）
    while (actionIndex < actions.length && actions[actionIndex].type === 'reveal') {
      const action = actions[actionIndex] as { type: 'reveal'; node: HTMLElement }
      action.node.classList.remove('typing-hidden-block')
      action.node.classList.add('typing-reveal-block')

      // --- 如果是标题，通知全局解锁 ---
      // 因为 TreeWalker 保存了真实的 DOM 引用，即使 ID 是外部稍后注入的，
      // 等到 requestAnimationFrame 跑到这里时，DOM 上肯定已经有 ID 了
      if (/^H[1-6]$/i.test(action.node.tagName) && action.node.id) {
        unlockHeading(action.node.id)
      }

      actionIndex++
    }

    // 阶段二：执行纯文本逐字输出逻辑
    if (actionIndex < actions.length) {
      const action = actions[actionIndex] as { type: 'text'; node: Text; text: string }
      const { node, text } = action

      charIndex += props.chunkSize
      // 实时计算并更新全局进度条 (0-100)
      globalProgress.value = (actionIndex / actions.length) * 100

      if (charIndex >= text.length) {
        node.nodeValue = text
        actionIndex++
        charIndex = 0
      } else {
        node.nodeValue = text.slice(0, charIndex)
      }

      // 实时将光标元素动态跟随至当前文本节点的末尾
      if (node.parentNode && cursorElement) {
        if (node.nextSibling !== cursorElement) {
          node.parentNode.insertBefore(cursorElement, node.nextSibling)
        }
      }

      // 阶段三：视觉追踪逻辑 - 让外层玻璃背景板追踪光标的 Y 坐标向下“生长”
      if (parentElement && cursorElement) {
        const parentRect = parentElement.getBoundingClientRect()
        const cursorRect = cursorElement.getBoundingClientRect()
        // 计算光标距离背景板顶部的距离，并追加 120px 的底部留白缓冲
        const revealHeight = cursorRect.bottom - parentRect.top + 120
        parentElement.style.clipPath = `inset(0 0 calc(100% - ${revealHeight}px) 0 round 8px)`
      }

      animationFrameId = requestAnimationFrame(typeLoop)
    } else {
      // 队列执行完毕，结束动画
      finishTyping()
    }
  }

  // 根据组件配置的初始化延迟启动打字机
  timeoutId = window.setTimeout(() => {
    animationFrameId = requestAnimationFrame(typeLoop)
  }, props.initialDelay)
}

// 监听内容变化，重置并重启打字机
watch(() => props.content, startTyping, { immediate: true })

// 监听 enabled 状态，如果用户在中途突然关闭特效设置，瞬间完成所有输出！
watch(
  () => props.enabled,
  (newVal) => {
    if (!newVal && isTyping.value) {
      finishTyping()
    }
  },
)

// 组件销毁前清理所有副作用
onUnmounted(cleanup)
</script>

<style scoped>
/*
  ==========================================
  组件级基础隐身处理
  ==========================================
*/
.content-type-writer {
  position: relative;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.content-type-writer.is-ready {
  opacity: 1;
}

.content-wrapper {
  position: relative;
}

/*
  ==========================================
  渐进式节点显影
  ==========================================
*/
/* 隐身 默认完全透明且轻微下沉，阻断一切鼠标交互 */
:deep(.typing-hidden-block) {
  opacity: 0;
  transform: translateY(6px);
  pointer-events: none;
}

/* 恢复透明度与原本位置，带有符合直觉的弹性贝塞尔曲线过渡 */
:deep(.typing-reveal-block) {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
  transition:
    opacity 0.3s ease,
    transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

/*
  ==========================================
  打字机闪烁光标样式控制
  ==========================================
*/
:deep(.typing-cursor) {
  display: inline-block;
  width: auto;
  margin-left: 4px;
  color: var(--accent-color);
  font-weight: bold;
  animation: blink 1s infinite;
  vertical-align: baseline;
  pointer-events: none; /* 确保光标不会成为鼠标遮挡物，影响文字选中 */
}

@keyframes blink {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0;
  }
}
</style>
