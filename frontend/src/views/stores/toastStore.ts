import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useSettingsStore } from './useSettingsStore'

export type ToastType = 'success' | 'warning' | 'error' | 'info'

export interface ToastOptions {
  message: string
  type?: ToastType
  duration?: number
  title?: string
  showConfirm?: boolean
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

export interface ToastItem extends ToastOptions {
  id: number
  type: ToastType
  duration: number
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastItem[]>([])

  //在 Action 中获取 SettingsStore 实例
  // 注意：不能在 setup 顶层获取，因为可能造成循环依赖或 Pinia 未初始化
  // 必须在 add 函数内部获取

  const add = (options: ToastOptions) => {
    const settingsStore = useSettingsStore() //获取全局设置

    const id = Date.now() + Math.floor(Math.random() * 10000)

    // 优先级：调用时传入 > 确认框默认0 > 全局设置默认值
    let finalDuration = options.duration
    if (finalDuration === undefined) {
      if (options.showConfirm) {
        finalDuration = 0
      } else {
        finalDuration = settingsStore.toast.duration //使用全局配置
      }
    }

    const item: ToastItem = {
      id,
      message: options.message,
      title: options.title,
      type: options.type || 'info',
      duration: finalDuration,
      showConfirm: options.showConfirm,
      confirmText: options.confirmText,
      cancelText: options.cancelText,
      onConfirm: options.onConfirm,
      onCancel: options.onCancel,
    }
    toasts.value.push(item)
  }

  const remove = (id: number) => {
    const index = toasts.value.findIndex((t) => t.id === id)
    if (index !== -1) {
      toasts.value.splice(index, 1)
    }
  }

  return {
    toasts,
    add,
    remove,
  }
})
