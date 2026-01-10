<!-- src/views/admin/EditorView.vue -->
<template>
  <div class="article-view-container editor-mode" @click="closeMagicMenu">
    <!-- 顶部：标题与返回 -->
    <div class="page-header" :class="{ editing: isEditing }">
      <div class="back-area" @click="goBack">
        <i class="fas fa-arrow-left"></i>
      </div>

      <input
        v-if="isEditing"
        v-model="form.title"
        class="page-title-input transparent-input"
        placeholder="请在此输入文章标题..."
      />
      <h2 v-else class="page-title">{{ form.title || '无标题' }}</h2>
    </div>

    <div class="story-view">
      <!-- 文章信息区 -->
      <div class="article-info" :class="{ 'editing-meta': isEditing }">
        <template v-if="!isEditing">
          <div class="info-item">
            <i class="fas fa-calendar"></i>
            <span>{{ formatDate(form.date) }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-folder"></i>
            <span class="capitalize">{{ form.category }}</span>
          </div>
          <div class="info-item">
            <i class="fas fa-clock"></i>
            <span>约{{ estimateWords }}字</span>
          </div>
        </template>
        <template v-else>
          <div class="meta-input-group">
            <div class="input-wrapper">
              <i class="fas fa-link"></i>
              <input v-model="form.slug" placeholder="请输入文章链接" class="meta-input" />
            </div>
            <div class="input-wrapper">
              <i class="fas fa-folder-open"></i>
              <select v-model="form.category" class="meta-select">
                <option value="frontend">技术手记</option>
                <option value="topics">奇怪杂谈</option>
                <option value="novels">幻想物语</option>
              </select>
            </div>
            <div class="input-wrapper">
              <i class="fas fa-calendar-alt"></i>
              <input v-model="form.date" type="date" class="meta-input date-input" />
            </div>
          </div>
        </template>
      </div>

      <!-- 正文区域 -->
      <div class="article-content-wrapper">
        <!-- 编辑模式 -->
        <div v-if="isEditing" class="editor-area">
          <div class="editor-toolbar">
            <!-- 基础格式组 -->
            <div class="toolbar-group">
              <button
                class="toolbar-btn"
                title="粗体 (Ctrl+B)"
                @click.stop="applyFormat('**', '**')"
              >
                <i class="fas fa-bold"></i>
              </button>
              <button class="toolbar-btn" title="斜体 (Ctrl+I)" @click.stop="applyFormat('*', '*')">
                <i class="fas fa-italic"></i>
              </button>
              <button class="toolbar-btn" title="删除线" @click.stop="applyFormat('~~', '~~')">
                <i class="fas fa-strikethrough"></i>
              </button>
            </div>

            <div class="toolbar-divider"></div>

            <!-- 插入组 -->
            <div class="toolbar-group">
              <button class="toolbar-btn" title="插入链接" @click.stop="insertLink">
                <i class="fas fa-link"></i>
              </button>

              <!-- 修改：调用全局素材库 -->
              <button class="toolbar-btn" title="插入图片" @click.stop="openAssetLibrary">
                <i class="fas fa-image"></i>
              </button>

              <button class="toolbar-btn" title="引用块" @click.stop="applyFormat('\n> ', '')">
                <i class="fas fa-quote-right"></i>
              </button>
              <button
                class="toolbar-btn"
                title="代码块"
                @click.stop="applyFormat('\n```\n', '\n```\n')"
              >
                <i class="fas fa-code"></i>
              </button>
            </div>

            <div class="toolbar-divider"></div>

            <!-- 魔法组  -->
            <div class="toolbar-group relative">
              <button
                class="toolbar-btn magic-btn"
                :class="{ active: showMagicMenu }"
                title="风风魔法"
                @click.stop="toggleMagicMenu"
              >
                <i class="fas fa-wand-magic-sparkles"></i>
                <span class="btn-label">Magic</span>
              </button>

              <div v-if="showMagicMenu" class="magic-dropdown" @click.stop>
                <div class="magic-tabs">
                  <span
                    v-for="tab in magicTabs"
                    :key="tab.key"
                    :class="{ active: currentMagicTab === tab.key }"
                    @click="currentMagicTab = tab.key"
                  >
                    {{ tab.name }}
                  </span>
                </div>
                <div class="magic-content">
                  <div v-if="currentMagicTab === 'color'" class="magic-grid">
                    <button
                      v-for="color in magicColors"
                      :key="color"
                      class="magic-item"
                      :class="`text-${color}`"
                      @click="applyMagic(`text-${color}`)"
                    >
                      Aa
                    </button>
                  </div>
                  <div v-if="currentMagicTab === 'bg'" class="magic-grid">
                    <button
                      v-for="bg in magicBgs"
                      :key="bg"
                      class="magic-item"
                      :class="`bg-${bg}`"
                      @click="applyMagic(`bg-${bg}`)"
                    >
                      Bg
                    </button>
                    <button class="magic-item bg-wind" @click="applyMagic('bg-wind')">Wind</button>
                    <button class="magic-item bg-griffon" @click="applyMagic('bg-griffon')">
                      Grif
                    </button>
                  </div>
                  <div v-if="currentMagicTab === 'font'" class="magic-list">
                    <button class="magic-list-item FleurDeleah" @click="applyMagic('FleurDeleah')">
                      FleurDeleah
                    </button>
                    <button class="magic-list-item 繁星手记" @click="applyMagic('繁星手记')">
                      繁星手记
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <textarea
            ref="textareaRef"
            v-model="form.content"
            class="markdown-textarea"
            placeholder="# 开始你的创作..."
            @keydown.ctrl.b.prevent="applyFormat('**', '**')"
            @keydown.ctrl.i.prevent="applyFormat('*', '*')"
          ></textarea>

          <!-- 移除本地 AssetLibraryModal -->
        </div>

        <!-- 预览模式 -->
        <div v-else class="article-content markdown-content">
          <ContentTypeWriter
            :content="form.content"
            :enabled="false"
            :markdown-options="markdownOptions"
            :is-dark-theme="isDarkTheme"
          />
        </div>
      </div>
    </div>

    <hr />

    <!-- 悬浮操作按钮组  -->
    <div class="floating-actions">
      <button v-if="!isEditing" class="action-btn edit" @click="toggleEdit">
        <i class="fas fa-pen"></i>
        <span>正在预览中，要修改或上传提交吗？</span>
      </button>
      <template v-else>
        <button class="action-btn cancel" @click="cancelEdit">
          <i class="fas fa-eye"></i>
          <span>正在编辑中，要看看文章效果预览吗？</span>
        </button>
        <button class="action-btn save" @click="savePost" :disabled="saving">
          <i class="fas" :class="saving ? 'fa-spinner fa-spin' : 'fa-save'"></i>
          <span>{{ saving ? '保存提交中' : '上传提交文章' }}</span>
        </button>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useArticleContent } from '@/composables/useArticleContent'
