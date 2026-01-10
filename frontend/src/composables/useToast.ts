// frontend\src\composables\useToast.ts
import { useToastStore, type ToastType } from '@/views/stores/toastStore'

export function useToast() {
  const store = useToastStore()

  // 新的高级 API
  const notify = (options: {
    title?: string
    message: string
    type?: ToastType
    duration?: number
  }) => {
    store.add(options)
  }

  return { notify }
}
