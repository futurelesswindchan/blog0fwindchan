import { defineStore } from 'pinia'

// --- 1. 类型定义 ---

export interface TypeWriterSettings {
  speed: number
  initialDelay: number
  chunkSize: number
  enabled: boolean
}

// 分页设置接口
export interface PaginationSettings {
  itemsPerPage: number
}

// --- 2. 默认设置常量 ---

const defaultTypeWriterSettings: TypeWriterSettings = {
  speed: 20,
  initialDelay: 400,
  chunkSize: 3,
  enabled: true,
}

// 默认分页设置
const defaultPaginationSettings: PaginationSettings = {
  itemsPerPage: 6,
}

// --- 3. Store 定义 ---

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    // 打字机设置
    typeWriter: { ...defaultTypeWriterSettings },
    // 分页设置
    pagination: { ...defaultPaginationSettings },
  }),

  actions: {
    // --- 打字机相关 Action ---
    setTypeWriterSettings(settings: Partial<TypeWriterSettings>) {
      this.typeWriter = { ...this.typeWriter, ...settings }
      this.saveToLocalStorage() // 保存更改
    },

    resetTypeWriterSettings() {
      this.typeWriter = { ...defaultTypeWriterSettings }
      this.saveToLocalStorage() // 保存更改
    },

    // --- 分页相关 Action ---
    setPaginationSettings(settings: Partial<PaginationSettings>) {
      this.pagination = { ...this.pagination, ...settings }
      this.saveToLocalStorage() // 保存更改
    },

    resetPaginationSettings() {
      this.pagination = { ...defaultPaginationSettings }
      this.saveToLocalStorage() // 保存更改
    },

    // ---  持久化逻辑 ---
    // 将当前所有设置保存到浏览器缓存
    saveToLocalStorage() {
      const settingsToSave = {
        typeWriter: this.typeWriter,
        pagination: this.pagination,
      }
      localStorage.setItem('blog_settings', JSON.stringify(settingsToSave))
    },

    // 从浏览器缓存加载设置
    loadSettings() {
      const saved = localStorage.getItem('blog_settings')
      if (saved) {
        try {
          const parsed = JSON.parse(saved)
          // 合并保存的设置，保留默认值以防旧数据缺少新字段
          if (parsed.typeWriter) {
            this.typeWriter = { ...this.typeWriter, ...parsed.typeWriter }
          }
          if (parsed.pagination) {
            this.pagination = { ...this.pagination, ...parsed.pagination }
          }
        } catch (e) {
          console.error('读取设置失败，已重置为默认', e)
        }
      }
    },
  },
})
