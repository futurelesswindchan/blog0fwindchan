import { defineStore } from 'pinia'

export interface TypeWriterSettings {
  speed: number
  initialDelay: number
  chunkSize: number
  enabled: boolean
}

const defaultSettings: TypeWriterSettings = {
  speed: 20,
  initialDelay: 400,
  chunkSize: 1,
  enabled: true,
}

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
