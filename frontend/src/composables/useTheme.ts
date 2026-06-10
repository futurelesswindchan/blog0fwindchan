// frontend\src\composables\useTheme.ts
import { ref, computed, onMounted } from 'vue'
import { useToast } from '@/composables/useToast'

/**
 * 主题管理 composable
 * 负责深色/浅色主题的切换与持久化
 */
export function useTheme() {
  const isDarkTheme = ref(false)
  const { notify } = useToast()

  const lightWallpaper = '/assets/images/wallpaper.webp'
  const darkWallpaper = '/assets/images/dark-theme-wallpaper.webp'

  const wallpaperStyle = computed(() => ({
    backgroundImage: `url(${isDarkTheme.value ? darkWallpaper : lightWallpaper})`,
    transform: 'translate3d(0,0,0)',
    backfaceVisibility: 'hidden' as const,
    willChange: 'transform',
  }))

  const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value
    localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light')
    notify({
      message: `已切换到${isDarkTheme.value ? '暗色' : '亮色'}主题了哦(/≧▽≦)/`,
      type: 'success',
    })
  }

  onMounted(() => {
    const savedTheme = localStorage.getItem('theme')
    isDarkTheme.value = savedTheme === 'dark'
  })

  return { isDarkTheme, wallpaperStyle, toggleTheme }
}
