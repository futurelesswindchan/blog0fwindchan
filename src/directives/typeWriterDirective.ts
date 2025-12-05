import { type Directive } from 'vue'

interface TypeWriterOptions {
  speed?: number
  delay?: number
  mode?: 'text' | 'element' | 'both' // 添加模式选项
  elementDelay?: number // 元素动画延迟
  textDelay?: number // 文字动画延迟
}

export const vTypeWriter: Directive<HTMLElement, TypeWriterOptions> = {
  mounted(el, binding) {
    const options = binding.value || {}
    const { delay = 150, mode = 'both', elementDelay = 200, textDelay = 100 } = options

    const cards = Array.from(el.getElementsByClassName('chapter-item')) as HTMLElement[]
    if (!cards.length) return

    // 缩短打字动画时长
    const typingDuration = 800 // 0.8秒打字动画
    const totalAnimationTime =
      delay + (cards.length - 1) * elementDelay + textDelay + typingDuration

    // 为每个卡片设置动画延迟
    cards.forEach((card, index) => {
      const itemDelay = delay + index * elementDelay
      card.style.setProperty('--item-delay', `${itemDelay}ms`)

      const title = card.querySelector('h3')
      if (title) {
        const textStartDelay = itemDelay + textDelay + 50
        ;(title as HTMLElement).style.setProperty('--text-delay', `${textStartDelay}ms`)
        const textLength = (title as HTMLElement).textContent?.length || 30
        ;(title as HTMLElement).style.setProperty('--text-length', textLength.toString())

        // 添加光标元素（如果还没有）
        if (!title.querySelector('.typing-cursor')) {
          const cursor = document.createElement('span')
          cursor.className = 'typing-cursor'
          cursor.textContent = '>>'
          title.appendChild(cursor)
        }
      }

      // 确保卡片可交互（覆盖旧的全局 pointer-events: none）
      card.style.pointerEvents = 'auto'
    })

    // 使用IntersectionObserver检测可见性
    let observer: IntersectionObserver | null = null

    observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (mode === 'element' || mode === 'both') {
              el.classList.add('typing-element')
            }

            setTimeout(() => {
              if (mode === 'text' || mode === 'both') {
                el.classList.add('typing-text')
              }
            }, delay + textDelay)

            // 所有动画完成后添加完成类名
            setTimeout(() => {
              el.classList.add('typing-complete')
            }, totalAnimationTime)

            observer?.disconnect()
          }
        })
      },
      { threshold: 0.5 },
    )

    observer.observe(el)

    // 交互优先：悬停暂停动画，点击立即跳转
    const pauseClass = 'typing-paused'

    const onMouseEnter = () => {
      el.classList.add(pauseClass)
    }
    const onMouseLeave = () => {
      el.classList.remove(pauseClass)
    }

    const onClick = (evt: Event) => {
      // 立即跳转：优先查找内部链接 <a href="...">，否则使用 data-href
      const card = evt.currentTarget as HTMLElement
      const anchor = card.querySelector('a[href]') as HTMLAnchorElement | null
      if (anchor && anchor.href) {
        // 直接写 location，保证绕过动画/其他拦截
        window.location.href = anchor.href
        return
      }
      const href = card.dataset.href
      if (href) {
        window.location.href = href
      }
    }

    // 绑定事件
    cards.forEach((card) => {
      card.addEventListener('mouseenter', onMouseEnter)
      card.addEventListener('mouseleave', onMouseLeave)
      card.addEventListener('click', onClick)
    })

    // 保存引用供 unmounted 时清理
    ;(
      el as {
        __vTypeWriterCleanup?: {
          observer: IntersectionObserver | null
          cards: HTMLElement[]
          onMouseEnter: () => void
          onMouseLeave: () => void
          onClick: (evt: Event) => void
        }
      }
    ).__vTypeWriterCleanup = {
      observer,
      cards,
      onMouseEnter,
      onMouseLeave,
      onClick,
    }
  },

  unmounted(el) {
    const data = (
      el as {
        __vTypeWriterCleanup?: {
          observer: IntersectionObserver | null
          cards: HTMLElement[]
          onMouseEnter: () => void
          onMouseLeave: () => void
          onClick: (evt: Event) => void
        }
      }
    ).__vTypeWriterCleanup
    if (!data) return
    const { observer, cards, onMouseEnter, onMouseLeave, onClick } = data
    if (observer && typeof observer.disconnect === 'function') {
      observer.disconnect()
    }
    if (Array.isArray(cards)) {
      cards.forEach((card: HTMLElement) => {
        card.removeEventListener('mouseenter', onMouseEnter)
        card.removeEventListener('mouseleave', onMouseLeave)
        card.removeEventListener('click', onClick)
      })
    }
    delete (
      el as {
        __vTypeWriterCleanup?: {
          observer: IntersectionObserver | null
          cards: HTMLElement[]
          onMouseEnter: () => void
          onMouseLeave: () => void
          onClick: (evt: Event) => void
        }
      }
    ).__vTypeWriterCleanup
  },
}