import { useCodeHighlight } from '@/composables/useCodeHighlight'
import { useArticleInfo } from '@/composables/useArticleInfo'
import { useArticleStore } from '@/views/stores/articleStore'
import { useGlobalModalStore } from '@/views/stores/globalModalStore'
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useToast } from '@/composables/useToast'
import { useRouter, useRoute } from 'vue-router'
import { AxiosError } from 'axios'

import ContentTypeWriter from '@/components/common/ContentTypeWriter.vue'
import api from '@/api'

import '@/styles/correctContentMargin.css'
import '@/styles/articleContent.css'
import '@/styles/articleInfo.css'
import '@/styles/pageHeader.css'
import '@/styles/codeBlock.css'

const router = useRouter()
const route = useRoute()
const articleStore = useArticleStore()
const modalStore = useGlobalModalStore()
const { confirm, notify } = useToast()

const { isDarkTheme, formatDate, markdownOptions: baseMarkdownOptions } = useArticleContent()
const { codeHighlightOptions } = useCodeHighlight()

const markdownOptions = { ...baseMarkdownOptions, ...codeHighlightOptions }

// 状态管理
const isEditing = ref(true)
const saving = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

// 魔法菜单状态
const showMagicMenu = ref(false)
const currentMagicTab = ref('color')

// 魔法配置数据
const magicTabs = [
  { key: 'color', name: '文字色' },
  { key: 'bg', name: '背景色' },
  { key: 'font', name: '字体' },
]
const magicColors = [
  'red',
  'pink',
  'purple',
  'deep-purple',
  'indigo',
  'blue',
  'light-blue',
  'cyan',
  'teal',
  'green',
  'light-green',
  'lime',
  'yellow',
  'amber',
  'orange',
  'deep-orange',
  'brown',
  'gray',
  'blue-gray',
  'black',
]
const magicBgs = ['red', 'pink', 'purple', 'blue', 'green', 'yellow', 'orange', 'gray', 'black']

// 表单数据
const form = reactive({
  title: '',
  slug: '',
  category: 'frontend',
  date: new Date().toISOString().split('T')[0],
  content: '',
})

// 计算文章内容
const contentRef = computed(() => form.content)
const { estimateWords } = useArticleInfo(contentRef)
const isNewPost = computed(() => !route.params.slug)

// 初始化加载文章数据
onMounted(async () => {
  if (!isNewPost.value) {
    const category = route.params.category as string
    const slug = route.params.slug as string
    await articleStore.fetchArticle(category, slug)
    const post = articleStore.currentArticle
    if (post) {
      form.title = post.title
      form.slug = post.id
      form.content = post.content
      form.date = post.date
      form.category = category
      isEditing.value = false
    } else {
      alert('加载文章失败，可能是不存在哦')
      router.push({ name: 'AdminDashboard' })
    }
  } else {
    isEditing.value = true
  }
})

