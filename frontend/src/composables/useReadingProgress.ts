// frontend/src/composables/useReadingProgress.ts
import { ref } from 'vue'

// 提出到模块作用域，形成单例状态（全局共享）
const globalProgress = ref(0)
const isTypingMode = ref(false)
const showProgress = ref(false)

export function useReadingProgress() {
  return {
    globalProgress,
    isTypingMode,
    showProgress,
  }
}
