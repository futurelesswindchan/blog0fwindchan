// frontend/src/composables/toc-pet/usePetMessage.ts
import { ref, computed, type Ref } from 'vue'
import type { PetMood, MessageChannel, MessageOutput } from './types'
import { usePetGreeting } from './usePetGreeting'

/**
 * 宠物消息仲裁系统（重构版）。
 *
 * 将消息来源拆分为三个独立通道，通过优先级仲裁器统一输出最终显示内容。
 * 各通道互不抢写，边界清晰。
 *
 * 通道优先级（从高到低）：
 * 1. urgent  — 紧急事件消息（shocked 逃跑、dizzy 晕车）
 * 2. interact — 主动交互响应（hover 回应、expand 引导）
 * 3. idle    — 被动轮播（情绪闲聊 + 时间感知氛围）
 *
 * @param currentMood 宠物当前情绪引用
 * @param isExpanded 目录展开状态引用
 * @param isHovered 鼠标悬浮状态引用
 * @returns 仲裁器输出 + 各通道写入接口 + 文案工具方法
 */
export function usePetMessage(
  currentMood: Ref<PetMood>,
  isExpanded: Ref<boolean>,
  isHovered: Ref<boolean>,
) {
  // === 三个独立通道 ===
  const urgentMsg = ref<string>('')
  const idleMsg = ref<string>('')

  // 时间感知引擎
  const { getGreeting } = usePetGreeting()

  let messageTimer: number | null = null

  // --- 情绪文案库 ---
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

  const cornerEscapeMessages = [
    '逼到死角了？！启动紧急传送！！(╯°□°)╯',
    '哇啊啊被包围了！量子隧穿！！',
    '此路不通！瞬移启动！嗖——',
    '你以为角落就能困住我？天真！',
    '紧急避险程序 OMEGA 启动！消失！',
    '死角？！不存在的！传送！',
    '啊啊啊被夹击了！空间折叠！',
    '你以为我会被困在角落吗？！不存在的！',
  ]

  // --- 文案工具方法 ---

  /**
   * 从当前情绪对应的文案池中随机抽取一条
   */
  const getRandomMessage = (): string => {
    const messages = defaultMessages[currentMood.value]
    return messages[Math.floor(Math.random() * messages.length)]
  }

  /**
   * 从死角逃生专用文案池中随机抽取一条
   */
  const getRandomCornerEscapeMessage = (): string => {
    return cornerEscapeMessages[Math.floor(Math.random() * cornerEscapeMessages.length)]
  }

  // --- 通道写入方法 ---

  /**
   * 写入紧急通道（供 escape/dizzy 模块调用）
   */
  const setUrgentMsg = (msg: string) => {
    urgentMsg.value = msg
  }

  /**
   * 清空紧急通道（事件结束后调用）
   */
  const clearUrgentMsg = () => {
    urgentMsg.value = ''
  }

  /**
   * 写入闲聊通道（供 idle/mood 切换调用）
   */
  const setIdleMsg = (msg: string) => {
    idleMsg.value = msg
  }

  // --- 交互通道（computed 派生，无需手动写入） ---
  const interactMsg = computed<string>(() => {
    if (isExpanded.value) {
      return getGreeting().expandedTitle
    }
    if (isHovered.value) {
      return getGreeting().hoverHint
    }
    return ''
  })

  // --- 仲裁器：按优先级输出最终消息 ---
  const messageOutput = computed<MessageOutput>(() => {
    // 优先级 1：紧急通道
    if (urgentMsg.value) {
      return { text: urgentMsg.value, channel: 'urgent' }
    }
    // 优先级 2：交互通道
    if (interactMsg.value) {
      return { text: interactMsg.value, channel: 'interact' }
    }
    // 优先级 3：闲聊通道
    return { text: idleMsg.value || '正在努力阅读中...', channel: 'idle' }
  })

  /** 最终显示文案（兼容旧接口） */
  const displayMessage = computed(() => messageOutput.value.text)

  /** 当前激活通道标识（供模板层选择动画） */
  const activeChannel = computed(() => messageOutput.value.channel)

  // --- 闲聊轮播定时器 ---
  const startMessageLoop = () => {
    if (messageTimer) clearInterval(messageTimer)
    idleMsg.value = getRandomMessage()
    messageTimer = window.setInterval(() => {
      // 紧急状态或展开状态下不轮播闲聊
      if (currentMood.value === 'shocked' || isExpanded.value) return
      idleMsg.value = getRandomMessage()
    }, 10000)
  }

  const stopMessageLoop = () => {
    if (messageTimer) {
      clearInterval(messageTimer)
      messageTimer = null
    }
  }

  return {
    // 仲裁器输出
    displayMessage,
    activeChannel,

    // 通道写入接口（供其他模块使用）
    setUrgentMsg,
    clearUrgentMsg,
    setIdleMsg,

    // 文案工具
    getRandomMessage,
    getRandomCornerEscapeMessage,

    // 轮播控制
    startMessageLoop,
    stopMessageLoop,
  }
}