// --- 编辑逻辑 ---

const applyFormat = (prefix: string, suffix: string) => {
  const textarea = textareaRef.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = form.content.substring(start, end)
  const originalContent = form.content
  const textToInsert = selectedText || '文本'
  const newContent =
    originalContent.substring(0, start) +
    prefix +
    textToInsert +
    suffix +
    originalContent.substring(end)
  form.content = newContent
  nextTick(() => {
    textarea.focus()
    if (selectedText) {
      textarea.selectionStart = start + prefix.length
      textarea.selectionEnd = end + prefix.length
    } else {
      textarea.selectionStart = start + prefix.length
      textarea.selectionEnd = start + prefix.length + textToInsert.length
    }
  })
}

const insertLink = () => {
  const textarea = textareaRef.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selectedText = form.content.substring(start, end)
  const url = prompt('请输入链接地址:', 'https://')
  if (!url) return
  const text = selectedText || '在这里填写链接描述'
  const insert = `[${text}](${url})`
  form.content = form.content.substring(0, start) + insert + form.content.substring(end)
  nextTick(() => {
    textarea.focus()
    textarea.selectionStart = textarea.selectionEnd = start + insert.length
  })
}

const applyMagic = (className: string) => {
  applyFormat(`<span class="${className}">`, `</span>`)
  showMagicMenu.value = false
}

// 处理图片插入 (作为回调函数传给 Store)
const handleInsertImage = (url: string) => {
  const textarea = textareaRef.value
  if (!textarea) return
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const textToInsert = `\n![在这里填写图片描述](${url})\n`
  form.content = form.content.substring(0, start) + textToInsert + form.content.substring(end)
  nextTick(() => {
    textarea.focus()
    textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length
  })
}

// 打开全局素材库
const openAssetLibrary = () => {
  modalStore.openAssetLibrary(handleInsertImage)
}

const toggleMagicMenu = () => {
  showMagicMenu.value = !showMagicMenu.value
}
const closeMagicMenu = () => {
  showMagicMenu.value = false
}

const toggleEdit = () => (
  notify({
    message: '已进入编辑模式，记得随时保存你的进度哦ヾ(•ω•`)o',
    type: 'success',
  }),
  (isEditing.value = true)
)

const cancelEdit = async () => {
  isEditing.value = false

  notify({
    message: '已进入预览模式，可以查看文章最终效果(￣▽￣)啦',
    type: 'success',
  })
}
const savePost = async () => {
  if (!form.title || !form.content || !form.slug) {
    notify({
      message: '请把内容填完整再提交哦！(*￣3￣)',
      type: 'warning',
    })

    return
  }
  saving.value = true
  try {
    const response = await api.post('/articles', { ...form, isNew: isNewPost.value })
    if (response.status === 200) {
      isEditing.value = false
      if (isNewPost.value) {
        router.replace({ name: 'EditorEdit', params: { category: form.category, slug: form.slug } })
      }
    }
    notify({
      message: '文章上传成功！(＾▽＾)',
      type: 'success',
    })
  } catch (e: unknown) {
    const error = e as AxiosError<{ error: string }>
    const errorMsg = error.response?.data?.error || error.message || '未知错误'
    alert('保存失败: ' + errorMsg)
  } finally {
    saving.value = false
  }
}
const goBack = async () => {
  if (isEditing.value) {
    const isConfirmed = await confirm(
      '真的确定要直接离开吗(＃°Д°)？',
      '正在编辑中的内容将不会被保存哦！',
    )

    if (isConfirmed) {
      router.back()
    }

    notify({
      message: '已离开文章编辑器啦(￣▽￣)ノ',
      type: 'success',
    })
  } else {
    router.back()
  }
}
</script>

