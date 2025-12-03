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

      <div v-else class="chapter-list">
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
import '@/styles/storyCard.css'
import '@/styles/pageHeader.css'
import '@/styles/searchBar.css'

const router = useRouter()
const articleStore = useArticleStore()
const { formatDate } = useArticleContent()

const articles = computed(() => {
  const list = articleStore.getArticleList('novels') || []
  return list.map((a) => ({ ...a, category: 'novels' as const }))
})

const { searchText, filteredItems } = useSearchAndSort({
  items: articles.value,
  searchFields: (article) => [article.title],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
})

onMounted(async () => {
  if (!(articleStore.getArticleList('novels') || []).length) {
    await articleStore.fetchArticleIndex()
  }
})

const readArticle = (id: string) => {
  router.push({ name: 'NovelsArticle', params: { id } })
}
</script>

<style scoped>
.chapter-item::before {
  background: radial-gradient(circle at top right, rgba(200, 120, 80, 0.12), transparent);
}
</style>
