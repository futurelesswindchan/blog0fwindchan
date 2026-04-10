<!-- frontend\src\views\articles\ArticleDetailView.vue -->
<template>
  <div class="article-view-container">
    <!-- 顶部标题栏区域 -->
    <div class="page-header">
      <div class="back-area" @click="$router.back()">
        <i class="fas fa-arrow-left"></i>
      </div>
      <h2 class="page-title">
        {{ article?.title }}
        <span v-if="articleStore.error" class="error-message">
          {{ articleStore.error }}
        </span>
      </h2>
    </div>

    <!-- 文章主体与信息展示区域 -->
    <div class="story-view">
      <!-- 元数据信息栏 -->
      <div v-if="article" class="article-info">
        <div class="info-item">
          <i class="fas fa-calendar-alt"></i>
          <span>{{ formatDate(article.date) }}</span>
        </div>
        <div class="info-item">
          <i class="fas fa-file-word"></i>
          <span>约 {{ estimateWords }} 字</span>
        </div>
        <!-- 展示经过 Pretext 引擎精确测算的视觉行数 (仅在测算完成后显示) -->
        <div class="info-item" v-if="exactLineCount > 0">
          <i class="fas fa-align-left"></i>
          <span>排版共 {{ exactLineCount }} 行</span>
        </div>
        <!-- 展示基于字数估算的预计阅读时间 -->
        <div class="info-item">
          <i class="fas fa-coffee"></i>
          <span>阅读约 {{ readingTime }} 分钟</span>
        </div>
      </div>

      <!-- 核心内容渲染区：挂载高性能打字机组件 -->
      <div v-if="article" class="article-content markdown-content" @click="handleContentClick">
        <!-- 监听 update:lineCount 事件，接收底部引擎抛出的精准行数 -->
        <ContentTypeWriter
          :content="article.content || ''"
          :markdown-options="markdownOptions"
          :is-dark-theme="isDarkTheme"
          v-bind="settingsStore.typeWriter"
          @update:lineCount="updateLineCount"
        />
      </div>

      <!-- 加载状态占位符 -->
      <div v-else class="loading-wrapper glass-container">
        <i class="fas fa-circle-notch fa-spin"></i>
        <span>正在加载文章...</span>
      </div>
    </div>

    <!-- 底部：上一篇/下一篇 导航栏 -->
    <ArticleNavigation
      :prev-article="prevArticle"
      :next-article="nextArticle"
      :back-route-name="type === 'frontend' ? 'FrontEnd' : type === 'topics' ? 'Topics' : 'Novels'"
      :current-category="type"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * @file ArticleDetailView.vue
 * @description 文章详情视图组件。
 * 负责解析路由参数、拉取文章数据、整合 Markdown 渲染配置、
 * 以及接管全局阅读进度条的滚动监听逻辑。
 */

import { useArticleNavigation } from '@/composables/useArticleNavigation'
import { useReadingProgress } from '@/composables/useReadingProgress'
import { useArticleContent } from '@/composables/useArticleContent'
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { useCodeHighlight } from '@/composables/useCodeHighlight'
import { useArticleStore } from '@/views/stores/articleStore'
import { useArticleInfo } from '@/composables/useArticleInfo'
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { useToast } from '@/composables/useToast'
import { useRoute } from 'vue-router'

import ContentTypeWriter from '@/components/common/ContentTypeWriter.vue'
import ArticleNavigation from '@/components/ArticleNavigation.vue'

import '@/styles/correctContentMargin.css'
import '@/styles/articleContent.css'
import '@/styles/articleInfo.css'
import '@/styles/pageHeader.css'
import '@/styles/codeBlock.css'

// --- Store 与路由实例 ---
const settingsStore = useSettingsStore()
const route = useRoute()
const articleStore = useArticleStore()

const { notify } = useToast()

// --- 组合式函数状态解构 ---

// 1. 文章内容基础渲染工具
const { isDarkTheme, formatDate, markdownOptions: baseMarkdownOptions } = useArticleContent()

// 2. 全局二合一进度条状态池 (涵盖打字进度与阅读进度)
const { globalProgress, isTypingMode, showProgress } = useReadingProgress()

// 3. 代码高亮配置插件
const { codeHighlightOptions } = useCodeHighlight()

/**
 * @type {ComputedRef<MarkdownOptions>} markdownOptions
 * @description 最终传递给底层渲染器的 Markdown 配置。
 * 融合了基础配置 (linkify, html等) 与代码高亮 (highlight.js) 配置。
 */
const markdownOptions = {
  ...baseMarkdownOptions,
  ...codeHighlightOptions,
}

