import { reactive } from 'vue'

type ToastItem = {
  id: number
  message: string
  type: string
  duration: number
  visible: boolean
}

// 全局的 toast 列表
const toasts = reactive<ToastItem[]>([])

// 使用 useToast 组合函数来管理 toast 的添加和移除
export function useToast() {
  const addToast = (message: string, type = 'success', duration = 2200) => {
    const id = Date.now() + Math.floor(Math.random() * 10000)
    const item: ToastItem = { id, message, type, duration, visible: true }
    toasts.push(item)

    // 设置定时器在 duration 毫秒后隐藏并移除 toast
    setTimeout(() => {
      const t = toasts.find((x) => x.id === id)
      if (t) t.visible = false

      // 等待离开动画（与 CuteToast 离开过渡动画约 280 毫秒匹配）后移除
      setTimeout(() => {
        const idx = toasts.findIndex((x) => x.id === id)
        if (idx !== -1) toasts.splice(idx, 1)
      }, 320)
    }, duration)

    return id
  }

  // 移除指定的 toast
  const removeToast = (id: number) => {
    const idx = toasts.findIndex((x) => x.id === id)
    if (idx !== -1) toasts.splice(idx, 1)
  }

  return { toasts, addToast, removeToast }
}

export default useToast
