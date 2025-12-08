<template>
  <div class="story-view-container">
    <div class="page-header">
      <div class="back-area" @click="$router.push({ name: 'Articles' })">
        <i class="fas fa-arrow-left"></i>
      </div>
      <h2 class="page-title">奇怪杂谈</h2>
    </div>
    <div class="story-view">
      <!-- 搜索和排序栏 -->
      <div class="filter-bar glass-container">
        <input v-model="searchText" type="text" class="search-input" placeholder="搜索文章..." />
        <button class="sort-button" @click="sortButton.toggle">
          <i :class="['fas', sortButton.icon]"></i>
          {{ sortButton.label }}
        </button>
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

      <!-- ✨ 新增：分页组件 -->
      <div v-if="pagination.totalPages > 1" class="pagination-controls glass-container">
        <button
          @click="pagination.prevPage"
          :disabled="pagination.currentPage === 1"
          class="pagination-btn"
        >
          <i class="fas fa-chevron-left"></i> 上一页
        </button>
        <span class="pagination-info">
          第 {{ pagination.currentPage }} 页 / 共 {{ pagination.totalPages }} 页
        </span>
        <button
          @click="pagination.nextPage"
          :disabled="pagination.currentPage === pagination.totalPages"
          class="pagination-btn"
        >
          下一页 <i class="fas fa-chevron-right"></i>
        </button>
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
import '@/styles/pagination.css'

const router = useRouter()
const articleStore = useArticleStore()
const { formatDate } = useArticleContent()

// 文章列表
const articles = computed(() => {
  const list = articleStore.getArticleList('topics') || []
  return list.map((article) => ({
    ...article,
    category: 'topics' as const,
  }))
})

// ✨ 修改：解构出 pagination
const { searchText, filteredItems, sortButton, pagination } = useSearchAndSort({
  items: articles,
  searchFields: (article) => [article.title],
  sortType: 'date',
  sortBy: (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  itemsPerPage: 6, //
})

// 确保组件挂载时加载数据
onMounted(async () => {
  if (!(articleStore.getArticleList('topics') || []).length) {
    await articleStore.fetchArticleIndex()
  }
})

// 跳转到具体文章
const readArticle = (articleId: string) => {
  router.push({
    name: 'TopicsArticle',
    params: { id: articleId },
  })
}
</script>

<style scoped>
.chapter-item::before {
  background: radial-gradient(circle at top right, rgba(204, 84, 20, 0.9), transparent);
}

.dark-theme .chapter-item::before {
  background: radial-gradient(circle at top right, rgba(144, 71, 20, 0.9), transparent);
}
</style>
