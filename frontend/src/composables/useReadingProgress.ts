// frontend/src/composables/useReadingProgress.ts
import { ref } from 'vue'

// --- 单例状态区（全局共享） ---
const globalProgress = ref(0)
const isTypingMode = ref(false)
const showProgress = ref(false)

// 记录当前已经解锁（打字机打出来）的标题 ID 集合
// 使用 Set 可以保证 ID 不重复，且 has() 查找效率比 Array 更高哦！
const unlockedHeadingIds = ref<Set<string>>(new Set())

export function useReadingProgress() {
  // --- 状态操作方法 ---

  /**
   * 解锁单个标题 (打字机逐帧显影时调用)
   * @param id 标题的 DOM ID
   */
  const unlockHeading = (id: string) => {
    if (!id) return
    // ref 会自动将 Set 包装为响应式对象，直接 add 就能触发视图更新啦！
    unlockedHeadingIds.value.add(id)
  }

  /**
   * 一键解锁所有标题 (打字机被跳过，或全量展示时调用)
   * @param ids 所有标题 ID 的数组
   */
  const unlockAllHeadings = (ids: string[]) => {
    unlockedHeadingIds.value = new Set(ids)
  }

  /**
   * 清空所有已解锁的标题 (切换文章或重新打字时调用)
   */
  const resetUnlockedHeadings = () => {
    unlockedHeadingIds.value.clear()
  }

  return {
    globalProgress,
    isTypingMode,
    showProgress,
    unlockedHeadingIds,
    unlockHeading,
    unlockAllHeadings,
    resetUnlockedHeadings,
  }
}
