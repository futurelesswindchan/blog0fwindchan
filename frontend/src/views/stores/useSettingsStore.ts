import { defineStore } from 'pinia'

// --- 1. 类型定义 ---

// 打字机效果设置
export interface TypeWriterSettings {
  speed: number
  initialDelay: number
  chunkSize: number
  enabled: boolean
}

// 消息弹窗设置
export interface ToastSettings {
  position: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-left'
  duration: number
}

// 分页设置
export interface PaginationSettings {
  articles: number
  friends: number
  gallery: number
  adminArticles: number
  adminFriends: number
  adminGallery: number
}

// --- 2. 默认设置常量 ---

// 默认打字机效果设置
const defaultTypeWriterSettings: TypeWriterSettings = {
  speed: 20,
  initialDelay: 400,
  chunkSize: 3,
  enabled: true,
}

// 默认弹窗设置
const defaultToastSettings: ToastSettings = {
  position: 'bottom-left',
  duration: 4000,
}

// 默认分页设置
const defaultPaginationSettings: PaginationSettings = {
  articles: 6,
  friends: 4,
  gallery: 8,
  adminArticles: 10,
  adminFriends: 10,
  adminGallery: 8,
}

// --- 3. Store 定义 ---

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    typeWriter: { ...defaultTypeWriterSettings },
    pagination: { ...defaultPaginationSettings },
    toast: { ...defaultToastSettings },
  }),

  actions: {
    // ... TypeWriter Actions ...
    setTypeWriterSettings(settings: Partial<TypeWriterSettings>) {
      this.typeWriter = { ...this.typeWriter, ...settings }
      this.saveToLocalStorage()
    },
    resetTypeWriterSettings() {
      this.typeWriter = { ...defaultTypeWriterSettings }
      this.saveToLocalStorage()
    },

    // ... Pagination Actions ...
    setPaginationSettings(settings: Partial<PaginationSettings>) {
      this.pagination = { ...this.pagination, ...settings }
      this.saveToLocalStorage()
    },
    resetPaginationSettings() {
      this.pagination = { ...defaultPaginationSettings }
      this.saveToLocalStorage()
    },

    // ... Toast Actions ...
    setToastSettings(settings: Partial<ToastSettings>) {
      this.toast = { ...this.toast, ...settings }
      this.saveToLocalStorage()
    },
    resetToastSettings() {
      this.toast = { ...defaultToastSettings }
      this.saveToLocalStorage()
    },

    // --- 持久化逻辑 ---
    saveToLocalStorage() {
      const settingsToSave = {
        typeWriter: this.typeWriter,
        pagination: this.pagination,
        toast: this.toast, // 保存
      }
      localStorage.setItem('blog_settings', JSON.stringify(settingsToSave))
    },

    loadSettings() {
      const saved = localStorage.getItem('blog_settings')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          if (parsed.typeWriter)
            this.typeWriter = { ...defaultTypeWriterSettings, ...parsed.typeWriter }
          if (parsed.pagination)
            this.pagination = { ...defaultPaginationSettings, ...parsed.pagination }
          // 加载
          if (parsed.toast) this.toast = { ...defaultToastSettings, ...parsed.toast }
        } catch (e) {
          console.error('读取设置失败，已重置为默认', e)
        }
      }
    },
  },
})