<style scoped>
.editor-mode {
  position: relative;
}
.page-header.editing {
  min-height: 84px;
  align-items: center;
}
.page-header.editing .page-title-input {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  font-size: 1.5rem;
}
.page-header .back-area {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.75rem;
  cursor: pointer;
}
.page-header.editing .back-area {
  align-self: stretch;
  display: flex;
  align-items: center;
}
.page-title-input {
  flex: 1;
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--accent-color);
  background: transparent;
  border: none;
  outline: none;
  padding: 0 1rem;
  height: 100%;
  width: 100%;
}
.page-title-input::placeholder {
  color: rgba(0, 0, 0, 0.3);
}
.dark-theme .page-title-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}
.editing-meta {
  padding: 1rem;
}
.meta-input-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  width: 100%;
  justify-content: center;
  align-items: center;
  padding: 0.6rem 0;
}
.input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.3);
  padding: 0.6rem 0.9rem;
  border-radius: 8px;
  flex: 1;
  min-width: 150px;
  box-shadow: 0 0 10px rgba(0, 119, 255, 0.12);
  transition: all 0.25s var(--aero-animation);
}
.dark-theme .input-wrapper {
  background: rgba(255, 255, 255, 0.05);
}
.input-wrapper i {
  color: var(--accent-color);
  font-size: 0.9rem;
}
.meta-input,
.meta-select {
  background: transparent;
  border: none;
  color: var(--text-color);
  outline: none;
  width: 100%;
  font-size: 0.95rem;
}
.meta-select option {
  background: #2c3e50;
  color: white;
}
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 8px 8px 0 0;
  flex-wrap: wrap;
}
.dark-theme .editor-toolbar {
  background: rgba(255, 255, 255, 0.05);
  border-bottom-color: rgba(255, 255, 255, 0.05);
}
.toolbar-group {
  display: flex;
  gap: 4px;
}
.toolbar-divider {
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
  margin: 0 4px;
}
.dark-theme .toolbar-divider {
  background: rgba(255, 255, 255, 0.1);
}
.toolbar-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: #555;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  font-size: 0.9rem;
}
.dark-theme .toolbar-btn {
  color: #aaa;
}
.toolbar-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: var(--accent-color);
}
.dark-theme .toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}
.magic-btn {
  width: auto;
  padding: 0 8px;
  gap: 6px;
  color: #9c27b0;
}
.magic-btn.active {
  background: rgba(156, 39, 176, 0.1);
}
.btn-label {
  font-size: 0.85rem;
  font-weight: 600;
}
.relative {
  position: relative;
}
.magic-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  margin-top: 8px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  width: 280px;
  z-index: 100;
  border: 1px solid rgba(0, 0, 0, 0.05);
  overflow: hidden;
  animation: slideDown 0.2s ease-out;
}
.dark-theme .magic-dropdown {
  background: #2a2a2a;
  border-color: rgba(255, 255, 255, 0.1);
}
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.magic-tabs {
  display: flex;
  background: rgba(0, 0, 0, 0.03);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.magic-tabs span {
  flex: 1;
  text-align: center;
  padding: 8px 0;
  font-size: 0.85rem;
  cursor: pointer;
  color: #666;
  transition: all 0.2s;
}
.magic-tabs span.active {
  background: white;
  color: var(--accent-color);
  font-weight: bold;
  border-bottom: 2px solid var(--accent-color);
}
.dark-theme .magic-tabs span.active {
  background: #2a2a2a;
}
.magic-content {
  padding: 10px;
  max-height: 200px;
  overflow-y: auto;
}
.magic-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 6px;
}
.magic-item {
  width: 100%;
  aspect-ratio: 1;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  font-weight: bold;
  transition: transform 0.1s;
}
.magic-item:hover {
  transform: scale(1.1);
  z-index: 1;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.magic-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.magic-list-item {
  padding: 8px;
  text-align: left;
  background: transparent;
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}
.magic-list-item:hover {
  background: rgba(0, 0, 0, 0.03);
}
.dark-theme .magic-list-item:hover {
  background: rgba(255, 255, 255, 0.05);
}
.markdown-textarea {
  border-top-left-radius: 0;
  border-top-right-radius: 0;
  margin-top: 0;
  height: calc(100% - 48px);
}
.editor-area {
  min-height: 60vh;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.75);
  border-radius: 8px;
}
.dark-theme .editor-area {
  background: rgba(0, 0, 0, 0.75);
}
.markdown-textarea {
  width: 100%;
  height: 60vh;
  min-height: 400px;
  background: transparent;
  border: none;
  outline: none;
  resize: vertical;
  color: var(--text-color);
  font-family: 'JetBrainsMono', 'Fira Code', monospace;
  font-size: 1.05rem;
  line-height: 1.6;
  padding: 0.5rem;
}
.floating-actions {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1.2rem;
  margin: 2rem 0 0 0;
}
.action-btn {
  margin: 0 0 1.5rem 0;
  padding: 0.8rem 1.5rem;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.3);
  color: var(--accent-color);
  font-weight: 600;
  font-size: 1.05rem;
  letter-spacing: 1px;
  cursor: pointer;
  box-shadow: 0 0 10px rgba(0, 119, 255, 0.2);
  transition: all 0.3s var(--aero-animation);
}
.dark-theme .action-btn {
  background: rgba(0, 0, 0, 0.3);
  color: #90caf9;
}
.action-btn:hover {
  color: white;
  background: rgb(0, 119, 255);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 119, 255, 0.3);
}
.dark-theme .action-btn:hover {
  background: rgb(0, 119, 255);
  color: white;
}
.action-btn:active {
  transform: scale(0.98);
  opacity: 0.85;
}
.action-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none;
}
.capitalize {
  text-transform: capitalize;
}
</style>
