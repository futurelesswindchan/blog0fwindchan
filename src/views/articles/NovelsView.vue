<template>
  <div class="story-view-container">
    <div class="page-header">
      <div class="back-area" @click="$router.push({ name: 'Articles' })">
        <i class="fas fa-arrow-left"></i>
      </div>
      <h2 class="page-title">幻想物语</h2>
    </div>
    <div class="story-view">
      <div class="filter-bar glass-container">
        <input
          v-model="searchText"
          type="text"
          class="search-input"
          placeholder="搜索小说/章节..."
        />
      </div>

      <div v-if="articleStore.isLoading" class="loading-wrapper glass-container">
        <i class="fas fa-circle-notch fa-spin"></i>
        <span>加载中...</span>
      </div>

      <div v-else-if="articleStore.error" class="error-message">{{ articleStore.error }}</div>

      <div
        v-else
        class="chapter-list type-writer"
        v-type-writer="{
          mode: 'both',
          delay: 200,
          elementDelay: 200,
          textDelay: 300,
        }"
      >
        <div
          v-for="article in filteredItems"
          :key="article.id"
          class="chapter-item glass-container"
          @click="readArticle(article.id)"
        >
          <div class="chapter-info">
            <span class="chapter-date">{{ formatDate(article.date) }}</span>
            <h3>{{ article.title }}</h3>
          </div>
          <i class="fas fa-chevron-right"></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useArticleStore } from '@/views/stores/articleStore'
import { useSearchAndSort } from '@/composables/useSearchAndSort'
import { useArticleContent } from '@/composables/useArticleContent'
import { vTypeWriter } from '@/directives/typeWriterDirective'
import '@/styles/storyCard.css'
import '@/styles/pageHeader.css'
import '@/styles/searchBar.css'
import '@/styles/typeWriter.css'

const router = useRouter()
const articleStore = useArticleStore()
const { formatDate } = useArticleContent()

// 小说文章列表
const articles = computed(() => {
  const list = articleStore.getArticleList('novels') || []
  return list.map((a) => ({ ...a, category: 'novels' as const }))
})

// 搜索和排序
const { searchText, filteredItems } = useSearchAndSort({
  // 这里原本是`articles.value`，现在已修正为`articles`
  // 确保传递的是计算属性本身，而不是其值
  // 否则会导致响应式更新失效
  items: articles,
  searchFields: (article) => [article.title],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
})

// 组件挂载时，获取小说文章列表
onMounted(async () => {
  if (!(articleStore.getArticleList('novels') || []).length) {
    await articleStore.fetchArticleIndex()
  }
})

// 阅读文章
const readArticle = (id: string) => {
  router.push({ name: 'NovelsArticle', params: { id } })
}
</script>

<style scoped>
.chapter-item::before {
  background: radial-gradient(circle at top right, rgba(19, 193, 158, 0.9), transparent);
}

.dark-theme .chapter-item::before {
  background: radial-gradient(circle at top right, rgba(16, 122, 100, 0.9), transparent);
}
</style>
