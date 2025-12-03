import { defineStore } from 'pinia'

// 类型定义
export interface TypeWriterSettings {
  speed: number
  initialDelay: number
  chunkSize: number
  enabled: boolean
}

// 默认设置
const defaultSettings: TypeWriterSettings = {
  speed: 20,
  initialDelay: 400,
  chunkSize: 1,
  enabled: true,
}

// 设置存储
export const useSettingsStore = defineStore('settings', {
  state: () => ({
    typeWriter: { ...defaultSettings },
  }),
  actions: {
    setTypeWriterSettings(settings: Partial<TypeWriterSettings>) {
      this.typeWriter = { ...this.typeWriter, ...settings }
    },
    resetTypeWriterSettings() {
      this.typeWriter = { ...defaultSettings }
    },
  },
})
