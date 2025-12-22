import { type Ref } from 'vue'

// 这里的节流滚动处理函数用于在用户滚动时更新 isScrolling 状态
export function useThrottledScrollHandler(isScrolling: Ref<boolean>) {
  let scrollTimeout: number | null = null

  // 处理滚动事件
  const handleScroll = () => {
    isScrolling.value = true

    // 清除之前的定时器
    if (scrollTimeout) {
      window.clearTimeout(scrollTimeout)
    }

    // 设置新的定时器，在用户停止滚动 150 毫秒后将 isScrolling 设为 false
    scrollTimeout = window.setTimeout(() => {
      isScrolling.value = false
    }, 150)
  }

  return { handleScroll }
}
