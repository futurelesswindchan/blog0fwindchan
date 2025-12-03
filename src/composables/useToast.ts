import { reactive } from 'vue'

type ToastItem = {
  id: number
  message: string
  type: string
  duration: number
  visible: boolean
}

// singleton toast list shared across app
const toasts = reactive<ToastItem[]>([])

export function useToast() {
  const addToast = (message: string, type = 'success', duration = 2200) => {
    const id = Date.now() + Math.floor(Math.random() * 10000)
    const item: ToastItem = { id, message, type, duration, visible: true }
    toasts.push(item)

    // after duration, start hide animation by setting visible=false
    setTimeout(() => {
      const t = toasts.find((x) => x.id === id)
      if (t) t.visible = false

      // wait for leave animation (matching CuteToast leave transition ~280ms) then remove
      setTimeout(() => {
        const idx = toasts.findIndex((x) => x.id === id)
        if (idx !== -1) toasts.splice(idx, 1)
      }, 320)
    }, duration)

    return id
  }

  const removeToast = (id: number) => {
    const idx = toasts.findIndex((x) => x.id === id)
    if (idx !== -1) toasts.splice(idx, 1)
  }

  return { toasts, addToast, removeToast }
}

export default useToast
