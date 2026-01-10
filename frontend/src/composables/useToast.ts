import { useToastStore, type ToastType } from '@/views/stores/toastStore'

export function useToast() {
  const store = useToastStore()

  // 普通通知
  const notify = (options: {
    title?: string
    message: string
    type?: ToastType
    duration?: number
  }) => {
    store.add(options)
  }

  // 确认框
  const confirm = (message: string, title = '操作确认'): Promise<boolean> => {
    return new Promise((resolve) => {
      store.add({
        title,
        message,
        type: 'info', // 默认使用蓝色 (info)
        showConfirm: true,
        confirmText: '确定',
        cancelText: '取消',
        // 只有点击确定才 resolve(true)
        onConfirm: () => resolve(true),
        // 点击取消、关闭按钮或倒计时结束都 resolve(false)
        onCancel: () => resolve(false),
      })
    })
  }

  return { notify, confirm }
}
