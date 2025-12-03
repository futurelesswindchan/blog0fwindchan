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

    const cards = el.getElementsByClassName('chapter-item')
    if (!cards.length) return

    // 缩短打字动画时长
    const typingDuration = 800 // 0.8秒打字动画（从1.2秒减少）
    const totalAnimationTime =
      delay + (cards.length - 1) * elementDelay + textDelay + typingDuration

    // 为每个卡片设置动画延迟
    Array.from(cards).forEach((card, index) => {
      const itemDelay = delay + index * elementDelay
      ;(card as HTMLElement).style.setProperty('--item-delay', `${itemDelay}ms`)

      const title = card.querySelector('h3')
      if (title) {
        // 减少文字延迟
        const textStartDelay = itemDelay + textDelay + 50 // 从100ms减少到50ms
        ;(title as HTMLElement).style.setProperty('--text-delay', `${textStartDelay}ms`)
        // 设置文字长度用于计算步进
        const textLength = (title as HTMLElement).textContent?.length || 30
        ;(title as HTMLElement).style.setProperty('--text-length', textLength.toString())

        // 添加光标元素
        const cursor = document.createElement('span')
        cursor.className = 'typing-cursor'
        cursor.textContent = '>>'
        title.appendChild(cursor)
      }
    })

    // 使用IntersectionObserver检测可见性
    const observer = new IntersectionObserver(
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

            observer.disconnect()
          }
        })
      },
      { threshold: 0.5 },
    )

    observer.observe(el)
  },
}
