import { useToastStore, type ToastType } from '@/views/stores/toastStore'

/**
 * Toast 提示与确认对话框组合式函数 (Composable)
 *
 * 封装了全局的 Toast 通知与确认弹窗逻辑，方便在任意组件或普通函数中快速调用。
 * 底层依赖于 `useToastStore` 进行跨组件的状态管理。
 *
 * @returns {Object} 包含通知和确认核心方法的对象。
 * @property {Function} notify - 触发普通的全局消息提示。
 * @property {Function} confirm - 触发带有确认/取消按钮的对话框，并返回 Promise。
 */
export function useToast() {
  const store = useToastStore()

  /**
   * 触发一个普通的 Toast 通知提示。
   *
   * @param {Object} options - 通知配置项。
   * @param {string} [options.title] - 通知的标题（可选）。
   * @param {string} options.message - 通知的主体内容。
   * @param {ToastType} [options.type] - 通知的类型（如 'success', 'error', 'info', 'warning' 等，可选）。
   * @param {number} [options.duration] - 通知的显示时长（毫秒，可选）。若不传则使用 store 默认值。
   */
  const notify = (options: {
    title?: string
    message: string
    type?: ToastType
    duration?: number
  }) => {
    store.add(options)
  }

  /**
   * 触发一个交互式的确认对话框，并等待用户操作。
   *
   * 采用 Promise 封装，可以配合 async/await 优雅地处理异步确认逻辑。
   * 只有当用户显式点击“确定”按钮时，才会 resolve(true)；
   * 若用户点击“取消”、点击关闭按钮或等待弹窗倒计时结束，均会 resolve(false)。
   *
   * @param {string} message - 确认对话框的主体提示信息。
   * @param {string} [title='操作确认'] - 确认对话框的标题，默认为“操作确认”。
   * @returns {Promise<boolean>} 返回一个布尔值的 Promise，代表用户是否确认该操作。
   */
  const confirm = (message: string, title = '操作确认'): Promise<boolean> => {
    return new Promise((resolve) => {
      store.add({
        title,
        message,
        type: 'info', // 默认使用蓝色 (info) 样式作为确认框基调
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
