/**
 * 全局站点设置状态管理模块。
 *
 * 负责维护打字机动画、背景粒子特效、吐司通知及前后台分页容量等用户偏好配置，
 * 并在 Store 初始化及配置变更时自动与 localStorage 同步以实现持久化。
 *
 * 持久化策略采用「按分组 read-merge-write」：每次只更新自己负责的一组设置，
 * 避免多标签页同时操作时互相覆盖；同时监听 storage 事件实现跨标签页实时同步。
 */
import { defineStore } from 'pinia'
import { ref, onScopeDispose } from 'vue'

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
 * 从 localStorage 读取并合并用户持久化的站点设置。
 *
 * 采用「默认值兜底 + 浅层展开合并」策略：即使本地缓存源自旧版本、缺失新增字段，
 * 或 JSON 内容损坏，也能安全回退至最新默认配置，避免因结构不一致导致运行时异常。
 *
 * @returns 合并后的完整设置状态对象
 */
function loadPersistedSettings() {
  const fallback = {
    typeWriter: { ...defaultTypeWriterSettings },
    particles: { ...defaultParticleSettings },
    pagination: { ...defaultPaginationSettings },
    toast: { ...defaultToastSettings },
  }

  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return fallback

    const parsed = JSON.parse(saved)
    if (!parsed || typeof parsed !== 'object') return fallback

    return {
      typeWriter: parsed.typeWriter
        ? { ...defaultTypeWriterSettings, ...parsed.typeWriter }
        : fallback.typeWriter,
      particles: parsed.particles
        ? { ...defaultParticleSettings, ...parsed.particles }
        : fallback.particles,
      pagination: parsed.pagination
        ? { ...defaultPaginationSettings, ...parsed.pagination }
        : fallback.pagination,
      toast: parsed.toast
        ? { ...defaultToastSettings, ...parsed.toast }
        : fallback.toast,
    }
  } catch (e) {
    console.error('读取本地站点设置失败，已回退为默认配置:', e)
    return fallback
  }
}

/**
 * 按分组将单组设置写入 localStorage（read-merge-write）。
 *
 * 每次只覆盖指定的 `groupKey` 分组，其余分组保持 localStorage 中的现有值不变。
 * 这样即使多个标签页同时操作不同分组，也不会互相覆盖对方刚保存的设置。
 *
 * @param groupKey 要写入的分组键名（如 `'particles'`、`'typeWriter'`）
 * @param value 该分组的完整设置对象
 */
function persistGroup(groupKey: string, value: unknown) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const current = raw ? JSON.parse(raw) : {}
    current[groupKey] = value
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch (e) {
    // 隐私模式或配额满时 setItem 会抛 DOMException，
    // 静默降级：本次变更仅在当前页面会话内生效，刷新后丢失
    console.warn('站点设置写入 localStorage 失败，本次变更仅在当前页面生效:', e)
  }
}

// --- 4. Store 定义 ---

/**
 * 站点全局设置 Store（Setup 风格）。
 *
 * 初始化时即刻从 localStorage 恢复配置，并注册 `storage` 事件监听器
 * 以实现跨标签页实时同步。任何组件在首次访问时都能拿到已保存的用户偏好。
 */
