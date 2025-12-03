<template>
  <div class="article-view-container editor-mode">
    <!-- 顶部：标题与返回 -->
    <div class="page-header" :class="{ editing: isEditing }">
      <div class="back-area" @click="goBack">
        <i class="fas fa-arrow-left"></i>
      </div>

      <!-- [编辑模式] 标题输入框 -->
      <input
        v-if="isEditing"
        v-model="form.title"
        class="page-title-input transparent-input"
        placeholder="请在此输入文章标题..."
      />
      <!-- [预览模式] 标题展示 -->
      <h2 v-else class="page-title">{{ form.title || '无标题' }}</h2>
    </div>

    <div class="story-view">
      <!-- 文章信息元数据区 -->
      <div class="article-info" :class="{ 'editing-meta': isEditing }">
        <!-- [预览模式] 展示日期和字数 -->
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

        <!-- [编辑模式] 展示详细配置输入 -->
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

      <!-- [核心] 正文区域 -->
      <div class="article-content-wrapper">
        <!-- [编辑模式] Markdown 编辑框 -->
        <!-- 使用 v-show 保持状态，或者用 v-if 强制刷新 -->
        <div v-if="isEditing" class="editor-area">
          <textarea
            v-model="form.content"
            class="markdown-textarea"
            placeholder="# 开始你的创作..."
          ></textarea>
        </div>

        <!-- [预览模式] ContentTypeWriter 用于渲染 -->
        <!-- 复用你现有的渲染组件，enabled=false 关闭打字机动画以实现静态展示 -->
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

    <!-- 悬浮操作按钮组 -->
    <div class="floating-actions">
      <button v-if="!isEditing" class="action-btn edit" @click="toggleEdit">
        <i class="fas fa-pen"></i>
        <span>正在预览文本...要修改或上传提交吗？</span>
      </button>

      <template v-else>
        <button class="action-btn cancel" @click="cancelEdit">
          <i class="fas fa-times"></i>
          <span>退出编辑模式</span>
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
import { ref, reactive, computed, onMounted } from 'vue' // ✨ 引入 onMounted
import { useRouter, useRoute } from 'vue-router' // ✨ 引入 useRoute
import { useArticleContent } from '@/composables/useArticleContent'
import { useArticleInfo } from '@/composables/useArticleInfo'
import { useCodeHighlight } from '@/composables/useCodeHighlight'
import ContentTypeWriter from '@/components/common/ContentTypeWriter.vue'
import api from '@/api' // ✨ 引入 api 实例
import { useArticleStore } from '@/views/stores/articleStore' // ✨ 引入 articleStore

import '@/styles/articleContent.css'
import '@/styles/articleInfo.css'
import '@/styles/pageHeader.css'
import '@/styles/codeBlock.css'

const router = useRouter()
const route = useRoute() // ✨ 获取当前路由信息
const articleStore = useArticleStore() // ✨ 获取 articleStore
const { isDarkTheme, formatDate, markdownOptions: baseMarkdownOptions } = useArticleContent()
const { codeHighlightOptions } = useCodeHighlight()

const markdownOptions = {
  ...baseMarkdownOptions,
  ...codeHighlightOptions,
}

// 状态管理
const isEditing = ref(true) // 默认为编辑模式（如果是新建）
const saving = ref(false)

// 表单数据
const form = reactive({
  title: '',
  slug: '',
  category: 'frontend',
  date: new Date().toISOString().split('T')[0],
  content: '',
})

// 为了配合 ArticleInfo 使用，需要 computed
const contentRef = computed(() => form.content)
const { estimateWords } = useArticleInfo(contentRef)

// ✨ 判断是新建还是编辑
const isNewPost = computed(() => !route.params.slug)

onMounted(async () => {
  if (!isNewPost.value) {
    // 这是编辑模式，需要加载文章数据
    const category = route.params.category as string
    const slug = route.params.slug as string

    // ✨ 调用 store 的 fetchArticle 方法来加载数据
    await articleStore.fetchArticle(category, slug)

    const post = articleStore.currentArticle
    if (post) {
      // 将加载的数据填充到表单
      form.title = post.title
      form.slug = post.id
      form.content = post.content
      form.date = post.date
      form.category = category // 分类从路由参数获取

      // ✨ 默认进入预览模式
      isEditing.value = false
    } else {
      // 文章加载失败
      alert('加载文章失败，可能是不存在哦')
      router.push({ name: 'AdminDashboard' })
    }
  } else {
    // ✨ 新建模式，默认进入编辑状态
    isEditing.value = true
  }
})

// 操作逻辑
const toggleEdit = () => {
  isEditing.value = true
}

const cancelEdit = () => {
  // 这里可以加个确认弹窗防止丢失数据
  if (
    confirm('确定退出编辑模式吗？会进入预览模式哦！\n只要不离开此页面，文章依然会保存修改进度~')
  ) {
    isEditing.value = false
  }
}

const savePost = async () => {
  if (!form.title || !form.content || !form.slug) {
    alert('请把内容填完整哦！')
    return
  }

  saving.value = true
  try {
    // ✨ 修改：直接使用 api 实例发起请求，它会自动带上 Token
    const response = await api.post('/articles', {
      ...form,
      isNew: isNewPost.value, // ✨ 根据计算属性判断是新建还是更新
    })

    if (response.status === 200) {
      // 保存成功后，切换回预览模式
      isEditing.value = false
      // ✨ 新增逻辑：保存成功后，如果是新文章，则跳转到新文章的编辑页
      if (isNewPost.value) {
        router.replace({
          name: 'EditorEdit',
          params: { category: form.category, slug: form.slug },
        })
      }
    }
  } catch (error: unknown) {
    let errorMsg = '未知错误'
    if (error instanceof Error) {
      errorMsg = error.message
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const responseData = (error as Record<string, unknown>).response
      if (typeof responseData === 'object' && responseData !== null && 'data' in responseData) {
        const data = (responseData as Record<string, unknown>).data
        if (typeof data === 'object' && data !== null && 'error' in data) {
          errorMsg = String(data.error)
        }
      }
    }
    alert('保存失败: ' + errorMsg)
  } finally {
    saving.value = false
  }
}

const goBack = () => {
  if (isEditing.value) {
    if (confirm('正在编辑中，确定要离开吗？')) {
      router.back()
    }
  } else {
    router.back()
  }
}
</script>

<style scoped>
/* 覆盖/扩展默认样式以适配编辑器 */

.editor-mode {
  position: relative;
}

/* 保持与其他页面的 page-header 高度一致（编辑器模式下） */
.page-header.editing {
  min-height: 84px; /* 与其他页面标题栏接近的高度 */
  align-items: center; /* 垂直居中内容 */
}

.page-header.editing .page-title-input {
  height: 100%;
  display: flex;
  align-items: center;
  padding: 0 1rem;
  font-size: 1.5rem;
}

/* 使返回区域撑满 header 高度，扩大 hover / 点击命中区域 */
.page-header .back-area {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 0.75rem;
  cursor: pointer;
}

.page-header.editing .back-area {
  align-self: stretch; /* 撑满父容器高度 */
  display: flex;
  align-items: center; /* 垂直居中图标 */
}

/* 标题输入框 */
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
  color: rgba(255, 255, 255, 0.3);
}

.dark-theme .page-title-input::placeholder {
  color: rgba(255, 255, 255, 0.5);
}

/* 编辑模式下的元数据栏 */
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

/* Markdown 编辑框区域 */
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

/* 悬浮按钮组 */
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
