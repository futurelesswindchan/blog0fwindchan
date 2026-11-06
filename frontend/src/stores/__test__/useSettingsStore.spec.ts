/**
 * @file useSettingsStore.spec.ts
 * @description 站点设置 Store 的持久化测试，防止「关闭开关后刷新又被重新启用」问题回归
 *
 * 测试策略：
 * 1. 用「新建 Pinia 实例」模拟页面刷新：state 工厂会重新执行 loadPersistedSettings()
 * 2. 用两个独立 Pinia 实例模拟同时打开的两个标签页（共享同一个 localStorage）
 * 3. 覆盖：正常读写往返、旧版本/损坏缓存、异常类型值、存储写入失败、多标签页互相覆盖
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useSettingsStore } from '../useSettingsStore'

const STORAGE_KEY = 'blog_settings'

/** 模拟一次页面刷新：丢弃内存中的 Store，重新从 localStorage 初始化 */
const reload = () => {
  setActivePinia(createPinia())
  return useSettingsStore()
}

/** 读取当前持久化在 localStorage 里的原始设置 */
const readStorage = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')

/** 直接写入一份缓存，模拟旧版本或被外部篡改的数据 */
const seedStorage = (value: unknown) => {
  localStorage.setItem(STORAGE_KEY, typeof value === 'string' ? value : JSON.stringify(value))
}

