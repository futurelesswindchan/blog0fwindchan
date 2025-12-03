<template>
  <div class="article-view-container">
    <div class="page-header">
      <div class="back-area" @click="$router.back()">
        <i class="fas fa-arrow-left"></i>
      </div>
      <h2 class="page-title">{{ article?.title }}</h2>
    </div>

    <div class="story-view">
      <div v-if="article" class="article-info">
        <div class="info-item">
          <i class="fas fa-calendar"></i>
          <span>{{ formatDate(article.date) }}</span>
        </div>
        <div class="info-item">
          <i class="fas fa-clock"></i>
          <span>文章约{{ estimateWords }}字</span>
        </div>
      </div>

      <div v-if="article" class="article-content markdown-content">
        <ContentTypeWriter
          :content="article.content || ''"
          :markdown-options="markdownOptions"
          :is-dark-theme="isDarkTheme"
          v-bind="settingsStore.typeWriter"
        />
      </div>

      <div v-else class="loading-wrapper glass-container">
        <i class="fas fa-circle-notch fa-spin"></i>
        <span>正在加载文章...</span>
      </div>
      <div v-if="articleStore.error" class="error-message">
        {{ articleStore.error }}
      </div>
    </div>
    <ArticleNavigation
      :prev-article="prevArticle"
      :next-article="nextArticle"
      :back-route-name="type === 'frontend' ? 'FrontEnd' : type === 'topics' ? 'Topics' : 'Novels'"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSettingsStore } from '@/views/stores/useSettingsStore'
import { useArticleStore } from '@/views/stores/articleStore'
import { useArticleContent } from '@/composables/useArticleContent'
import { useArticleInfo } from '@/composables/useArticleInfo'
import { useArticleNavigation } from '@/composables/useArticleNavigation'
import { useCodeHighlight } from '@/composables/useCodeHighlight'
import ArticleNavigation from '@/components/ArticleNavigation.vue'
import ContentTypeWriter from '@/components/common/ContentTypeWriter.vue'
import '@/styles/articleContent.css'
import '@/styles/articleInfo.css'
import '@/styles/pageHeader.css'
import '@/styles/codeBlock.css'

const settingsStore = useSettingsStore()

const route = useRoute()
const articleStore = useArticleStore()
const { isDarkTheme, formatDate, markdownOptions: baseMarkdownOptions } = useArticleContent()
const { codeHighlightOptions } = useCodeHighlight()

const markdownOptions = {
  ...baseMarkdownOptions,
  ...codeHighlightOptions,
}

const type = computed(() => {
  if (route.path.includes('/articles/topics/')) return 'topics'
  if (route.path.includes('/articles/novels/')) return 'novels'
  return 'frontend'
})

// 修复点 1：直接访问 state 中的 currentArticle
const article = computed(() => articleStore.currentArticle)

// 修复点 2：内容直接从 article 中获取
const articleContent = computed(() => article.value?.content || '')
const { estimateWords } = useArticleInfo(articleContent)

const currentId = computed(() => route.params.id as string)
const articles = computed(() => articleStore.getArticleList(type.value) || [])

const { prevArticle, nextArticle } = useArticleNavigation({
  articles,
  currentId,
})

onMounted(async () => {
  await articleStore.fetchArticleIndex()
  if (typeof route.params.id === 'string') {
    await articleStore.fetchArticle(type.value, route.params.id as string)
    if (article.value) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }
})

watch(
  () => route.params.id,
  async (id) => {
    if (typeof id === 'string') {
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
