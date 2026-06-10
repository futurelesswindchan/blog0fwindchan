// frontend\src\composables\useMobileNav.ts
import { ref, watch, onMounted, onUnmounted } from 'vue'

/**
 * 移动端导航管理 composable
 * 负责设备检测、导航面板开关、滚动锁定
 */
export function useMobileNav() {
  const isMobile = ref(false)
  const showMobileNav = ref(false)

  let scrollPosition = 0

  const checkDevice = () => {
    isMobile.value = window.innerWidth < 768
  }

  const lockScroll = () => {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.paddingRight = `${scrollbarWidth}px`
  }

  const unlockScroll = () => {
    document.documentElement.style.overflow = ''
    document.documentElement.style.paddingRight = ''
  }

  watch(showMobileNav, (isOpen) => {
    if (isOpen) {
      scrollPosition = window.scrollY
      lockScroll()
    } else {
      unlockScroll()
      window.scrollTo(0, scrollPosition)
    }
  })

  onMounted(() => {
    checkDevice()
    window.addEventListener('resize', checkDevice)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkDevice)
    unlockScroll()
  })

  return { isMobile, showMobileNav }
}
