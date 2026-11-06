/**
 * @file SettingsModal.spec.ts
 * @description 设置弹窗「开关 → 保存 → 刷新」全链路测试
 *
 * 测试策略：
 * 1. 使用真实 Pinia + 真实 useSettingsStore，只 Mock Toast 与 adminStore（后者依赖 vue-router）
 * 2. 用「新建 Pinia 实例」模拟刷新，验证 UI 操作最终写进 localStorage 的值
 * 3. 覆盖：保存后刷新、未保存直接关闭、重新打开时草稿同步
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import { nextTick } from 'vue'
import SettingsModal from '../SettingsModal.vue'
import { useSettingsStore } from '@/stores/useSettingsStore'
import { useGlobalModalStore } from '@/stores/globalModalStore'

const mockNotify = vi.fn()
vi.mock('@/composables/useToast', () => ({
  useToast: () => ({ notify: mockNotify, confirm: vi.fn(async () => true) }),
}))
vi.mock('@/stores/adminStore', () => ({
  useAdminStore: () => ({ isAuthenticated: false }),
}))

/** 模拟刷新：新 Pinia 实例会重新从 localStorage 读取设置 */
const reloadStore = () => {
  setActivePinia(createPinia())
  return useSettingsStore()
}

/** 设置弹窗中的开关顺序：0 = 粒子，1 = 打字机 */
const PARTICLE_TOGGLE = 0
const TYPEWRITER_TOGGLE = 1

describe('SettingsModal.vue 开关持久化', () => {
  let pinia: Pinia

  beforeEach(() => {
    vi.useFakeTimers()
    localStorage.clear()
    mockNotify.mockClear()
    pinia = createPinia()
    setActivePinia(pinia)
    useGlobalModalStore().openSettings()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  const mountModal = () => mount(SettingsModal, { global: { plugins: [pinia] } })
  const toggles = (wrapper: ReturnType<typeof mountModal>) => wrapper.findAll('.toggle-switch')

  it('关闭粒子并点击保存后，刷新仍为关闭', async () => {
    const wrapper = mountModal()
    await toggles(wrapper)[PARTICLE_TOGGLE].trigger('click')
    await wrapper.find('.modal-btn-primary').trigger('click')

    expect(reloadStore().particles.enabled).toBe(false)
  })

  it('关闭打字机并点击保存后，刷新仍为关闭', async () => {
    const wrapper = mountModal()
    await toggles(wrapper)[TYPEWRITER_TOGGLE].trigger('click')
    await wrapper.find('.modal-btn-primary').trigger('click')

    expect(reloadStore().typeWriter.enabled).toBe(false)
  })

  it('两个开关都关闭后保存，刷新后都保持关闭', async () => {
    const wrapper = mountModal()
    await toggles(wrapper)[PARTICLE_TOGGLE].trigger('click')
    await toggles(wrapper)[TYPEWRITER_TOGGLE].trigger('click')
    await wrapper.find('.modal-btn-primary').trigger('click')

    const after = reloadStore()
    expect(after.particles.enabled).toBe(false)
    expect(after.typeWriter.enabled).toBe(false)
  })

  it('保存后 600ms 弹窗自动关闭，并给出成功提示', async () => {
    const wrapper = mountModal()
    await toggles(wrapper)[PARTICLE_TOGGLE].trigger('click')
    await wrapper.find('.modal-btn-primary').trigger('click')

    expect(mockNotify).toHaveBeenCalledWith(expect.objectContaining({ type: 'success' }))
    vi.advanceTimersByTime(600)
    expect(useGlobalModalStore().showSettings).toBe(false)
  })

  it('只关开关、不点保存直接关闭弹窗：刷新后恢复启用（交互陷阱，记录现状）', async () => {
    const wrapper = mountModal()
    await toggles(wrapper)[PARTICLE_TOGGLE].trigger('click')
    expect(toggles(wrapper)[PARTICLE_TOGGLE].classes()).not.toContain('active')

    await wrapper.find('.close-btn').trigger('click')

    expect(localStorage.getItem('blog_settings')).toBeNull()
    expect(reloadStore().particles.enabled).toBe(true)
  })

  it('未保存关闭后重新打开，开关显示回 Store 中的真实值', async () => {
    const wrapper = mountModal()
    const modalStore = useGlobalModalStore()
    await toggles(wrapper)[PARTICLE_TOGGLE].trigger('click')
    modalStore.closeSettings()
    await nextTick()

    modalStore.openSettings()
    await flushPromises()
    await nextTick()

    expect(toggles(wrapper)[PARTICLE_TOGGLE].classes()).toContain('active')
  })

  it('已保存为关闭的设置，重新打开弹窗时开关显示为关闭', async () => {
    useSettingsStore().setParticleSettings({ enabled: false })
    const wrapper = mountModal()

    expect(toggles(wrapper)[PARTICLE_TOGGLE].classes()).not.toContain('active')
  })
})
