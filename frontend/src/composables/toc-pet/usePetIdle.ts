// frontend/src/composables/toc-pet/usePetIdle.ts
import type { Ref } from 'vue'
import type { PetMood } from './types'

/**
 * 闲置检测（瞌睡虫）管理模块。
 *
 * 监听页面的无操作时间。若超出预设阈值（默认 30 秒）则令宠物进入 `sleepy` 睡眠状态。
 * 打字机模式下强制屏蔽此系统（正在工作中不可打瞌睡）。
 *
 * @param currentMood 宠物当前情绪状态引用
 * @param setMood 修改情绪的受控方法
 * @param isTypingMode 是否处于流水打字文章渲染模式
 * @param getRandomMessage 抽取闲聊消息的随机发生器
 * @param customMessage 外部响应式台词槽
 * @returns 闲置状态挂载、刷新及销毁的触发钩子
 */
export function usePetIdle(
  currentMood: Ref<PetMood>,
  setMood: (mood: PetMood) => void,
  isTypingMode: Ref<boolean>,
  getRandomMessage: () => string,
  customMessage: Ref<string>,
) {
  let idleTimer: number | null = null
  const IDLE_TIMEOUT = 30000 // 设定 30 秒无操作就打瞌睡

  /**
   * 退出打瞌睡状态，恢复正常阅读/打字状态
   */
  const wakeUpPet = () => {
    // 受惊状态是最高优先级，不可被唤醒
    if (currentMood.value === 'shocked') return
    // 如果它正在睡觉，我们就把它摇醒！
    if (currentMood.value === 'sleepy') {
      setMood(isTypingMode.value ? 'typing' : 'reading')
      customMessage.value = getRandomMessage()
    }
  }

  /**
   * 重置闲置计时器
   */
  const resetIdleTimer = () => {
    // 只要用户动了，就立刻唤醒它
    wakeUpPet()
    // 清除上一个倒计时，重新开始计时
    if (idleTimer) window.clearTimeout(idleTimer)
    idleTimer = window.setTimeout(() => {
      // 设计意图：typing 表示正在生成内容，属于"活跃"状态，不应入睡
      if (currentMood.value === 'reading') {
        setMood('sleepy')
        customMessage.value = getRandomMessage()
      }
    }, IDLE_TIMEOUT)
  }

  const stopIdleTimer = () => {
    if (idleTimer) window.clearTimeout(idleTimer)
  }

  return {
    resetIdleTimer,
    wakeUpPet,
    stopIdleTimer,
  }
}
