// src/views/stores/imageLayoutStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useImageLayoutStore = defineStore('imageLayout', () => {
  // 模态框显示状态
  const showModal = ref(false)
  const pendingImageUrl = ref('')
  const selectedLayout = ref('auto')
  const imageSize = ref(30)
  const onConfirmCallback = ref<((layoutId: string, size: number) => void) | null>(null)

  /**
   * 排版方式对应的默认尺寸（单位：rem）
   */
  const layoutDefaultSizes: Record<string, number> = {
    auto: 30,
    full: 100,
    inline: 8,
    left: 15,
    right: 15,
  }

  /**
   * 各排版方式的尺寸范围（单位：rem）
   */
  const sizeRanges: Record<string, { min: number; max: number }> = {
    auto: { min: 15, max: 50 },
    inline: { min: 4, max: 16 },
    left: { min: 10, max: 25 },
    right: { min: 10, max: 25 },
  }

  /**
   * 打开图片排版选择模态框
   * @param url - 待插入的图片 URL
   * @param callback - 用户确认选择时的回调函数
   */
  const openModal = (url: string, callback?: (layoutId: string, size: number) => void) => {
    pendingImageUrl.value = url
    selectedLayout.value = 'auto'
    imageSize.value = layoutDefaultSizes['auto']
    if (callback) onConfirmCallback.value = callback
    showModal.value = true
  }

  /**
   * 关闭模态框并重置状态
   */
  const closeModal = () => {
    showModal.value = false
    pendingImageUrl.value = ''
    selectedLayout.value = 'auto'
    imageSize.value = 30
    onConfirmCallback.value = null
  }

  /**
   * 处理排版方式选择
   * 触发回调并关闭模态框
   * @param layoutId - 选择的排版方式 ID
   */
  const confirmSelection = (layoutId: string) => {
    if (onConfirmCallback.value) onConfirmCallback.value(layoutId, imageSize.value)
    closeModal()
  }

  /**
   * 切换排版方式并更新对应的默认尺寸
   * @param layoutId - 排版方式 ID
   */
  const switchLayout = (layoutId: string) => {
    selectedLayout.value = layoutId
    imageSize.value = layoutDefaultSizes[layoutId]
  }

  return {
    showModal,
    pendingImageUrl,
    selectedLayout,
    imageSize,
    layoutDefaultSizes,
    sizeRanges,
    openModal,
    closeModal,
    confirmSelection,
    switchLayout,
  }
})
