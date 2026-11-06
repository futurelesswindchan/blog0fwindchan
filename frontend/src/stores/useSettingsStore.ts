/**
 * 全局站点设置状态管理模块。
 *
 * 负责维护打字机动画、背景粒子特效、吐司通知及前后台分页容量等用户偏好配置，
 * 并在 Store 初始化及配置变更时自动与 `localStorage` 同步以实现持久化。
 */
import { defineStore } from 'pinia'

// --- 1. 类型定义 ---

/**
 * 打字机动画效果配置项。
 */
export interface TypeWriterSettings {
  /** 单帧打字间隔（单位：ms），数值越小打字越快 */
  speed: number
  /** 页面加载完成后开始打字前的等待延迟（单位：ms） */
  initialDelay: number
  /** 单次向渲染缓冲区推入的字符块大小（单位：个） */
  chunkSize: number
  /** 是否启用打字机逐字渲染动画；关闭后将直接展示完整正文 */
  enabled: boolean
}

/**
 * 背景粒子动态特效配置项。
 */
export interface ParticleSettings {
  /** 是否启用背景粒子画布渲染 */
  enabled: boolean
  /** 屏幕内同时维护的粒子数量上限 */
  count: number
  /** 粒子漂浮运动的基础速率倍率 */
  baseSpeed: number
}

/**
 * 全局吐司（Toast）消息弹窗配置项。
 */
export interface ToastSettings {
  /** 弹窗在视口中的停靠方位 */
  position: 'top-right' | 'top-left' | 'top-center' | 'bottom-right' | 'bottom-left'
  /** 消息自动消失前的默认停留时长（单位：ms） */
  duration: number
}

/**
 * 前台展示列表与后台管理表格的分页容量配置项。
 */
export interface PaginationSettings {
  /** 前台文章列表单页卡片数 */
  articles: number
  /** 前台友链列表单页卡片数 */
  friends: number
  /** 前台画廊列表单页作品数 */
  gallery: number
  /** 后台文章管理单页行数 */
  adminArticles: number
  /** 后台友链管理单页行数 */
  adminFriends: number
  /** 后台画廊管理单页行数 */
  adminGallery: number
  /** 后台计划管理单页行数 */
  adminPlans: number
  /** 后台赞助者管理单页行数 */
  adminSponsors: number
}

// --- 2. 默认设置常量 ---

/** localStorage 中用于持久化站点设置的键名 */
const STORAGE_KEY = 'blog_settings'

const defaultTypeWriterSettings: TypeWriterSettings = {
  speed: 15,
  initialDelay: 600,
  chunkSize: 3,
  enabled: true,
}

const defaultParticleSettings: ParticleSettings = {
  enabled: true,
  count: 80,
  baseSpeed: 0.5,
}

const defaultToastSettings: ToastSettings = {
  position: 'bottom-right',
  duration: 4000,
}

const defaultPaginationSettings: PaginationSettings = {
  articles: 6,
  friends: 16,
  gallery: 8,
  adminArticles: 10,
  adminFriends: 10,
  adminGallery: 8,
  adminPlans: 10,
  adminSponsors: 10,
}

// --- 3. 持久化辅助函数 ---

/**
 * 从 `localStorage` 读取并合并用户持久化的站点设置。
 *
 * 采用「默认值兜底 + 浅层展开合并」策略：即使本地缓存源自旧版本、缺失新增字段，
 * 或 JSON 内容损坏，也能安全回退至最新默认配置，避免因结构不一致导致运行时异常。
 *
 * @returns 合并后的完整设置状态对象
 */
