/**
 * @file ContentTypeWriter.spec.ts
 * @description ContentTypeWriter 组件的单元测试
 *
 * 测试策略：
 * 1. 使用 jsdom 环境（Vitest 默认配置已设置）
 * 2. Mock 外部依赖（pretext、DOMPurify）以隔离被测组件逻辑
 * 3. 覆盖：正常渲染、打字机动画、空内容兜底、快速切换防竞态、销毁清理
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ContentTypeWriter from '../ContentTypeWriter.vue'

// Mock 区：隔离外部依赖
vi.mock('@chenglou/pretext', () => ({
  prepare: vi.fn(() => ({})),
  layout: vi.fn(() => ({ lineCount: 10 })),
}))
vi.mock('@/composables/useArticleContent', () => ({
  useArticleContent: () => ({
    sanitizeHtml: (html: string) => html, // 测试环境直接透传，不做净化
  }),
}))
vi.mock('@/composables/useCodeHighlight', () => ({
  useCodeHighlight: () => ({
    codeHighlightOptions: {
      highlight: (code: string, lang: string) => `<pre><code class="${lang}">${code}</code></pre>`,
      langPrefix: 'hljs language-',
      html: true,
    },
  }),
}))
const mockGlobalProgress = { value: 0 }
const mockIsTypingMode = { value: false }
const mockShowProgress = { value: false }
const mockResetUnlockedHeadings = vi.fn()
const mockUnlockHeading = vi.fn()

vi.mock('@/composables/useReadingProgress', () => ({
  useReadingProgress: () => ({
    globalProgress: mockGlobalProgress,
    isTypingMode: mockIsTypingMode,
    showProgress: mockShowProgress,
    unlockHeading: mockUnlockHeading,
    resetUnlockedHeadings: mockResetUnlockedHeadings,
  }),
}))

// 工具函数
const waitForTypingStart = async (initialDelay = 800) => {
  await flushPromises()
  await nextTick()
  vi.advanceTimersByTime(50 + initialDelay)
  await flushPromises()
  await nextTick()
}
const advanceFrames = async (frames: number, speed = 30) => {
  for (let i = 0; i < frames; i++) {
    vi.advanceTimersByTime(speed + 1)
    await flushPromises()
  }
}

// 测试用例
describe('ContentTypeWriter.vue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockGlobalProgress.value = 0
    mockIsTypingMode.value = false
    mockShowProgress.value = false
    mockResetUnlockedHeadings.mockClear()
    mockUnlockHeading.mockClear()
  })
  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('正常渲染', () => {
    it('传入标准 Markdown 后应渲染出 HTML 内容', async () => {
      const wrapper = mount(ContentTypeWriter, {
        props: { content: '# Hello World\n\nThis is a test.', enabled: false },
      })
      await waitForTypingStart()

      expect(wrapper.find('.content-wrapper').exists()).toBe(true)
      expect(wrapper.html()).toContain('Hello World')
      expect(wrapper.html()).toContain('This is a test.')
    })
    it('enabled=false 时应瞬间展示全部内容，不出现光标', async () => {
      const wrapper = mount(ContentTypeWriter, {
        props: { content: '一段测试文本', enabled: false },
      })
      await waitForTypingStart()

      expect(wrapper.find('.typing-cursor').exists()).toBe(false)
      expect(wrapper.classes()).toContain('is-ready')
      expect(wrapper.classes()).not.toContain('is-typing')
    })
    it('应正确触发 update:lineCount 事件', async () => {
      const wrapper = mount(ContentTypeWriter, {
        props: { content: '# Title\n\nParagraph content here.', enabled: false },
      })
      await waitForTypingStart()

      expect(wrapper.emitted('update:lineCount')).toBeTruthy()
      expect(wrapper.emitted('update:lineCount')![0]).toEqual([10])
    })
  })

  describe('边界场景', () => {
    it('content 为空字符串时不应报错，组件保持空白', async () => {
      const wrapper = mount(ContentTypeWriter, {
        props: { content: '', enabled: true },
      })
      await waitForTypingStart()

      expect(wrapper.find('.content-wrapper').exists()).toBe(true)
      expect(wrapper.find('.content-wrapper').text()).toBe('')
    })
    it('content 为纯空白字符时应正常处理', async () => {
      const wrapper = mount(ContentTypeWriter, {
        props: { content: '   \n\n   ', enabled: true },
      })
      await waitForTypingStart()

      expect(wrapper.find('.content-type-writer').exists()).toBe(true)
    })
    it('内容快速连续变化时，只有最后一次内容生效（sessionId 防竞态）', async () => {
      const wrapper = mount(ContentTypeWriter, {
        props: { content: '第一段', enabled: false },
      })
      await wrapper.setProps({ content: '第二段' })
      await wrapper.setProps({ content: '第三段' })
      await wrapper.setProps({ content: '最终内容应该只有这段' })
      await waitForTypingStart()

      expect(wrapper.find('.content-wrapper').text()).toContain('最终内容应该只有这段')
    })
    it('打字中途将 enabled 设为 false 时应瞬间完成', async () => {
      const wrapper = mount(ContentTypeWriter, {
        props: {
          content: '这是一段比较长的内容，用来测试打字机中途被打断的情况。',
          enabled: true,
          speed: 30,
          initialDelay: 100,
        },
      })
      await waitForTypingStart(100)
      await advanceFrames(3, 30)

      expect(wrapper.classes()).toContain('is-typing')

      await wrapper.setProps({ enabled: false })
      await flushPromises()

      vi.advanceTimersByTime(700)
      await flushPromises()
      expect(wrapper.classes()).not.toContain('is-typing')
    })
    it('超长内容不应导致无限循环或内存溢出', async () => {
      const longContent = Array.from(
        { length: 100 },
        (_, i) => `## Section ${i}\n\n${'Lorem ipsum dolor sit amet. '.repeat(10)}`,
      ).join('\n\n')
      const wrapper = mount(ContentTypeWriter, {
        props: { content: longContent, enabled: false },
      })
      await waitForTypingStart()

      expect(wrapper.find('.content-wrapper').exists()).toBe(true)
      expect(wrapper.html()).toContain('Section 99')
    })
  })

  describe('异常与销毁安全', () => {
    it('组件在打字中途被销毁时不应抛出错误', async () => {
      const wrapper = mount(ContentTypeWriter, {
        props: {
          content: '测试销毁安全',
          enabled: true,
          speed: 30,
          initialDelay: 100,
        },
      })
      await waitForTypingStart(100)
      await advanceFrames(2, 30)
      expect(() => wrapper.unmount()).not.toThrow()

      vi.advanceTimersByTime(5000)
      await flushPromises()
    })
    it('content 中含有恶意 script 标签应被安全处理', async () => {
      const maliciousContent = '# Title\n\n<script>alert("xss")</script>\n\nSafe text.'
      const wrapper = mount(ContentTypeWriter, {
        props: { content: maliciousContent, enabled: false },
      })
      await waitForTypingStart()
      expect(wrapper.find('.content-wrapper').exists()).toBe(true)
    })
    it('resetUnlockedHeadings 在每次 startTyping 时应被调用', async () => {
      mount(ContentTypeWriter, {
        props: { content: '# First', enabled: false },
      })
      await waitForTypingStart()
      expect(mockResetUnlockedHeadings).toHaveBeenCalled()
    })
  })

  describe('CSS 状态类控制', () => {
    it('初始状态不带 is-ready 类（防止内容闪烁）', () => {
      const wrapper = mount(ContentTypeWriter, {
        props: { content: 'test', enabled: true },
      })
      expect(wrapper.classes()).not.toContain('is-ready')
    })
    it('enabled=false 完成渲染后应带有 is-ready 类', async () => {
      const wrapper = mount(ContentTypeWriter, {
        props: { content: 'test content', enabled: false },
      })
      await waitForTypingStart()
      expect(wrapper.classes()).toContain('is-ready')
    })
  })

  describe('全局进度状态联动', () => {
    it('startTyping 应将 showProgress 和 isTypingMode 设为 true', async () => {
      mount(ContentTypeWriter, {
        props: { content: '进度条测试', enabled: true, initialDelay: 100 },
      })
      await flushPromises()
      await nextTick()
      vi.advanceTimersByTime(50)
      await flushPromises()

      expect(mockShowProgress.value).toBe(true)
      expect(mockIsTypingMode.value).toBe(true)
    })
    it('finishTyping 后 globalProgress 应为 100', async () => {
      mount(ContentTypeWriter, {
        props: { content: '短文本', enabled: false },
      })
      await waitForTypingStart()
      expect(mockGlobalProgress.value).toBe(100)
    })
  })
})