export const useSettingsStore = defineStore('settings', () => {
  const initial = loadPersistedSettings()

  const typeWriter = ref<TypeWriterSettings>(initial.typeWriter)
  const particles = ref<ParticleSettings>(initial.particles)
  const pagination = ref<PaginationSettings>(initial.pagination)
  const toast = ref<ToastSettings>(initial.toast)

  // --- 跨标签页同步 ---

  /**
   * 监听其他标签页对 localStorage 的写入，自动将变更同步至当前页面内存状态。
   *
   * NOTE: `storage` 事件仅在**其他**标签页写入时触发，不会在当前页面自身写入时触发，
   * 因此不会形成无限循环。
   */
  const onStorageChange = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return
    try {
      const parsed = JSON.parse(e.newValue)
      if (parsed.typeWriter)
        typeWriter.value = { ...defaultTypeWriterSettings, ...parsed.typeWriter }
      if (parsed.particles)
        particles.value = { ...defaultParticleSettings, ...parsed.particles }
      if (parsed.pagination)
        pagination.value = { ...defaultPaginationSettings, ...parsed.pagination }
      if (parsed.toast)
        toast.value = { ...defaultToastSettings, ...parsed.toast }
    } catch {
      // 外部写入的 JSON 损坏时忽略，保持当前内存状态
    }
  }

  if (typeof window !== 'undefined') {
    window.addEventListener('storage', onStorageChange)
    // 随 Pinia effectScope 销毁时自动解除监听，防止测试环境或 HMR 时泄漏
    onScopeDispose(() => window.removeEventListener('storage', onStorageChange))
  }

  // --- TypeWriter Actions ---

  /**
   * 增量更新打字机设置并按分组同步至本地存储。
   *
   * @param settings 待覆盖的打字机配置片段
   */
  function setTypeWriterSettings(settings: Partial<TypeWriterSettings>) {
    typeWriter.value = { ...typeWriter.value, ...settings }
    persistGroup('typeWriter', typeWriter.value)
  }

  /** 将打字机设置恢复为默认值并同步至本地存储。 */
  function resetTypeWriterSettings() {
    typeWriter.value = { ...defaultTypeWriterSettings }
    persistGroup('typeWriter', typeWriter.value)
  }

  // --- Particle Actions ---

  /**
   * 增量更新背景粒子设置并按分组同步至本地存储。
   *
   * @param settings 待覆盖的粒子配置片段
   */
  function setParticleSettings(settings: Partial<ParticleSettings>) {
    particles.value = { ...particles.value, ...settings }
    persistGroup('particles', particles.value)
  }

  /** 将背景粒子设置恢复为默认值并同步至本地存储。 */
  function resetParticleSettings() {
    particles.value = { ...defaultParticleSettings }
    persistGroup('particles', particles.value)
  }

  // --- Pagination Actions ---

  /**
   * 增量更新前后台分页容量设置并按分组同步至本地存储。
   *
   * @param settings 待覆盖的分页容量配置片段
   */
  function setPaginationSettings(settings: Partial<PaginationSettings>) {
    pagination.value = { ...pagination.value, ...settings }
    persistGroup('pagination', pagination.value)
  }

  /** 将前后台分页容量设置恢复为默认值并同步至本地存储。 */
  function resetPaginationSettings() {
    pagination.value = { ...defaultPaginationSettings }
    persistGroup('pagination', pagination.value)
  }

  // --- Toast Actions ---

  /**
   * 增量更新吐司通知设置并按分组同步至本地存储。
   *
   * @param settings 待覆盖的吐司配置片段
   */
  function setToastSettings(settings: Partial<ToastSettings>) {
    toast.value = { ...toast.value, ...settings }
    persistGroup('toast', toast.value)
  }

  /** 将吐司通知设置恢复为默认值并同步至本地存储。 */
  function resetToastSettings() {
    toast.value = { ...defaultToastSettings }
    persistGroup('toast', toast.value)
  }

  // --- 全量持久化 ---

  /**
   * 将当前 Store 中的全部设置一次性序列化写入 localStorage。
   *
   * 与按分组写入的 `persistGroup` 不同，本方法会整体覆盖存储内容。
   * 适用于需要确保全部分组一致性的场景（如导入/导出设置）。
   */
  function saveToLocalStorage() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          typeWriter: typeWriter.value,
          particles: particles.value,
          pagination: pagination.value,
          toast: toast.value,
        }),
      )
    } catch (e) {
      console.warn('站点设置写入 localStorage 失败，本次变更仅在当前页面生效:', e)
    }
  }

  /**
   * 手动从 localStorage 重新加载并同步全部设置状态。
   */
  function loadSettings() {
    const persisted = loadPersistedSettings()
    typeWriter.value = persisted.typeWriter
    particles.value = persisted.particles
    pagination.value = persisted.pagination
    toast.value = persisted.toast
  }

  return {
    // 响应式状态
    typeWriter,
    particles,
    pagination,
    toast,
    // Actions
    setTypeWriterSettings,
    resetTypeWriterSettings,
    setParticleSettings,
    resetParticleSettings,
    setPaginationSettings,
    resetPaginationSettings,
    setToastSettings,
    resetToastSettings,
    saveToLocalStorage,
    loadSettings,
  }
})