function loadPersistedSettings() {
  const fallbackState = {
    typeWriter: { ...defaultTypeWriterSettings },
    particles: { ...defaultParticleSettings },
    pagination: { ...defaultPaginationSettings },
    toast: { ...defaultToastSettings },
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return fallbackState

    const parsed = JSON.parse(saved)
    return {
      typeWriter: parsed.typeWriter
        ? { ...defaultTypeWriterSettings, ...parsed.typeWriter }
        : fallbackState.typeWriter,
      particles: parsed.particles
        ? { ...defaultParticleSettings, ...parsed.particles }
        : fallbackState.particles,
      pagination: parsed.pagination
        ? { ...defaultPaginationSettings, ...parsed.pagination }
        : fallbackState.pagination,
      toast: parsed.toast
        ? { ...defaultToastSettings, ...parsed.toast }
        : fallbackState.toast,
    }
  } catch (e) {
    console.error('读取本地站点设置失败，已回退为默认配置:', e)
    return fallbackState
  }
}

// --- 4. Store 定义 ---

/**
 * 站点全局设置 Store。
 *
 * 初始化 `state` 时即刻从 `localStorage` 恢复配置，确保任何组件（如常驻挂载的
 * `SettingsModal`、首屏渲染的 `ParticleLayer` 与打字机组件）在首次访问时都能拿到已保存的用户偏好。
 */
export const useSettingsStore = defineStore('settings', {
  state: () => loadPersistedSettings(),

  actions: {
    /**
     * 增量更新打字机设置并同步至本地存储。
     *
     * @param settings 待覆盖的打字机配置片段
     */
    setTypeWriterSettings(settings: Partial<TypeWriterSettings>) {
      this.typeWriter = { ...this.typeWriter, ...settings }
      this.saveToLocalStorage()
    },

    /**
     * 将打字机设置恢复为默认值并同步至本地存储。
     */
    resetTypeWriterSettings() {
      this.typeWriter = { ...defaultTypeWriterSettings }
      this.saveToLocalStorage()
    },

    /**
     * 增量更新背景粒子设置并同步至本地存储。
     *
     * @param settings 待覆盖的粒子配置片段
     */
    setParticleSettings(settings: Partial<ParticleSettings>) {
      this.particles = { ...this.particles, ...settings }
      this.saveToLocalStorage()
    },

    /**
     * 将背景粒子设置恢复为默认值并同步至本地存储。
     */
    resetParticleSettings() {
      this.particles = { ...defaultParticleSettings }
      this.saveToLocalStorage()
    },

    /**
     * 增量更新前后台分页容量设置并同步至本地存储。
     *
     * @param settings 待覆盖的分页容量配置片段
     */
    setPaginationSettings(settings: Partial<PaginationSettings>) {
      this.pagination = { ...this.pagination, ...settings }
      this.saveToLocalStorage()
    },

    /**
     * 将前后台分页容量设置恢复为默认值并同步至本地存储。
     */
    resetPaginationSettings() {
      this.pagination = { ...defaultPaginationSettings }
      this.saveToLocalStorage()
    },

    /**
     * 增量更新吐司通知设置并同步至本地存储。
     *
     * @param settings 待覆盖的吐司配置片段
     */
    setToastSettings(settings: Partial<ToastSettings>) {
      this.toast = { ...this.toast, ...settings }
      this.saveToLocalStorage()
    },

    /**
     * 将吐司通知设置恢复为默认值并同步至本地存储。
     */
    resetToastSettings() {
      this.toast = { ...defaultToastSettings }
      this.saveToLocalStorage()
    },

    /**
     * 将当前 Store 中的全部设置序列化写入 `localStorage`。
     */
    saveToLocalStorage() {
      const settingsToSave = {
        typeWriter: this.typeWriter,
        particles: this.particles,
        pagination: this.pagination,
        toast: this.toast,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settingsToSave))
    },

    /**
     * 手动从 `localStorage` 重新加载并同步全部设置状态。
     */
    loadSettings() {
      const persisted = loadPersistedSettings()
      this.typeWriter = persisted.typeWriter
      this.particles = persisted.particles
      this.pagination = persisted.pagination
      this.toast = persisted.toast
    },
  },
})
