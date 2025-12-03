import { type Ref } from 'vue'

export function useThrottledScrollHandler(isScrolling: Ref<boolean>) {
  let scrollTimeout: number | null = null

  const handleScroll = () => {
    isScrolling.value = true

    if (scrollTimeout) {
      window.clearTimeout(scrollTimeout)
    }

    scrollTimeout = window.setTimeout(() => {
      isScrolling.value = false
    }, 150)
  }

  return { handleScroll }
}