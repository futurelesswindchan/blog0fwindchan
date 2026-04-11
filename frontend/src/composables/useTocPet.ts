// frontend/src/composables/useTocPet.ts
import { ref, computed, watch, onUnmounted } from 'vue'
import { useReadingProgress } from '@/composables/useReadingProgress'

/**
 * 宠物情绪枚举类型
 * @typedef {'typing' | 'reading' | 'sleepy' | 'dizzy' | 'shocked'} PetMood
 */
export type PetMood = 'typing' | 'reading' | 'sleepy' | 'dizzy' | 'shocked'

/**
 * TOC 伴读宠物状态机组合式函数
 * @description 负责管理文章侧边栏 TOC 宠物的全局情绪、展开状态以及消息轮播逻辑。
 * @returns 包含状态、计算属性及交互方法的响应式对象。
 */
export function useTocPet() {
  const { isTypingMode } = useReadingProgress()

  // --- 核心状态 ---
  const currentMood = ref<PetMood>('reading')
  const isExpanded = ref<boolean>(false)
  const customMessage = ref<string>('')
  const isHovered = ref<boolean>(false)

  // --- 情绪字典配置 ---
  const moodIconMap: Record<PetMood, string> = {
    typing: 'fa-keyboard',
    reading: 'fa-book-reader',
    sleepy: 'fa-bed',
    dizzy: 'fa-dizzy',
    shocked: 'fa-sad-cry',
  }

  const defaultMessages: Record<PetMood, string[]> = {
    typing: ['正在疯狂敲击键盘生成文章中...', '排版引擎高速运转中...'],
    reading: ['今天也是充满希望的一天！', '这段文字写得真不错呢-w-', '要不要喝杯茶歇一下？Owo'],
    sleepy: ['呼呼呼... 睡着了 zZZ', '页面好安静呀...你睡着了吗？QwQ'],
    dizzy: ['哇哇哇慢点滑，晕车啦！', '页面跑得太快了啦，吓到咱咧qwq'],
    shocked: ['你居然想关掉我！呜呜呜QAQ！'],
  }

  // 计算当前应该显示的图标
  const currentIcon = computed(() => moodIconMap[currentMood.value])

  // --- 消息处理逻辑 ---
  let messageTimer: number | null = null

  /**
   * 从当前情绪的消息库中随机抽取一条消息
   * @returns {string} 随机抽取的文本消息
   */
  const getRandomMessage = (): string => {
    const messages = defaultMessages[currentMood.value]
    const randomIndex = Math.floor(Math.random() * messages.length)
    return messages[randomIndex]
  }

  /**
   * 启动闲聊消息轮播定时器
   * @description 每隔 10 秒自动切换一次当前情绪下的随机消息。
   */
  const startMessageLoop = () => {
    if (messageTimer) clearInterval(messageTimer)
    customMessage.value = getRandomMessage()
    messageTimer = window.setInterval(() => {
      // 震惊状态或展开状态下不轮播闲聊
      if (currentMood.value === 'shocked' || isExpanded.value) return
      customMessage.value = getRandomMessage()
    }, 10000)
  }

  // 最终显示的文本逻辑
  const displayMessage = computed(() => {
    if (currentMood.value === 'shocked') {
      return defaultMessages.shocked[0]
    }
    if (isExpanded.value) {
      return '文章目录导航'
    }
    if (isHovered.value) {
      return '点击查看文章目录'
    }
    return customMessage.value || '正在努力阅读中...'
  })

  // --- 交互动作 ---

  /**
   * 触发“假关闭”受惊状态
   * @description 拦截关闭事件，强制切换为 shocked 情绪，并在 3 秒后平复。
   */
  const triggerShock = () => {
    if (currentMood.value === 'shocked') return

    const previousMood = currentMood.value
    currentMood.value = 'shocked'
    isExpanded.value = false // 受惊时强制收起目录

    setTimeout(() => {
      // 若当前情绪未被其他高优先级事件覆盖，则恢复之前的情绪
      if (currentMood.value === 'shocked') {
        currentMood.value = previousMood
        customMessage.value = getRandomMessage()
      }
    }, 3000)
  }

  /**
   * 切换目录展开/折叠状态
   * @description 受惊状态下禁止用户的展开操作。
   */
  const toggleExpand = () => {
    if (currentMood.value === 'shocked') return
    isExpanded.value = !isExpanded.value
  }

  // --- 状态监听 ---

  // 监听打字机模式：自动切换为 typing 情绪
  watch(
    isTypingMode,
    (isTyping) => {
      if (currentMood.value === 'shocked') return
      currentMood.value = isTyping ? 'typing' : 'reading'
      customMessage.value = getRandomMessage()
    },
    { immediate: true },
  )

  // 初始化启动轮播
  startMessageLoop()

  // 生命周期清理
  onUnmounted(() => {
    if (messageTimer) clearInterval(messageTimer)
  })

  return {
    currentMood,
    isExpanded,
    isHovered,
    currentIcon,
    displayMessage,
    triggerShock,
    toggleExpand,
  }
}
