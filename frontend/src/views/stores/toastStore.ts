// frontend\src\views\stores\toastStore.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'warning' | 'error' | 'info'

export interface ToastOptions {
  message: string
  type?: ToastType // 预设类型：绿、黄、红、蓝
  duration?: number // 持续时间 (ms)
  title?: string // 可选标题
}

export interface ToastItem extends ToastOptions {
  id: number
  type: ToastType
  duration: number
}

export const useToastStore = defineStore('toast', () => {
  const toasts = ref<ToastItem[]>([])

  // 添加 Toast
  const add = (options: ToastOptions) => {
    const id = Date.now() + Math.floor(Math.random() * 10000)
    const item: ToastItem = {
      id,
      message: options.message,
      title: options.title,
      type: options.type || 'info',
      duration: options.duration || 4000, // 默认 4秒
    }
    toasts.value.push(item)
  }

  // 移除 Toast
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