describe('useSettingsStore 持久化', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('正常路径：关闭开关 → 刷新', () => {
    it('关闭粒子后刷新，particles.enabled 仍为 false', () => {
      useSettingsStore().setParticleSettings({ enabled: false })

      expect(readStorage().particles.enabled).toBe(false)
      expect(reload().particles.enabled).toBe(false)
    })

    it('关闭打字机后刷新，typeWriter.enabled 仍为 false', () => {
      useSettingsStore().setTypeWriterSettings({ enabled: false })

      expect(readStorage().typeWriter.enabled).toBe(false)
      expect(reload().typeWriter.enabled).toBe(false)
    })

    it('两个开关同时关闭，刷新后各自保持关闭', () => {
      const store = useSettingsStore()
      store.setParticleSettings({ enabled: false })
      store.setTypeWriterSettings({ enabled: false })

      const after = reload()
      expect(after.particles.enabled).toBe(false)
      expect(after.typeWriter.enabled).toBe(false)
    })

    it('连续开关 off → on → off，刷新后以最后一次为准', () => {
      const store = useSettingsStore()
      store.setParticleSettings({ enabled: false })
      store.setParticleSettings({ enabled: true })
      store.setParticleSettings({ enabled: false })

      expect(reload().particles.enabled).toBe(false)
    })

    it('关闭开关后再修改其他分组，刷新后开关不被重置', () => {
      const store = useSettingsStore()
      store.setParticleSettings({ enabled: false })
      store.setToastSettings({ position: 'top-left' })
      store.setPaginationSettings({ articles: 12 })

      const after = reload()
      expect(after.particles.enabled).toBe(false)
      expect(after.toast.position).toBe('top-left')
    })

    it('只更新部分字段（count）不会把 enabled 冲回默认值', () => {
      const store = useSettingsStore()
      store.setParticleSettings({ enabled: false })
      store.setParticleSettings({ count: 120 })

      const after = reload()
      expect(after.particles.enabled).toBe(false)
      expect(after.particles.count).toBe(120)
    })

    it('刷新多次（连续 reload）状态保持稳定', () => {
      useSettingsStore().setParticleSettings({ enabled: false })
      reload()
      reload()
      expect(reload().particles.enabled).toBe(false)
    })

    it('恢复默认会把开关写回 true（设计行为，确认 reset 不是误触发来源）', () => {
      const store = useSettingsStore()
      store.setParticleSettings({ enabled: false })
      store.resetParticleSettings()
      expect(reload().particles.enabled).toBe(true)
    })
  })

  describe('边界：缓存来自旧版本或被损坏', () => {
    it('缓存里 enabled 为 false 时不会被默认值 true 覆盖（合并顺序正确）', () => {
      seedStorage({ particles: { enabled: false }, typeWriter: { enabled: false } })
      const store = reload()
      expect(store.particles.enabled).toBe(false)
      expect(store.typeWriter.enabled).toBe(false)
    })

    it('缓存缺少 enabled 字段时回退为默认 true，其余字段保留', () => {
      seedStorage({ particles: { count: 50 } })
      const store = reload()
      expect(store.particles.enabled).toBe(true)
      expect(store.particles.count).toBe(50)
    })

    it('只缺失某一分组时，其他分组的关闭状态不受影响', () => {
      seedStorage({ particles: { enabled: false } })
      const store = reload()
      expect(store.particles.enabled).toBe(false)
      expect(store.typeWriter.enabled).toBe(true)
    })

    it('JSON 损坏时回退默认配置且不抛错', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      seedStorage('{not json')
      expect(() => reload()).not.toThrow()
      expect(useSettingsStore().particles.enabled).toBe(true)
    })

    it('缓存内容为字符串 "null" 时回退默认配置且不抛错', () => {
      vi.spyOn(console, 'error').mockImplementation(() => {})
      seedStorage('null')
      expect(() => reload()).not.toThrow()
      expect(useSettingsStore().typeWriter.enabled).toBe(true)
    })
  })

  describe('多标签页：互不覆盖与同步', () => {
    /**
     * 回归场景：
     * 1. 同时开着标签页 A 和 B（两个 Pinia 实例，共享 localStorage）
     * 2. 在 B 里关闭粒子并保存 → localStorage 中 enabled=false
     * 3. 回到 A（内存里仍是旧的 enabled=true），保存其他分组的设置
     * 4. persistGroup 只写 A 修改的那一组，B 写入的 enabled=false 应保留
     *
     * NOTE: 若持久化退回「整块写回全部分组」，这组用例会失败。
     */
    it('B 关闭粒子后，A 保存其他分组不会把 enabled 写回 true', () => {
      setActivePinia(createPinia())
      const tabA = useSettingsStore()
      setActivePinia(createPinia())
      const tabB = useSettingsStore()

      tabB.setParticleSettings({ enabled: false })
      expect(readStorage().particles.enabled).toBe(false)

      tabA.setToastSettings({ position: 'top-left' })

      expect(reload().particles.enabled).toBe(false)
    })

    it('B 关闭打字机后，A 保存粒子设置不会把打字机重新启用', () => {
      setActivePinia(createPinia())
      const tabA = useSettingsStore()
      setActivePinia(createPinia())
      const tabB = useSettingsStore()

      tabB.setTypeWriterSettings({ enabled: false })
      tabA.setParticleSettings({ count: 100 })

      expect(reload().typeWriter.enabled).toBe(false)
    })

    it('A 收到其他标签页的 storage 事件后，内存状态同步为最新值', () => {
      const tabA = useSettingsStore()
      const newValue = JSON.stringify({
        ...readStorageOrDefault(),
        particles: { enabled: false, count: 80, baseSpeed: 0.5 },
      })
      localStorage.setItem(STORAGE_KEY, newValue)
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue }))

      expect(tabA.particles.enabled).toBe(false)
    })
  })

  describe('localStorage 写入失败时的降级', () => {
    /**
     * 隐私模式 / 配额满 / 浏览器禁用存储时 setItem 会抛 DOMException。
     * persistGroup 会捕获异常并 console.warn，action 不向外抛出，
     * 以免中断 SettingsModal.save() 后续的提示与关闭逻辑。
     */
    beforeEach(() => {
      // 屏蔽 persistGroup 预期内的 warn 输出，保持测试日志干净
      vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    it('setItem 抛错时 action 不向外抛出异常', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota exceeded', 'QuotaExceededError')
      })
      const store = useSettingsStore()

      expect(() => store.setParticleSettings({ enabled: false })).not.toThrow()
      expect(console.warn).toHaveBeenCalled()
    })

    it('setItem 抛错时变更只在当前会话生效，刷新后回到写入前的值', () => {
      const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new DOMException('quota exceeded', 'QuotaExceededError')
      })
      const store = useSettingsStore()
      store.setParticleSettings({ enabled: false })
      expect(store.particles.enabled).toBe(false)

      spy.mockRestore()
      expect(reload().particles.enabled).toBe(true)
    })
  })
})

/** 读取当前缓存，不存在时返回空对象，供构造 storage 事件使用 */
function readStorageOrDefault() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
}
