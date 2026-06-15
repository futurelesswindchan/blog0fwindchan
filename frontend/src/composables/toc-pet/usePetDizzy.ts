// frontend/src/composables/toc-pet/usePetDizzy.ts
import type { Ref } from 'vue'
import type { PetMood } from './types'

/**
 * 超速晕车感应逻辑。
 *
 * 通过对滚动位移与时间的离散采样（采样频率约 20Hz），计算实时滚动视速。
 * 若瞬时速度超过 `DIZZY_SPEED_THRESHOLD`，则触发宠物的眩晕情绪。
 *
 * @param currentMood 宠物情绪引用
 * @param setMood 修改情绪的方法
 * @param isTypingMode 打字模式标记（非强制，用于晕车恢复后的状态回撤）
 * @param getRandomMessage 抽取晕车相关吐槽语的随机发生器
 * @param setUrgentMsg 写入紧急通道的方法
 * @param clearUrgentMsg 清空紧急通道的方法
 * @returns 启停滚动速率监听器的控制钩子
 */
export function usePetDizzy(
  currentMood: Ref<PetMood>,
  setMood: (mood: PetMood) => void,
  isTypingMode: Ref<boolean>,
  getRandomMessage: () => string,
  setUrgentMsg: (msg: string) => void,
  clearUrgentMsg: () => void,
) {
  let lastScrollTop = 0
  let lastScrollTime = 0
  let dizzyRecoveryTimer: number | null = null
  const DIZZY_SPEED_THRESHOLD = 12 // 测速限值(像素/毫秒)。数值越小越容易晕车

  const triggerDizzy = () => {
    // 保护机制：如果正在受惊，最高优先级不能被打断
    if (currentMood.value === 'shocked') return

    if (currentMood.value !== 'dizzy') {
      setMood('dizzy')
      setUrgentMsg(getRandomMessage())
    }

    if (dizzyRecoveryTimer) window.clearTimeout(dizzyRecoveryTimer)

    // 2秒后如果没再超速，就恢复正常
    dizzyRecoveryTimer = window.setTimeout(() => {
      if (currentMood.value === 'dizzy') {
        setMood(isTypingMode.value ? 'typing' : 'reading')
        clearUrgentMsg()
      }
    }, 2000)
  }

  const checkScrollSpeed = () => {
    const currentScrollTop = window.scrollY || document.documentElement.scrollTop
    const currentTime = performance.now()
    const timeDiff = currentTime - lastScrollTime
    // 首次调用时 timeDiff 可能极大（init 后久未滚动），此时 speed ≈ 0，不会误触 dizzy

    if (timeDiff > 50) {
      const distance = Math.abs(currentScrollTop - lastScrollTop)
      const speed = distance / timeDiff
      if (speed > DIZZY_SPEED_THRESHOLD) {
        triggerDizzy()
      }
      lastScrollTop = currentScrollTop
      lastScrollTime = currentTime
    }
  }

  const initDizzyListener = () => {
    lastScrollTime = performance.now()
    window.addEventListener('scroll', checkScrollSpeed, { passive: true })
  }

  const stopDizzyListener = () => {
    if (dizzyRecoveryTimer) window.clearTimeout(dizzyRecoveryTimer)
    window.removeEventListener('scroll', checkScrollSpeed)
  }

  return {
    initDizzyListener,
    stopDizzyListener,
  }
}
