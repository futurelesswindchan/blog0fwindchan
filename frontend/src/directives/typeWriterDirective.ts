// frontend/src/directives/typeWriterDirective.ts
import { type Directive } from 'vue'
import type { DirectiveBinding } from 'vue'

/**
 * 打字机动画的配置选项参数
 * @interface TypeWriterOptions
 */
interface TypeWriterOptions {
  /** 全局打字速度调节（预留字段） */
  speed?: number
  /** 整体动画触发的初始延迟时间（毫秒），默认 150ms */
  delay?: number
  /** 动画生效模式：'text'(仅文本) | 'element'(仅元素) | 'both'(两者皆有)，默认 'both' */
  mode?: 'text' | 'element' | 'both'
  /** 各个子元素（卡片）依次出现的间隔延迟（毫秒），默认 200ms */
  elementDelay?: number
  /** 文本打字动画相对元素出现的额外延迟（毫秒），默认 100ms */
  textDelay?: number
}

/**
 * 初始化或重置打字机动画逻辑
 * 负责清理旧状态、计算并注入 CSS 动画变量（延迟时间、文本长度），以及通过定时器顺序触发类名切换。
 * 抽离此函数的目的是为了在 mounted 和 updated 生命周期中高效复用。
 *
 * @param {HTMLElement} el - 绑定指令的父级 DOM 容器
 * @param {DirectiveBinding<TypeWriterOptions>} binding - Vue 指令绑定对象，包含用户传入的配置参数
 */
const initAnimation = (el: HTMLElement, binding: DirectiveBinding<TypeWriterOptions>) => {
  // 每次触发前，先洗掉旧的动画状态类名。
  // 这对于前端单页应用中的分页切换、搜索过滤等动态渲染场景至关重要！✨
  el.classList.remove('typing-element', 'typing-text', 'typing-complete', 'typing-paused')

  // 获取用户配置，若无则使用空对象，后续解构出默认值
  const options = binding.value || {}
  const { delay = 150, mode = 'both', elementDelay = 200, textDelay = 100 } = options

  // 获取所有需要执行动画的章节卡片元素
  const cards = Array.from(el.getElementsByClassName('chapter-item')) as HTMLElement[]
  if (!cards.length) return

  // 预设打字动画的基础持续时间（需与 CSS 中设定的 transition/animation 时间保持一致）
  const typingDuration = 800
  // 计算整个列表动画执行完毕所需的总时长，用于最后打上 complete 标记
  const totalAnimationTime = delay + (cards.length - 1) * elementDelay + textDelay + typingDuration

  // 遍历卡片，为每个卡片及内部标题动态计算并设置级联的动画延迟与参数
  cards.forEach((card, index) => {
    // 1. 计算当前卡片元素的出现延迟，并作为 CSS 变量注入
    const itemDelay = delay + index * elementDelay
    card.style.setProperty('--item-delay', `${itemDelay}ms`)

    const title = card.querySelector('h3')
    if (title) {
      // 2. 文本打字动画在卡片出现后的一段时间触发
      const textStartDelay = itemDelay + textDelay + 50
      ;(title as HTMLElement).style.setProperty('--text-delay', `${textStartDelay}ms`)

      // 3. 获取文本长度以计算打字动画的步数 (steps)，默认保底为 30
      const textLength = (title as HTMLElement).textContent?.length || 30
      ;(title as HTMLElement).style.setProperty('--text-length', textLength.toString())

      // 4. 动态注入打字光标元素（若尚未注入）
      if (!title.querySelector('.typing-cursor')) {
        const cursor = document.createElement('span')
        cursor.className = 'typing-cursor'
        cursor.textContent = '<<'
        title.appendChild(cursor)
      }
    }

    // 确保卡片在动画进行中或完成后依然可以响应用户的鼠标交互
    card.style.pointerEvents = 'auto'
  })

  // 摒弃 IntersectionObserver，采用 setTimeout 直接触发，提升在快速渲染场景下的稳定性
  // 延迟 50ms 给予浏览器重排/重绘的呼吸时间
  setTimeout(() => {
    if (mode === 'element' || mode === 'both') {
      el.classList.add('typing-element')
    }
  }, 50)

  // 触发纯文本的打字动画类名
  setTimeout(() => {
    if (mode === 'text' || mode === 'both') {
      el.classList.add('typing-text')
    }
  }, delay + textDelay)

  // 整个列表的动画全部跑完后，打上完成标记，方便 CSS 进行最终状态的固化
  setTimeout(() => {
    el.classList.add('typing-complete')
  }, totalAnimationTime)
}

/**
 * 导出 Vue 自定义指令配置对象 vTypeWriter
 * @type {Directive<HTMLElement, TypeWriterOptions>}
 */
export const vTypeWriter: Directive<HTMLElement, TypeWriterOptions> = {
  /**
   * 元素挂载到 DOM 时触发
   * 执行初次动画初始化，并利用事件委托绑定交互事件
   *
   * @param {HTMLElement} el - 绑定的 DOM 元素
   * @param {DirectiveBinding<TypeWriterOptions>} binding - 绑定的值
   */
  mounted(el, binding) {
    initAnimation(el, binding)

    // 交互事件回调定义
    const pauseClass = 'typing-paused'
    const onMouseEnter = () => el.classList.add(pauseClass)
    const onMouseLeave = () => el.classList.remove(pauseClass)

    /**
     * 处理卡片的点击跳转逻辑
     * @param {Event} evt - 原生事件对象
     */
    const onClick = (evt: Event) => {
      const card = evt.currentTarget as HTMLElement
      const anchor = card.querySelector('a[href]') as HTMLAnchorElement | null

      // 优先通过子级 <a> 标签的 href 跳转，否则尝试读取 data-href 属性
      if (anchor && anchor.href) {
        window.location.href = anchor.href
        return
      }
      const href = card.dataset.href
      if (href) {
        window.location.href = href
      }
    }

    // 采用事件委托模式将事件挂载到父容器 `el` 上。
    // 这样不仅性能更好，而且内部卡片节点动态刷新时无需重新绑定事件！
    el.addEventListener('mouseover', (e) => {
      if ((e.target as Element).closest('.chapter-item')) onMouseEnter()
    })
    el.addEventListener('mouseout', (e) => {
      if ((e.target as Element).closest('.chapter-item')) onMouseLeave()
    })
    el.addEventListener('click', (e) => {
      const card = (e.target as Element).closest('.chapter-item')
      if (card) onClick({ currentTarget: card } as unknown as Event)
    })
  },

  /**
   * 组件更新（如状态变更导致重新渲染）时触发
   * 例如：列表数据由于搜索、分页切换等操作发生变化时，重新触发帅气的动画！
   *
   * @param {HTMLElement} el - 绑定的 DOM 元素
   * @param {DirectiveBinding<TypeWriterOptions>} binding - 绑定的值
   */
  updated(el, binding) {
    // 使用 requestAnimationFrame 确保在 Vue 的 Virtual DOM 真正映射到真实 DOM 之后，
    // 再进行卡片节点的获取和动画计算，避免拿到旧的 DOM 节点。
    requestAnimationFrame(() => {
      initAnimation(el, binding)
    })
  },
}
