// frontend/src/composables/toc-pet/usePetMood.ts
import { ref, computed } from 'vue'
import type { PetMood } from './types'
import { useReadingProgress } from '@/composables/useReadingProgress'

/**
 * 宠物情绪状态机（大脑中枢）。
 *
 * 专门维护单一的 `currentMood` 状态通道，映射出对应的 UI 图标配置，
 * 并对非常规状态（如 `shocked`）执行状态互斥与越权拦截。
 *
 * @returns 包含当前情绪读写通道与图标映射字典
 */
export function usePetMood() {
  const { isTypingMode } = useReadingProgress()
  const currentMood = ref<PetMood>('reading')

  // --- 情绪字典配置 ---
  const moodIconMap: Record<PetMood, string> = {
    typing: 'fa-keyboard',
    reading: 'fa-book-reader',
    sleepy: 'fa-bed',
    dizzy: 'fa-bolt',
    shocked: 'fa-ban',
  }

  // 计算当前应该显示的图标
  const currentIcon = computed(() => moodIconMap[currentMood.value])

  /**
   * 切换情绪状态
   */
  const setMood = (newMood: PetMood) => {
    if (currentMood.value === 'shocked' && newMood !== 'shocked') {
      return // 受惊是最高优先级，不可被覆盖
    }
    currentMood.value = newMood
  }

  return {
    currentMood,
    currentIcon,
    setMood,
    isTypingMode,
  }
}
