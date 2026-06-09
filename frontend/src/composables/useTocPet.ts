// frontend/src/composables/useTocPet.ts
import { ref, computed, watch, onUnmounted } from 'vue'
import { useReadingProgress } from '@/composables/useReadingProgress'

// 全局导航躲避偏移量 (暴露出供其他组件修改)
export const globalNavOffset = ref<number>(0)

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

  // 记录受惊时逃跑的坐标（right/bottom 定位）
  const shockPosition = ref<{ right: number; bottom: number } | null>(null)

  // --- 情绪字典配置 ---
  const moodIconMap: Record<PetMood, string> = {
    typing: 'fa-keyboard',
    reading: 'fa-book-reader',
    sleepy: 'fa-bed',
    dizzy: 'fa-bolt',
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
      '风酱在默默守护着你的阅读时光~',
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

  // region 消息处理逻辑
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

  // region 睡觉摸鱼逻辑
  let idleTimer: number | null = null // （预留）闲置状态的定时器 ID
  const IDLE_TIMEOUT = 30000 // 设定 30 秒无操作就打瞌睡

  /**
   * 退出打瞌睡状态，恢复正常阅读/打字状态
   * @description 当用户与 TOC 宠物互动时，如果它正在睡觉，就把它摇醒！
   *              受惊状态下不可被唤醒。
   */
  const wakeUpPet = () => {
    // 受惊状态是最高优先级，不可被唤醒
    if (currentMood.value === 'shocked') return
    // 如果它正在睡觉，我们就把它摇醒！
    if (currentMood.value === 'sleepy') {
      currentMood.value = isTypingMode.value ? 'typing' : 'reading'
      customMessage.value = getRandomMessage()
    }
  }

  /**
   * 重置闲置计时器
   * @description 每当用户与宠物互动时调用，重置计时器以防止它进入睡觉状态。
   * 30 秒后如果没有任何互动，就会自动切换到 sleepy 情绪。
   */
  const resetIdleTimer = () => {
    // 只要用户动了，就立刻唤醒它
    wakeUpPet()
    // 清除上一个倒计时，重新开始计时
    if (idleTimer) window.clearTimeout(idleTimer)
    idleTimer = window.setTimeout(() => {
      // 只有在普通阅读状态下才会无聊睡着！
      // 如果正在打字(typing)、受惊(shocked)、或者晕车(dizzy)，千万不能睡OAO！
      if (currentMood.value === 'reading') {
        currentMood.value = 'sleepy'
        customMessage.value = getRandomMessage()
      }
    }, IDLE_TIMEOUT)
  }

  // region 受惊逃跑逻辑（物理弹射 + 沿墙滑行 + 死角传送）

  /** 逃跑算法常量配置 */
  const ESCAPE_CONFIG = {
    ALERT_RADIUS: 30, // 警戒距离 (px)，鼠标距矩形边缘此距离内触发逃跑
    ESCAPE_DISTANCE_MIN: 50, // 最小逃跑距离 (px)
    ESCAPE_DISTANCE_MAX: 300, // 最大逃跑距离 (px)
    COOLDOWN_MS: 280, // 冷却时间 (ms)，防止高频 mousemove 抽搐
    PET_WIDTH: 400, // 宠物组件宽度 (px)，用于坐标换算
    PET_HEIGHT: 60, // 宠物组件头部高度 (px)，用于坐标换算
    BOUNDARY_PADDING: 20, // 边界安全边距 (px)
  } as const

  let isEscapeCooldown = false // 逃跑冷却锁
  let shockMouseHandler: ((e: MouseEvent) => void) | null = null // 持有监听器引用，方便清理

  /** 死角传送时的特殊台词 */
  const cornerEscapeMessages = [
    '逼到死角了？！启动紧急传送！！(╯°□°)╯',
    '哇啊啊被包围了！量子隧穿！！',
    '此路不通！瞬移启动！嗖——',
    '你以为角落就能困住我？天真！✨',
    '紧急避险程序 OMEGA 启动！消失！',
    '死角？！不存在的！传送！',
    '啊啊啊被夹击了！空间折叠！',
    '你以为我会被困在角落吗？！不存在的！',
  ]

  /**
   * 将 right/bottom 定位坐标转换为屏幕坐标系 (左上角原点)
   * @param right - CSS right 值
   * @param bottom - CSS bottom 值
   * @returns 屏幕坐标 {x, y}（宠物中心点）
   */
  const toScreenCoords = (right: number, bottom: number) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    return {
      x: vw - right - ESCAPE_CONFIG.PET_WIDTH / 2,
      y: vh - bottom - ESCAPE_CONFIG.PET_HEIGHT / 2,
    }
  }

  /**
   * 将屏幕坐标转换回 right/bottom 定位坐标
   * @param x - 屏幕 X 坐标（宠物中心点）
   * @param y - 屏幕 Y 坐标（宠物中心点）
   * @returns CSS 定位 {right, bottom}
   */
  const toPositionCoords = (x: number, y: number) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    return {
      right: vw - x - ESCAPE_CONFIG.PET_WIDTH / 2,
      bottom: vh - y - ESCAPE_CONFIG.PET_HEIGHT / 2,
    }
  }

  /**
   * 核心逃跑算法：物理反向弹射 + 沿墙滑行 + 死角传送
   * @param mouseX - 鼠标屏幕 X 坐标
   * @param mouseY - 鼠标屏幕 Y 坐标
   */
  const executeEscape = (mouseX: number, mouseY: number) => {
    if (!shockPosition.value) return

    // 1. 获取宠物当前的屏幕坐标
    const petScreen = toScreenCoords(shockPosition.value.right, shockPosition.value.bottom)

    // 2. 计算鼠标→宠物的向量角度，取反方向作为逃跑方向
    const dx = mouseX - petScreen.x
    const dy = mouseY - petScreen.y
    const angle = Math.atan2(dy, dx)

    // 3. 随机逃跑距离（在 min~max 范围内）
    const escapeDist =
      ESCAPE_CONFIG.ESCAPE_DISTANCE_MIN +
      Math.random() * (ESCAPE_CONFIG.ESCAPE_DISTANCE_MAX - ESCAPE_CONFIG.ESCAPE_DISTANCE_MIN)

    // 4. 计算理想逃跑目标点（反方向）
    let newX = petScreen.x + -Math.cos(angle) * escapeDist
    let newY = petScreen.y + -Math.sin(angle) * escapeDist

    // 5. 边界计算
    const pad = ESCAPE_CONFIG.BOUNDARY_PADDING
    const minX = pad + ESCAPE_CONFIG.PET_WIDTH / 2
    const maxX = window.innerWidth - pad - ESCAPE_CONFIG.PET_WIDTH / 2
    const minY = pad + ESCAPE_CONFIG.PET_HEIGHT / 2
    const maxY = window.innerHeight - pad - ESCAPE_CONFIG.PET_HEIGHT / 2

    // 6. 沿墙滑行：钳制超出的轴，保留另一轴的分量
    const hitLeft = newX < minX
    const hitRight = newX > maxX
    const hitTop = newY < minY
    const hitBottom = newY > maxY

    newX = Math.max(minX, Math.min(maxX, newX))
    newY = Math.max(minY, Math.min(maxY, newY))

    // 7. 死角检测：如果两个轴都撞墙了，说明被逼入绝境 → 传送到对角区域
    if ((hitLeft || hitRight) && (hitTop || hitBottom)) {
      newX = hitLeft ? maxX - Math.random() * 100 : minX + Math.random() * 100
      newY = hitTop ? maxY - Math.random() * 80 : minY + Math.random() * 80
      // 死角特殊台词
      customMessage.value =
        cornerEscapeMessages[Math.floor(Math.random() * cornerEscapeMessages.length)]
    } else {
      // 普通逃跑台词（从 shocked 消息库里随机抽）
      customMessage.value = getRandomMessage()
    }

    // 8. 转换回 right/bottom 并更新位置
    const newPos = toPositionCoords(newX, newY)
    shockPosition.value = {
      right: Math.round(newPos.right),
      bottom: Math.round(newPos.bottom),
    }
  }

  /**
   * 计算点到矩形边缘的最短距离
   * @description 将圆形警戒区域替换为"矩形等厚护盾"，
   *              使检测范围贴合宠物的实际长条形状。
   * @param px - 鼠标屏幕 X
   * @param py - 鼠标屏幕 Y
   * @param cx - 矩形中心 X
   * @param cy - 矩形中心 Y
   * @param halfW - 矩形半宽
   * @param halfH - 矩形半高
   * @returns 鼠标到矩形边缘的最短距离（在矩形内部时返回 0）
   */
  const distToRectEdge = (
    px: number,
    py: number,
    cx: number,
    cy: number,
    halfW: number,
    halfH: number,
  ): number => {
    // 取鼠标相对于矩形中心的绝对距离
    const dx = Math.abs(px - cx)
    const dy = Math.abs(py - cy)
    // 超出矩形的部分（在矩形内则为 0）
    const overX = Math.max(0, dx - halfW)
    const overY = Math.max(0, dy - halfH)
    return Math.sqrt(overX * overX + overY * overY)
  }

  /**
   * document 级别的鼠标监听处理函数
   * @description 持续监听鼠标位置，当鼠标进入宠物矩形外围的警戒区域时触发逃跑。
   */
  const handleShockMouseMove = (e: MouseEvent) => {
    if (isEscapeCooldown || !shockPosition.value) return

    // 获取宠物的屏幕中心坐标
    const petScreen = toScreenCoords(shockPosition.value.right, shockPosition.value.bottom)

    // 计算鼠标到宠物矩形边缘的最短距离
    const distance = distToRectEdge(
      e.clientX,
      e.clientY,
      petScreen.x,
      petScreen.y,
      ESCAPE_CONFIG.PET_WIDTH / 2,
      ESCAPE_CONFIG.PET_HEIGHT / 2,
    )

    // 进入警戒区域（矩形外围 ALERT_RADIUS 范围内）→ 触发逃跑！
    if (distance < ESCAPE_CONFIG.ALERT_RADIUS) {
      executeEscape(e.clientX, e.clientY)

      // 启动冷却锁，防止一帧内连续触发
      isEscapeCooldown = true
      setTimeout(() => {
        isEscapeCooldown = false
      }, ESCAPE_CONFIG.COOLDOWN_MS)
    }
  }

  /**
   * 触发"假关闭"受惊状态
   * @description 拦截关闭事件，永久切换为 shocked 情绪并开始逃跑行为。
   *              不会自动恢复，直到组件销毁并重新挂载。
   */
  const triggerShock = (event?: MouseEvent) => {
    if (currentMood.value === 'shocked') return
    currentMood.value = 'shocked'
    customMessage.value = getRandomMessage()
    isExpanded.value = false // 受惊时强制收起目录

    // 设置初始逃跑位置（从当前位置开始）
    if (!shockPosition.value) {
      shockPosition.value = { right: 20, bottom: 20 }
    }

    // 利用点击事件的鼠标坐标执行第一次弹射
    if (event) {
      executeEscape(event.clientX, event.clientY)
    } else {
      // 如果没有鼠标事件（兜底），就随机跑一步
      executeEscape(window.innerWidth / 2, window.innerHeight / 2)
    }

    // 注册 document 级别的持续逃跑监听
    shockMouseHandler = handleShockMouseMove
    document.addEventListener('mousemove', shockMouseHandler, { passive: true })
  }

  /**
   * 切换目录展开/折叠状态
   * @description 受惊状态下禁止用户的展开操作。
   */
  const toggleExpand = () => {
    if (currentMood.value === 'shocked') return
    isExpanded.value = !isExpanded.value
  }

  // region 超速晕车逻辑
  let lastScrollTop = 0 //
  let lastScrollTime = 0 //
  let dizzyRecoveryTimer: number | null = null // 晕车状态恢复的定时器 ID
  const DIZZY_SPEED_THRESHOLD = 12 // 测速限值(像素/毫秒)。数值越小越容易晕车

  /**
   * 触发晕车状态
   * @description 当检测到用户滚动速度过快时，切换到 dizzy 情绪，并在 2 秒后恢复。
   */
  const triggerDizzy = () => {
    // 保护机制：如果正在受惊(shocked)，那是最高优先级，不能被打断！
    if (currentMood.value === 'shocked') return
    // 如果还没晕，就切成晕车状态并说一句晕车台词
    if (currentMood.value !== 'dizzy') {
      currentMood.value = 'dizzy'
      customMessage.value = getRandomMessage()
    }
    // 每次触发晕车，都刷新"康复倒计时"
    if (dizzyRecoveryTimer) window.clearTimeout(dizzyRecoveryTimer)

    // 2秒后如果没再超速，就恢复正常
    dizzyRecoveryTimer = window.setTimeout(() => {
      if (currentMood.value === 'dizzy') {
        currentMood.value = isTypingMode.value ? 'typing' : 'reading'
        customMessage.value = getRandomMessage()
      }
    }, 2000)
  }

  /**
   * 检测滚动速度并触发晕车状态
   * @description 通过比较当前滚动位置与上一次的滚动位置和时间，计算滚动速度。
   * 如果速度超过设定的阈值，就触发 triggerDizzy()。
   * 为了性能考虑，增加了一个最小时间间隔（比如 50ms）来限制测速频率，避免短时间内高频触发导致性能问题或误判。
   */
  const checkScrollSpeed = () => {
    const currentScrollTop = window.scrollY || document.documentElement.scrollTop
    const currentTime = performance.now()

    const timeDiff = currentTime - lastScrollTime

    // 每隔小段时间(比如 50ms)采样一次，避免短时间高频触发导致计算爆表或为无穷大
    if (timeDiff > 50) {
      const distance = Math.abs(currentScrollTop - lastScrollTop)
      const speed = distance / timeDiff // 速度公式：v = s / t
      if (speed > DIZZY_SPEED_THRESHOLD) {
        triggerDizzy() // 超速啦！快晕！
      }
      // 更新上一次的坐标和时间，留给下一次测速用
      lastScrollTop = currentScrollTop
      lastScrollTime = currentTime
    }
  }

  //region 打字模式逻辑
  // 监听打字机模式：自动切换为 typing 情绪
  watch(
    isTypingMode,
    (isTyping) => {
      if (currentMood.value === 'shocked') return
      currentMood.value = isTyping ? 'typing' : 'reading'
      customMessage.value = getRandomMessage()

      resetIdleTimer() // 切换模式也算一次互动，重置闲置计时器
    },
    { immediate: true },
  )

  //  --- 状态监听 ---
  const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click']
  const initGlobalListeners = () => {
    // 挂机检测
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetIdleTimer, { passive: true })
    })
    resetIdleTimer()

    // 挂载测速仪
    lastScrollTime = performance.now()
    window.addEventListener('scroll', checkScrollSpeed, { passive: true })
  }

  const destroyGlobalListeners = () => {
    if (idleTimer) window.clearTimeout(idleTimer)
    if (dizzyRecoveryTimer) window.clearTimeout(dizzyRecoveryTimer) // 清理晕车定时器

    activityEvents.forEach((event) => {
      window.removeEventListener(event, resetIdleTimer)
    })

    // 卸载测速仪
    window.removeEventListener('scroll', checkScrollSpeed)

    // 卸载受惊逃跑监听器
    if (shockMouseHandler) {
      document.removeEventListener('mousemove', shockMouseHandler)
      shockMouseHandler = null
    }
  }

  // 初始化启动轮播和挂机检测
  startMessageLoop()
  initGlobalListeners()

  // 生命周期清理
  onUnmounted(() => {
    if (messageTimer) clearInterval(messageTimer)
    destroyGlobalListeners()
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
