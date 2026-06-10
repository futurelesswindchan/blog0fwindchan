// frontend\src\composables\useClock.ts
import { ref, onMounted, onUnmounted } from 'vue'

/**
 * 实时时钟 composable
 * 提供格式化的当前时间和日期，每秒更新
 */
export function useClock() {
  const currentTime = ref('')
  const currentDate = ref('')
  let intervalId: number | null = null

  const update = () => {
    const now = new Date()
    currentTime.value = new Intl.DateTimeFormat('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(now)

    currentDate.value = new Intl.DateTimeFormat('zh-CN', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    }).format(now)
  }

  onMounted(() => {
    update()
    intervalId = window.setInterval(update, 1000)
  })

  onUnmounted(() => {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
  })

  return { currentTime, currentDate }
}
