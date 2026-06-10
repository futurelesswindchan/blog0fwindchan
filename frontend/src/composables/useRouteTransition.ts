// frontend\src\composables\useRouteTransition.ts
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'

/**
 * 路由过渡动画 composable
 * 根据路由深度变化决定页面切换方向
 */
export function useRouteTransition() {
  const route = useRoute()
  const transitionName = ref('fade')

  watch(
    () => route.path,
    (to, from) => {
      const toDepth = to.split('/').length
      const fromDepth = from.split('/').length
      transitionName.value = toDepth < fromDepth ? 'slide-right' : 'slide-left'
    },
  )

  return { transitionName }
}
