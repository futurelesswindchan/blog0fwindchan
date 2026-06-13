// frontend/src/composables/toc-pet/index.ts
import { ref, watch, onUnmounted } from 'vue'
import { usePetMood } from './usePetMood'
import { usePetMessage } from './usePetMessage'
import { usePetIdle } from './usePetIdle'
import { usePetDizzy } from './usePetDizzy'
import { usePetEscape } from './usePetEscape'
import { usePetNavDodge } from './usePetNavDodge'

// 重导出全局防撞偏移量与类型
export { globalNavOffset } from './usePetNavDodge'
export type { PetMood } from './types'

/**
 * TOC 伴读宠物状态机主组合式函数（架构重构版）。
 *
 * 作为控制枢纽，它将情绪模块、消息系统、闲置倒计时、超速晕车计算、
 * 物理受惊逃跑算法以及全局 UI 躲避逻辑进行高层组装。
 * 旨在为文章详情页提供一个具有情绪反馈和交互趣味性的目录阅读辅助工具。
 *
 * @returns 包含宠物所有响应式状态、计算属性以及外部交互方法的闭包对象
 * @example
 * ```ts
 * const { currentMood, toggleExpand, triggerShock } = useTocPet();
 * ```
 */
export function useTocPet() {
  const isExpanded = ref<boolean>(false)
  const isHovered = ref<boolean>(false)

  // 1. 获取情绪管理器
  const { currentMood, currentIcon, setMood, isTypingMode } = usePetMood()

  // 2. 获取消息系统
  const {
    customMessage,
    displayMessage,
    getRandomMessage,
    getRandomCornerEscapeMessage,
    startMessageLoop,
    stopMessageLoop,
  } = usePetMessage(currentMood, isExpanded, isHovered)

  // 3. 获取瞌睡闲置系统
  const { resetIdleTimer, wakeUpPet, stopIdleTimer } = usePetIdle(
    currentMood,
    setMood,
    isTypingMode,
    getRandomMessage,
    customMessage,
  )

  // 4. 获取晕车系统
  const { initDizzyListener, stopDizzyListener } = usePetDizzy(
    currentMood,
    setMood,
    isTypingMode,
    getRandomMessage,
    customMessage,
  )

  // 5. 获取受惊逃走物理系统
  const { shockPosition, triggerShock, stopEscapeListener } = usePetEscape(
    currentMood,
    setMood,
    isExpanded,
    customMessage,
    getRandomMessage,
    getRandomCornerEscapeMessage,
  )

  // 6. 获取 UI 躲避系统
  const { dodgeOffset } = usePetNavDodge()

  /**
   * 切换目录展开/折叠状态
   */
  const toggleExpand = () => {
    // 受惊状态下禁止展开
    if (currentMood.value === 'shocked') return
    isExpanded.value = !isExpanded.value
  }

  // --- 打字模式联动 ---
  watch(
    isTypingMode,
    (isTyping) => {
      // 保护最高优先级状态
      if (currentMood.value === 'shocked') return
      setMood(isTyping ? 'typing' : 'reading')
      customMessage.value = getRandomMessage()
      resetIdleTimer() // 模式切换算互动，重置
    },
    { immediate: true },
  )

  // --- 生命周期与事件监听管理 ---
  const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click']

  const initGlobalListeners = () => {
    activityEvents.forEach((event) => {
      window.addEventListener(event, resetIdleTimer, { passive: true })
    })
    resetIdleTimer()
    initDizzyListener()
  }

  const destroyGlobalListeners = () => {
    stopIdleTimer()
    stopDizzyListener()
    stopEscapeListener()
    activityEvents.forEach((event) => {
      window.removeEventListener(event, resetIdleTimer)
    })
  }

  // 生命周期钩子
  startMessageLoop()
  initGlobalListeners()

  onUnmounted(() => {
    stopMessageLoop()
    destroyGlobalListeners()
  })

  // 暴露给 Vue 模板及其他业务方
  return {
    currentMood,
    isExpanded,
    isHovered,
    currentIcon,
    displayMessage,
    shockPosition,
    dodgeOffset,      // 从子系统引出
    triggerShock,
    toggleExpand,
    wakeUpPet,        // 手动唤醒 (非必需，用于自定义交互)
    customMessage,    // 如果外部需要强插播
  }
}
