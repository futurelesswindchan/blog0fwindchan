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

  // 记录受惊时乱跑的随机坐标
  const shockPosition = ref<{ right: number; bottom: number } | null>(null)

  // --- 情绪字典配置 ---
  const moodIconMap: Record<PetMood, string> = {
    typing: 'fa-keyboard',
    reading: 'fa-book-reader',
    sleepy: 'fa-bed',
    dizzy: 'fa-dizzy',
    shocked: 'fa-ban',
  }

  const defaultMessages: Record<PetMood, string[]> = {
    typing: [
      '正在疯狂敲击键盘生成文章中...',
      '排版引擎高速运转中！嗡嗡嗡...',
      '脑机接口同步率 400%！正在下载数据...',
      '突突突！文字正在前方高能生成！',
      '量子阅读法启动，正在为您渲染宇宙...',
      '报告！捕获到野生 Markdown 标记，正在解析！',
      '键盘冒烟了啦，快给我浇点水！qwq',
      '哒哒哒，每一行代码都是爱你的形状-w-',
      '正在给文字注入赛博灵魂，请稍候...',
      '不要着急哦，好文章值得慢慢等待~',
    ],
    reading: [
      '今天也是充满希望的一天！Owo',
      '这段文字写得真不错呢，你觉得呢？-w-',
      '要不要喝杯茶歇一下？小心眼睛疲劳哦~',
      '进度条在稳步前进，你超棒的！',
      '风风酱在默默守护着你的阅读时光~',
      '盯—— (正在全神贯注陪你阅读)',
      '文章好长呀，但是有我陪你，就不会无聊啦！',
      '发现了一个有趣的知识点！快记下来！',
      '如果看累了，就看看我吧！QAQ',
      '赛博空间天气晴，适合沉浸式学习！',
      '滴滴，检测到您的专注力正在飙升！',
    ],
    sleepy: [
      '呼呼呼... 睡着了 zZZ',
      '页面好安静呀...你是不是也睡着了？QwQ',
      '梦到了好吃的电子羊...吧唧吧唧...',
      '待机模式启动，节能中...（其实就是懒）',
      '如果你拉一下滚动条，我可能就会醒哦...',
      'ZZZ... 别吵，正在梦里 Debug...',
      '电量不足 10%... 进入深度休眠...',
      '（均匀的呼吸声）... 呼... 吸...',
      '就算睡着了，我也在保护这个页面哦！',
      '起不来啦，需要一个亲亲才能开机 -3-',
    ],
    dizzy: [
      '哇哇哇慢点滑，晕车啦！@_@',
      '页面跑得太快了啦，吓到本精灵咧qwq！',
      '脑浆要被你摇匀啦！救命——',
      '刹车！快踩刹车！要撞到页脚啦！',
      '这是在开启量子跃迁模式吗？！',
      '看不清了看不清了，全都是残影！QAQ',
      '我的眼睛变成蚊香啦... 咕噜咕噜...',
      '超速警告！请系好安全带！',
      '再滑这么快，我就要吐你屏幕上了哦！',
      '感觉自己像是在洗衣机里滚筒... OTL',
    ],
    shocked: [
      '你居然想关掉我！呜呜呜QAQ！',
      '救命啊！有人要谋杀小精灵啦！QwQ',
      '哒咩！不可以点那里！我会坏掉的！',
      '呜哇哇哇，打不过我还躲不过吗，我逃！',
      '核心代码受到暴击，紧急避险程序启动！',
      '别吃我！我不好吃，我是 0 和 1 做的！',
      '我错了！我再也不偷偷摸鱼了，别关我！',
      '警告！检测到致命威胁，正在规划逃跑路线！',
      '你变了！你以前不是这样对我的！嘤嘤嘤...',
      '吓得我差点抛出一个 Uncaught Exception！',
    ],
  }

  // 计算当前应该显示的图标
  const currentIcon = computed(() => moodIconMap[currentMood.value])

  // --- 消息处理逻辑 ---
  let messageTimer: number | null = null

  // --- 跑酷定时器 ---
  let shockInterval: number | null = null

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
      return customMessage.value
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
    customMessage.value = getRandomMessage()
    isExpanded.value = false // 受惊时强制收起目录
    // 随机跑酷动作
    const runAway = () => {
      // 预留安全边距，防止跑到屏幕外面去
      const maxRight = typeof window !== 'undefined' ? window.innerWidth - 360 : 500
      const maxBottom = typeof window !== 'undefined' ? window.innerHeight - 150 : 500
      shockPosition.value = {
        right: Math.max(20, Math.floor(Math.random() * maxRight)),
        bottom: Math.max(20, Math.floor(Math.random() * maxBottom)),
      }
    }
    // 立刻跑第一步！
    runAway()
    // 每 500ms 随机瞬移一次 (类似老鼠乱窜)
    shockInterval = window.setInterval(runAway, 500)
    // 3秒后冷静下来
    setTimeout(() => {
      if (shockInterval) clearInterval(shockInterval)
      shockPosition.value = null // 乖乖回原位
      setTimeout(() => {
        if (currentMood.value === 'shocked') {
          currentMood.value = previousMood
          customMessage.value = getRandomMessage()
        }
      }, 500)
    }, 3500)
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
    if (shockInterval) clearInterval(shockInterval)
  })

  return {
    currentMood,
    isExpanded,
    isHovered,
    currentIcon,
    displayMessage,
    shockPosition,
    triggerShock,
    toggleExpand,
  }
}