/**
 * @type {ComputedRef<'frontend' | 'topics' | 'novels'>} type
 * @description 根据当前路由的 URL 路径，动态推断文章所属的分类板块。
 */
const type = computed(() => {
  if (route.path.includes('/articles/topics/')) return 'topics'
  if (route.path.includes('/articles/novels/')) return 'novels'
  return 'frontend'
})

// 当前文章的响应式数据源
const article = computed(() => articleStore.currentArticle)
const articleContent = computed(() => article.value?.content || '')

// --- 文章元数据提取 ---
// 解构出字数、精确行数、阅读时间以及更新行数的回调函数
const { estimateWords, exactLineCount, readingTime, updateLineCount } =
  useArticleInfo(articleContent)

// --- 文章底部导航计算 ---
const currentId = computed(() => route.params.id as string)
const articles = computed(() => articleStore.getArticleList(type.value) || [])
const { prevArticle, nextArticle } = useArticleNavigation({
  articles,
  currentId,
})

/**
 * 滚动监听处理器：计算并派发全局阅读进度
 * @description
 * 在页面发生滚动时触发。
 * 若当前判定处于“打字机动画模式” (isTypingMode 为 true)，则拒绝篡改 globalProgress，
 * 将进度控制权保留给 ContentTypeWriter 组件。
 * 打字结束后，依据页面当前的滚动高度比例 (0% - 100%) 平滑更新阅读进度条。
 */
const handleReadingScroll = () => {
  // 防御机制：如果还在打字模式，滚动条不允许篡改进度awa！
  if (isTypingMode.value) return

  // 计算当前的垂直滚动距离与页面可滚动的总高度
  const scrollTop = window.scrollY || document.documentElement.scrollTop
  const docHeight = document.documentElement.scrollHeight - window.innerHeight

  if (docHeight > 0) {
    // 限制进度值在 0 到 100 之间
    globalProgress.value = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100))
  } else {
    // 边界处理：文章内容过短，未产生滚动条时，视作已读完
    globalProgress.value = 100
  }
}

/**
 * 文章内容区域的事件代理 (Event Delegation)
 * @description 拦截并处理 Markdown 动态渲染内容中的所有交互事件。
 * 依靠 CSS 驱动状态动画，JS 仅负责调用 API 与切换类名。
 */
const handleContentClick = async (e: MouseEvent) => {
  const target = e.target as HTMLElement
  const copyBtn = target.closest('.code-copy-btn') as HTMLButtonElement
  if (!copyBtn) return

  const rawCode = decodeURIComponent(copyBtn.dataset.code || '')

  try {
    await navigator.clipboard.writeText(rawCode)

    // 注入类名！
    copyBtn.classList.add('copied')

    // 2秒后撤销类名，恢复原状
    setTimeout(() => {
      copyBtn.classList.remove('copied')
    }, 2000)

    notify({
      type: 'success',
      message: '复制成功Ovo！',
    })
  } catch (err) {
    notify({
      type: 'error',
      title: '复制失败！QAQ',
      message: `${err}`,
    })
  }
}

// --- 生命周期钩子 ---

onMounted(async () => {
  // 1. 初始化拉取当前分类的文章索引
  await articleStore.fetchArticleIndex()

  // 2. 依据路由 ID 拉取目标文章全文
  if (typeof route.params.id === 'string') {
    await articleStore.fetchArticle(type.value, route.params.id as string)
    // 内容加载完毕后，平滑滚动至顶部，提供清爽的阅读起点
    if (article.value) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // 3. 开启全局顶部进度条的显示权限，并挂载被动式滚动监听器以优化性能
  showProgress.value = true
  window.addEventListener('scroll', handleReadingScroll, { passive: true })
})

onUnmounted(() => {
  // 离开当前文章详情页时，卸载进度条 UI 并移除事件监听，防止内存泄露与状态污染
  showProgress.value = false
  window.removeEventListener('scroll', handleReadingScroll)
})

/**
 * 路由参数监听器
 * @description 监听同路由下 ID 参数的变化 (例如点击了底部“下一篇”导航)。
 * 触发后重新拉取对应文章的数据并使页面平滑回滚至顶部。
 */
watch(
  () => route.params.id,
  async (id) => {
    if (typeof id === 'string') {
      // 容错处理：若 Store 中对应分类列表丢失，则先补偿拉取一次索引
      if (!(articleStore.getArticleList(type.value) || []).length) {
        await articleStore.fetchArticleIndex()
      }

      await articleStore.fetchArticle(type.value, id)

      if (article.value) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  },
  { immediate: false },
)
</script>
